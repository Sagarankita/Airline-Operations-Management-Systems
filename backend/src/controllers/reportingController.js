/**
 * reportingController.js — UC-10 Admin Reporting + Heuristic Delay Prediction
 *
 * All analytics queries use existing schema indexes:
 *   idx_flight_departure, idx_flight_source/dest, idx_schedule_status,
 *   idx_maint_date/aircraft, idx_fuel_date/aircraft, idx_reservation_status
 *
 * LATERAL JOIN pattern (latest flight_schedule per flight) is used consistently
 * and is served by the FK index on flight_schedule(flight_id).
 */

const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Shared fragment: latest schedule status for each flight ──────────────────
const SCHED_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT status, delay_reason FROM flight_schedule
    WHERE flight_id = f.flight_id
    ORDER BY schedule_date DESC LIMIT 1
  ) fs ON TRUE`;

// ─── Helper: build date + dimension WHERE clause ──────────────────────────────
const buildFlightWhere = (q) => {
  const { from_date, to_date, source, dest, aircraft_id } = q;
  const conds  = [];
  const params = [];
  let   idx    = 1;

  if (from_date)   { conds.push(`f.departure_time >= $${idx}::date`);              params.push(from_date);                idx++; }
  if (to_date)     { conds.push(`f.departure_time <  ($${idx}::date + 1)`);        params.push(to_date);                 idx++; }
  if (source)      { conds.push(`f.source_airport_code = $${idx}`);                params.push(source.toUpperCase());    idx++; }
  if (dest)        { conds.push(`f.dest_airport_code   = $${idx}`);                params.push(dest.toUpperCase());      idx++; }
  if (aircraft_id) { conds.push(`f.aircraft_id = $${idx}`);                       params.push(aircraft_id);             idx++; }

  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params, nextIdx: idx };
};

// =============================================================================
// 1. HEURISTIC DELAY PREDICTION (UC-10)
// =============================================================================

const delayPrediction = async (req, res, next) => {
  try {
    const { flightId } = req.params;

    // ── Fetch flight + current status + aircraft status ─────────────────────
    const { rows: [fl] } = await pool.query(
      `SELECT f.*,
              COALESCE(fs.status,'Scheduled') AS schedule_status,
              ac.status                       AS aircraft_status,
              EXTRACT(HOUR FROM f.departure_time) AS dep_hour
       FROM flight f
       JOIN aircraft ac ON ac.aircraft_id = f.aircraft_id
       ${SCHED_LATERAL}
       WHERE f.flight_id = $1`,
      [flightId]
    );
    if (!fl) return next(AppError.notFound('Flight not found'));

    // Terminal states — prediction not applicable
    if (['Landed', 'Completed', 'Cancelled'].includes(fl.schedule_status)) {
      return ApiResponse.success(res, {
        flight_id:           parseInt(flightId),
        risk_percentage:     null,
        risk_level:          'N/A',
        message:             `Flight is already '${fl.schedule_status}' — prediction not applicable`,
        contributing_factors: [],
        assumptions:         [],
        assessed_at:         new Date().toISOString(),
      });
    }

    // ── Run all data lookups in parallel ────────────────────────────────────
    const [acHistRes, routeHistRes, crewFitnessRes, maintRes, crewCountRes] =
      await Promise.all([
        // Aircraft delay rate (last 60 days, excluding current flight)
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(CASE WHEN fs.status = 'Delayed' THEN 1 END) AS delayed
           FROM flight f ${SCHED_LATERAL}
           WHERE f.aircraft_id = $1 AND f.flight_id != $2
             AND f.departure_time > NOW() - INTERVAL '60 days'`,
          [fl.aircraft_id, flightId]
        ),
        // Route delay rate (last 90 days)
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(CASE WHEN fs.status = 'Delayed' THEN 1 END) AS delayed
           FROM flight f ${SCHED_LATERAL}
           WHERE f.source_airport_code = $1 AND f.dest_airport_code = $2
             AND f.flight_id != $3
             AND f.departure_time > NOW() - INTERVAL '90 days'`,
          [fl.source_airport_code, fl.dest_airport_code, flightId]
        ),
        // Unfit crew on this flight
        pool.query(
          `SELECT COUNT(*) AS unfit_count
           FROM crew_assignment ca
           LEFT JOIN pilot      p  ON p.emp_id  = ca.emp_id
           LEFT JOIN cabin_crew cc ON cc.emp_id = ca.emp_id
           WHERE ca.flight_id = $1
             AND (p.fitness = 'Unfit' OR cc.fitness = 'Unfit')`,
          [flightId]
        ),
        // Emergency/Unscheduled maintenance in last 30 days for this aircraft
        pool.query(
          `SELECT COUNT(*) AS critical_count
           FROM maintenance_log
           WHERE aircraft_id = $1
             AND maintenance_type IN ('Emergency','Unscheduled')
             AND date > CURRENT_DATE - INTERVAL '30 days'`,
          [fl.aircraft_id]
        ),
        // Crew assigned?
        pool.query(
          'SELECT COUNT(*) AS count FROM crew_assignment WHERE flight_id = $1', [flightId]
        ),
      ]);

    // ── Score computation ────────────────────────────────────────────────────
    let   score   = 0;
    const factors = [];

    // F1: Aircraft currently In_Maintenance — hard indicator
    if (fl.aircraft_status === 'In_Maintenance') {
      score += 35;
      factors.push({
        factor:      'aircraft_in_maintenance',
        description: 'Aircraft is currently In_Maintenance',
        weight:      35,
        severity:    'critical',
      });
    }

    // F2: Aircraft delay history
    const acTotal   = parseInt(acHistRes.rows[0].total);
    const acDelayed = parseInt(acHistRes.rows[0].delayed);
    if (acTotal > 0) {
      const rate   = acDelayed / acTotal;
      const weight = Math.round(rate * 25);
      if (weight > 0) {
        score += weight;
        factors.push({
          factor:      'aircraft_delay_history',
          description: `Aircraft delayed ${acDelayed}/${acTotal} flights in last 60 days (${Math.round(rate * 100)}%)`,
          weight,
          severity:    rate > 0.5 ? 'high' : 'medium',
        });
      }
    }

    // F3: Route delay history
    const routeTotal   = parseInt(routeHistRes.rows[0].total);
    const routeDelayed = parseInt(routeHistRes.rows[0].delayed);
    if (routeTotal > 0) {
      const rate   = routeDelayed / routeTotal;
      const weight = Math.round(rate * 20);
      if (weight > 0) {
        score += weight;
        factors.push({
          factor:      'route_delay_history',
          description: `Route ${fl.source_airport_code}→${fl.dest_airport_code}: ` +
                       `${routeDelayed}/${routeTotal} delayed in last 90 days (${Math.round(rate * 100)}%)`,
          weight,
          severity:    rate > 0.5 ? 'high' : 'low',
        });
      }
    }

    // F4: Unfit crew
    const unfitCount = parseInt(crewFitnessRes.rows[0].unfit_count);
    if (unfitCount > 0) {
      const weight = Math.min(unfitCount * 15, 30);
      score += weight;
      factors.push({
        factor:      'crew_fitness_issues',
        description: `${unfitCount} assigned crew member(s) marked Unfit`,
        weight,
        severity:    'critical',
      });
    }

    // F5: Recent critical maintenance
    const criticalMaint = parseInt(maintRes.rows[0].critical_count);
    if (criticalMaint > 0) {
      const weight = Math.min(criticalMaint * 10, 20);
      score += weight;
      factors.push({
        factor:      'recent_critical_maintenance',
        description: `${criticalMaint} Emergency/Unscheduled maintenance record(s) in last 30 days`,
        weight,
        severity:    'high',
      });
    }

    // F6: Peak departure hour (06–09 or 17–21 local proxy)
    const depHour = parseInt(fl.dep_hour);
    if ((depHour >= 6 && depHour <= 9) || (depHour >= 17 && depHour <= 21)) {
      score += 8;
      factors.push({
        factor:      'peak_departure_hour',
        description: `Departure at ${depHour}:00 falls in peak traffic window`,
        weight:      8,
        severity:    'low',
      });
    }

    // F7: No crew assigned yet
    if (parseInt(crewCountRes.rows[0].count) === 0) {
      score += 5;
      factors.push({
        factor:      'no_crew_assigned',
        description: 'No crew members have been assigned to this flight yet',
        weight:      5,
        severity:    'low',
      });
    }

    // Cap at 95 — no heuristic can claim certainty
    score = Math.min(Math.round(score), 95);

    const risk_level =
      score <= 20 ? 'Low' :
      score <= 40 ? 'Moderate' :
      score <= 65 ? 'High'     : 'Critical';

    const assumptions = [
      'Prediction is heuristic-based; no ML model is applied',
      'Aircraft delay history window: 60 days',
      'Route delay history window: 90 days',
      'Peak hours proxy: 06:00–09:00 and 17:00–21:00 (no real-time weather data)',
      'Score is capped at 95 — no deterministic prediction is guaranteed',
    ];
    if (acTotal  === 0) assumptions.push('No aircraft history found — aircraft delay factor not applied');
    if (routeTotal === 0) assumptions.push('No route history found — route delay factor not applied');

    return ApiResponse.success(res, {
      flight_id:            parseInt(flightId),
      aircraft_id:          fl.aircraft_id,
      route:                `${fl.source_airport_code} → ${fl.dest_airport_code}`,
      departure_time:       fl.departure_time,
      current_status:       fl.schedule_status,
      risk_percentage:      score,
      risk_level,
      contributing_factors: factors.sort((a, b) => b.weight - a.weight),
      assumptions,
      assessed_at:          new Date().toISOString(),
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 2. FLIGHT OPERATIONS REPORT
// =============================================================================

const flightOperations = async (req, res, next) => {
  try {
    const { where, params, nextIdx } = buildFlightWhere(req.query);
    const idx = nextIdx;

    const [overallRes, byStatusRes, byRouteRes, byDateRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                                              AS total_flights,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Scheduled'  THEN 1 END) AS scheduled,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Boarding'   THEN 1 END) AS boarding,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Departed'   THEN 1 END) AS departed,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'En_Route'   THEN 1 END) AS en_route,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Landed'     THEN 1 END) AS landed,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed'    THEN 1 END) AS delayed,
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Cancelled'  THEN 1 END) AS cancelled,
           ROUND(
             COUNT(CASE WHEN COALESCE(fs.status,'Scheduled')
                          NOT IN ('Delayed','Cancelled') THEN 1 END)::numeric
             / NULLIF(COUNT(*),0) * 100, 2
           )                                                                     AS on_time_rate_pct
         FROM flight f ${SCHED_LATERAL} ${where}`,
        params
      ),
      pool.query(
        `SELECT COALESCE(fs.status,'Scheduled') AS label, COUNT(*) AS value
         FROM flight f ${SCHED_LATERAL} ${where}
         GROUP BY COALESCE(fs.status,'Scheduled')
         ORDER BY value DESC`,
        params
      ),
      pool.query(
        `SELECT f.source_airport_code, f.dest_airport_code,
                f.source_airport_code || '→' || f.dest_airport_code AS route,
                COUNT(*)                                              AS total_flights,
                COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed'   THEN 1 END) AS delayed,
                COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Cancelled' THEN 1 END) AS cancelled,
                ROUND(
                  COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END)::numeric
                  / NULLIF(COUNT(*),0) * 100, 2
                ) AS delay_rate_pct
         FROM flight f ${SCHED_LATERAL} ${where}
         GROUP BY f.source_airport_code, f.dest_airport_code
         ORDER BY total_flights DESC LIMIT 10`,
        params
      ),
      pool.query(
        `SELECT DATE(f.departure_time) AS label,
                COUNT(*)               AS total_flights,
                COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed'   THEN 1 END) AS delayed,
                COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Cancelled' THEN 1 END) AS cancelled
         FROM flight f ${SCHED_LATERAL} ${where}
         GROUP BY DATE(f.departure_time)
         ORDER BY label ASC`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:   overallRes.rows[0],
      by_status: byStatusRes.rows,   // chart: pie/bar
      by_route:  byRouteRes.rows,    // chart: horizontal bar
      by_date:   byDateRes.rows,     // chart: line trend
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 3. DELAY ANALYSIS REPORT
// =============================================================================

const delayAnalysis = async (req, res, next) => {
  try {
    const { where, params, nextIdx } = buildFlightWhere(req.query);

    const [overallRes, byRouteRes, byAircraftRes, reasonsRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END) AS total_delayed,
           COUNT(*) AS total_flights,
           ROUND(
             COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END)::numeric
             / NULLIF(COUNT(*),0) * 100, 2
           ) AS overall_delay_rate_pct
         FROM flight f ${SCHED_LATERAL} ${where}`,
        params
      ),
      pool.query(
        `SELECT f.source_airport_code || '→' || f.dest_airport_code AS label,
                COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END) AS delayed,
                COUNT(*) AS total
         FROM flight f ${SCHED_LATERAL} ${where}
         GROUP BY f.source_airport_code, f.dest_airport_code
         HAVING COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END) > 0
         ORDER BY delayed DESC LIMIT 10`,
        params
      ),
      pool.query(
        `SELECT f.aircraft_id, ac.model AS label,
                COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END) AS delayed,
                COUNT(*) AS total
         FROM flight f ${SCHED_LATERAL}
         JOIN aircraft ac ON ac.aircraft_id = f.aircraft_id
         ${where}
         GROUP BY f.aircraft_id, ac.model
         HAVING COUNT(CASE WHEN COALESCE(fs.status,'Scheduled') = 'Delayed' THEN 1 END) > 0
         ORDER BY delayed DESC LIMIT 10`,
        params
      ),
      // Delay reasons — partial text match grouping
      pool.query(
        `SELECT COALESCE(fs.delay_reason, 'Not specified') AS reason, COUNT(*) AS count
         FROM flight f ${SCHED_LATERAL} ${where}
         WHERE COALESCE(fs.status,'Scheduled') = 'Delayed'
         GROUP BY fs.delay_reason ORDER BY count DESC LIMIT 20`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:     overallRes.rows[0],
      by_route:    byRouteRes.rows,    // chart: bar
      by_aircraft: byAircraftRes.rows, // chart: bar
      delay_reasons: reasonsRes.rows,  // chart: pie / word cloud
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 4. FUEL CONSUMPTION REPORT
// =============================================================================

const fuelConsumption = async (req, res, next) => {
  try {
    const { from_date, to_date, aircraft_id } = req.query;
    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (from_date)   { conds.push(`fl.fuel_date >= $${idx}::date`); params.push(from_date);   idx++; }
    if (to_date)     { conds.push(`fl.fuel_date <= $${idx}::date`); params.push(to_date);     idx++; }
    if (aircraft_id) { conds.push(`fl.aircraft_id = $${idx}`);      params.push(aircraft_id); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [overallRes, byAcRes, trendRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                    AS total_logs,
           ROUND(SUM(fl.fuel_loaded),   2)             AS total_loaded,
           ROUND(SUM(fl.fuel_consumed), 2)             AS total_consumed,
           ROUND(AVG(fl.fuel_loaded),   2)             AS avg_loaded_per_flight,
           ROUND(
             CASE WHEN SUM(fl.fuel_loaded) > 0
               THEN SUM(fl.fuel_consumed) / SUM(fl.fuel_loaded) * 100
             END, 2
           )                                           AS efficiency_pct,
           COUNT(CASE WHEN fl.fuel_consumed IS NULL THEN 1 END) AS pending_consumed
         FROM fuel_log fl ${where}`,
        params
      ),
      pool.query(
        `SELECT ac.model AS label, fl.aircraft_id,
                ROUND(SUM(fl.fuel_loaded),   2) AS total_loaded,
                ROUND(SUM(fl.fuel_consumed), 2) AS total_consumed,
                ROUND(AVG(fl.fuel_loaded),   2) AS avg_per_flight,
                ROUND(
                  CASE WHEN SUM(fl.fuel_loaded) > 0
                    THEN SUM(fl.fuel_consumed) / SUM(fl.fuel_loaded) * 100
                  END, 2
                )                               AS efficiency_pct
         FROM fuel_log fl
         JOIN aircraft ac ON ac.aircraft_id = fl.aircraft_id
         ${where}
         GROUP BY fl.aircraft_id, ac.model
         ORDER BY total_loaded DESC`,
        params
      ),
      pool.query(
        `SELECT fl.fuel_date AS label,
                ROUND(SUM(fl.fuel_loaded),   2) AS loaded,
                ROUND(SUM(fl.fuel_consumed), 2) AS consumed
         FROM fuel_log fl ${where}
         GROUP BY fl.fuel_date ORDER BY fl.fuel_date ASC`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:     overallRes.rows[0],
      by_aircraft: byAcRes.rows,   // chart: grouped bar
      trend:       trendRes.rows,  // chart: dual-line (loaded vs consumed)
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 5. MAINTENANCE TRENDS REPORT
// =============================================================================

const maintenanceTrends = async (req, res, next) => {
  try {
    const { from_date, to_date, aircraft_id, type } = req.query;
    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (from_date)   { conds.push(`ml.date >= $${idx}::date`);             params.push(from_date);   idx++; }
    if (to_date)     { conds.push(`ml.date <= $${idx}::date`);             params.push(to_date);     idx++; }
    if (aircraft_id) { conds.push(`ml.aircraft_id = $${idx}`);             params.push(aircraft_id); idx++; }
    if (type)        { conds.push(`ml.maintenance_type = $${idx}`);        params.push(type);        idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [overallRes, byTypeRes, byAcRes, trendRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(CASE WHEN maintenance_type = 'Emergency'   THEN 1 END) AS emergency,
                COUNT(CASE WHEN maintenance_type = 'Unscheduled' THEN 1 END) AS unscheduled,
                COUNT(CASE WHEN maintenance_type = 'Scheduled'   THEN 1 END) AS scheduled
         FROM maintenance_log ml ${where}`,
        params
      ),
      pool.query(
        `SELECT maintenance_type AS label, COUNT(*) AS value
         FROM maintenance_log ml ${where}
         GROUP BY maintenance_type ORDER BY value DESC`,
        params
      ),
      pool.query(
        `SELECT ac.model AS label, ml.aircraft_id,
                COUNT(*) AS total,
                COUNT(CASE WHEN ml.maintenance_type = 'Emergency' THEN 1 END) AS emergency
         FROM maintenance_log ml
         JOIN aircraft ac ON ac.aircraft_id = ml.aircraft_id
         ${where}
         GROUP BY ml.aircraft_id, ac.model
         ORDER BY total DESC LIMIT 10`,
        params
      ),
      pool.query(
        `SELECT DATE_TRUNC('month', ml.date::timestamptz)::date AS label,
                COUNT(*) AS total,
                COUNT(CASE WHEN maintenance_type = 'Emergency'   THEN 1 END) AS emergency,
                COUNT(CASE WHEN maintenance_type = 'Unscheduled' THEN 1 END) AS unscheduled
         FROM maintenance_log ml ${where}
         GROUP BY DATE_TRUNC('month', ml.date::timestamptz)
         ORDER BY label ASC`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:     overallRes.rows[0],
      by_type:     byTypeRes.rows,    // chart: donut
      by_aircraft: byAcRes.rows,      // chart: bar
      monthly_trend: trendRes.rows,   // chart: stacked bar (by type)
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 6. STAFF UTILIZATION REPORT
// =============================================================================

const staffUtilization = async (req, res, next) => {
  try {
    const { from_date, to_date, role } = req.query;

    const dateConds  = [];
    const dateParams = [];
    let   idx        = 1;

    if (from_date) { dateConds.push(`dl.duty_start >= $${idx}::date`); dateParams.push(from_date); idx++; }
    if (to_date)   { dateConds.push(`dl.duty_start <  ($${idx}::date + 1)`); dateParams.push(to_date); idx++; }

    const dutyFilter = dateConds.length ? dateConds.join(' AND ') : 'TRUE';

    const roleFilter = role ? `AND e.role = $${idx}` : '';
    if (role) dateParams.push(role);

    const { rows: utilization } = await pool.query(
      `SELECT
         e.emp_id, e.name, e.role,
         COUNT(DISTINCT ca.flight_id)                                       AS flights_assigned,
         COUNT(DISTINCT dl.duty_id)                                          AS duty_logs_submitted,
         ROUND(
           COALESCE(SUM(
             CASE WHEN ${dutyFilter}
               THEN EXTRACT(EPOCH FROM (dl.duty_end - dl.duty_start)) / 3600.0
             END
           ), 0), 2
         )                                                                   AS total_duty_hours,
         COUNT(DISTINCT CASE
           WHEN COALESCE(fss.status,'Scheduled') IN ('Landed','Completed')
            AND dl.duty_id IS NULL
           THEN ca.flight_id
         END)                                                                AS pending_duty_logs
       FROM employee e
       JOIN crew_assignment ca ON ca.emp_id    = e.emp_id
       JOIN flight f            ON f.flight_id = ca.flight_id
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fss ON TRUE
       LEFT JOIN duty_log dl ON dl.emp_id = e.emp_id
       WHERE e.role IN ('Pilot','Cabin_Crew') ${roleFilter}
       GROUP BY e.emp_id, e.name, e.role
       ORDER BY total_duty_hours DESC`,
      dateParams
    );

    // By-role summary
    const byRole = utilization.reduce((acc, r) => {
      const key = r.role;
      if (!acc[key]) acc[key] = { role: key, count: 0, total_duty_hours: 0, flights_assigned: 0 };
      acc[key].count++;
      acc[key].total_duty_hours   = +(parseFloat(acc[key].total_duty_hours) + parseFloat(r.total_duty_hours)).toFixed(2);
      acc[key].flights_assigned  += parseInt(r.flights_assigned);
      return acc;
    }, {});

    return ApiResponse.success(res, {
      by_employee: utilization,           // table: crew utilization rows
      by_role:     Object.values(byRole), // chart: grouped bar
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 7. PASSENGER FEEDBACK REPORT
// =============================================================================

const passengerFeedback = async (req, res, next) => {
  try {
    const { from_date, to_date, flight_id } = req.query;
    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (from_date) { conds.push(`fb.feedback_date >= $${idx}::date`); params.push(from_date); idx++; }
    if (to_date)   { conds.push(`fb.feedback_date <= $${idx}::date`); params.push(to_date);   idx++; }
    if (flight_id) { conds.push(`fb.flight_id = $${idx}`);            params.push(flight_id); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [overallRes, distRes, byFlightRes, trendRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                           AS total_reviews,
           ROUND(AVG(fb.rating), 2)           AS avg_rating,
           COUNT(CASE WHEN rating = 5  THEN 1 END) AS five_star,
           COUNT(CASE WHEN rating = 4  THEN 1 END) AS four_star,
           COUNT(CASE WHEN rating = 3  THEN 1 END) AS three_star,
           COUNT(CASE WHEN rating <= 2 THEN 1 END) AS low_rated
         FROM feedback fb ${where}`,
        params
      ),
      pool.query(
        `SELECT rating AS label, COUNT(*) AS value
         FROM feedback fb ${where}
         GROUP BY rating ORDER BY rating DESC`,
        params
      ),
      pool.query(
        `SELECT fb.flight_id,
                f.source_airport_code || '→' || f.dest_airport_code AS route,
                COUNT(*) AS reviews,
                ROUND(AVG(fb.rating), 2) AS avg_rating
         FROM feedback fb JOIN flight f ON f.flight_id = fb.flight_id
         ${where}
         GROUP BY fb.flight_id, f.source_airport_code, f.dest_airport_code
         ORDER BY avg_rating ASC LIMIT 10`,   // lowest-rated flights for admin attention
        params
      ),
      pool.query(
        `SELECT fb.feedback_date AS label, ROUND(AVG(fb.rating), 2) AS avg_rating, COUNT(*) AS reviews
         FROM feedback fb ${where}
         GROUP BY fb.feedback_date ORDER BY label ASC`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:          overallRes.rows[0],
      distribution:     distRes.rows,       // chart: bar (star distribution)
      lowest_rated:     byFlightRes.rows,   // table: flights needing attention
      satisfaction_trend: trendRes.rows,    // chart: line (avg rating over time)
    });
  } catch (err) { next(err); }
};

// =============================================================================
// 8. COMPOSITE DASHBOARD SUMMARY (single round-trip for admin home)
// =============================================================================

const dashboard = async (req, res, next) => {
  try {
    const [
      flightsTodayRes, boardingNowRes, delayedTodayRes,
      checkedInTodayRes, emergencyMaintRes, avgRatingRes,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS value FROM flight
         WHERE DATE(departure_time) = CURRENT_DATE`
      ),
      pool.query(
        `SELECT COUNT(*) AS value FROM flight f ${SCHED_LATERAL}
         WHERE COALESCE(fs.status,'Scheduled') = 'Boarding'`
      ),
      pool.query(
        `SELECT COUNT(*) AS value FROM flight f ${SCHED_LATERAL}
         WHERE DATE(f.departure_time) = CURRENT_DATE
           AND COALESCE(fs.status,'Scheduled') = 'Delayed'`
      ),
      pool.query(
        `SELECT COUNT(*) AS value FROM reservation r
         JOIN flight f ON f.flight_id = r.flight_id
         WHERE DATE(f.departure_time) = CURRENT_DATE AND r.status = 'Checked_In'`
      ),
      pool.query(
        `SELECT COUNT(*) AS value FROM maintenance_log
         WHERE maintenance_type = 'Emergency'
           AND date > CURRENT_DATE - INTERVAL '7 days'`
      ),
      pool.query(
        `SELECT ROUND(AVG(rating), 2) AS value FROM feedback
         WHERE feedback_date > CURRENT_DATE - INTERVAL '30 days'`
      ),
    ]);

    return ApiResponse.success(res, {
      flights_today:       parseInt(flightsTodayRes.rows[0].value),
      flights_boarding:    parseInt(boardingNowRes.rows[0].value),
      flights_delayed_today: parseInt(delayedTodayRes.rows[0].value),
      passengers_checked_in_today: parseInt(checkedInTodayRes.rows[0].value),
      emergency_maintenance_7d: parseInt(emergencyMaintRes.rows[0].value),
      avg_passenger_rating_30d: avgRatingRes.rows[0].value,
      generated_at: new Date().toISOString(),
    });
  } catch (err) { next(err); }
};

module.exports = {
  delayPrediction,
  flightOperations,
  delayAnalysis,
  fuelConsumption,
  maintenanceTrends,
  staffUtilization,
  passengerFeedback,
  dashboard,
};
