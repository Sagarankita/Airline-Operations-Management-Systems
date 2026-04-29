const router   = require('express').Router();
const { param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/reportingController');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: UC-10 Admin analytics, cross-module reporting, and heuristic delay prediction
 */

// ── Common date validators ────────────────────────────────────────────────────
const dateRange = [
  query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD'),
  query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD'),
];

// ── Composite admin dashboard — no params ────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/dashboard:
 *   get:
 *     summary: Composite admin home dashboard (single round-trip)
 *     tags: [Reports]
 *     description: |
 *       Returns today's key metrics in one call, optimised for the admin
 *       dashboard landing page.  Fields: flights_today, flights_boarding,
 *       flights_delayed_today, passengers_checked_in_today,
 *       emergency_maintenance_7d, avg_passenger_rating_30d.
 *     responses:
 *       200:
 *         description: Flat key-value dashboard object with generated_at timestamp
 */
router.get('/dashboard', ctrl.dashboard);

// ── Delay prediction ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/delay-prediction/{flightId}:
 *   get:
 *     summary: Heuristic delay risk prediction for a specific flight (UC-10)
 *     tags: [Reports]
 *     description: |
 *       Rule-based scoring across 7 factors:
 *       1. Aircraft In_Maintenance (+35)
 *       2. Aircraft 60-day delay history (up to +25)
 *       3. Route 90-day delay history (up to +20)
 *       4. Unfit crew members (+15 each, max +30)
 *       5. Emergency/Unscheduled maintenance last 30 days (+10 each, max +20)
 *       6. Peak departure hour 06–09 / 17–21 (+8)
 *       7. No crew assigned yet (+5)
 *
 *       Score is capped at 95. Risk levels: Low (≤20) / Moderate (≤40) / High (≤65) / Critical (>65).
 *       Returns N/A with explanation for Landed/Cancelled/Completed flights.
 *     parameters:
 *       - { in: path, name: flightId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: risk_percentage, risk_level, contributing_factors[], assumptions[]
 *       404:
 *         description: Flight not found
 */
router.get(
  '/delay-prediction/:flightId',
  validate([param('flightId').isInt({ min: 1 }).withMessage('flightId must be a positive integer')]),
  ctrl.delayPrediction
);

// ── Flight operations report ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/flight-operations:
 *   get:
 *     summary: Flight operations summary — statuses, routes, daily trend
 *     tags: [Reports]
 *     parameters:
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: source,      schema: { type: string } }
 *       - { in: query, name: dest,        schema: { type: string } }
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: |
 *           overall (totals + on_time_rate_pct),
 *           by_status [{label, value}] — pie chart,
 *           by_route  [{route, total_flights, delayed, delay_rate_pct}] — bar chart,
 *           by_date   [{label, total_flights, delayed, cancelled}] — line chart
 */
router.get(
  '/flight-operations',
  validate(dateRange),
  ctrl.flightOperations
);

// ── Delay analysis ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/delays:
 *   get:
 *     summary: Delay breakdown by route, aircraft, and reason
 *     tags: [Reports]
 *     parameters:
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: source,      schema: { type: string } }
 *       - { in: query, name: dest,        schema: { type: string } }
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: overall, by_route, by_aircraft, delay_reasons (for word-cloud / pie)
 */
router.get(
  '/delays',
  validate(dateRange),
  ctrl.delayAnalysis
);

// ── Fuel consumption report ───────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/fuel-consumption:
 *   get:
 *     summary: Fuel loaded / consumed / efficiency analytics
 *     tags: [Reports]
 *     parameters:
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: |
 *           overall (total_loaded, total_consumed, efficiency_pct, pending_consumed),
 *           by_aircraft [{label, total_loaded, efficiency_pct}] — grouped bar,
 *           trend [{label, loaded, consumed}] — dual-line chart
 */
router.get(
  '/fuel-consumption',
  validate([...dateRange, query('aircraft_id').optional().isInt()]),
  ctrl.fuelConsumption
);

// ── Maintenance trends report ─────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/maintenance-trends:
 *   get:
 *     summary: Maintenance frequency trends by type and aircraft
 *     tags: [Reports]
 *     parameters:
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *       - { in: query, name: type,        schema: { type: string,
 *             enum: [Scheduled,Unscheduled,Emergency] } }
 *     responses:
 *       200:
 *         description: |
 *           overall (total, emergency, unscheduled, scheduled),
 *           by_type [{label, value}] — donut chart,
 *           by_aircraft [{label, total, emergency}] — bar chart,
 *           monthly_trend [{label, total, emergency, unscheduled}] — stacked bar
 */
router.get(
  '/maintenance-trends',
  validate([
    ...dateRange,
    query('aircraft_id').optional().isInt(),
    query('type').optional().isIn(['Scheduled','Unscheduled','Emergency']),
  ]),
  ctrl.maintenanceTrends
);

// ── Staff utilization report ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/staff-utilization:
 *   get:
 *     summary: Crew utilization — duty hours, flight counts, pending duty logs
 *     tags: [Reports]
 *     parameters:
 *       - { in: query, name: from_date, schema: { type: string, format: date } }
 *       - { in: query, name: to_date,   schema: { type: string, format: date } }
 *       - { in: query, name: role,      schema: { type: string,
 *             enum: [Pilot, Cabin_Crew] } }
 *     responses:
 *       200:
 *         description: |
 *           by_employee (full utilization table — sortable in UI),
 *           by_role [{role, count, total_duty_hours, flights_assigned}] — bar chart
 */
router.get(
  '/staff-utilization',
  validate([
    ...dateRange,
    query('role').optional().isIn(['Pilot','Cabin_Crew']).withMessage('role must be Pilot or Cabin_Crew'),
  ]),
  ctrl.staffUtilization
);

// ── Passenger feedback report ─────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reports/passenger-feedback:
 *   get:
 *     summary: Passenger satisfaction analytics
 *     tags: [Reports]
 *     parameters:
 *       - { in: query, name: from_date,  schema: { type: string, format: date } }
 *       - { in: query, name: to_date,    schema: { type: string, format: date } }
 *       - { in: query, name: flight_id,  schema: { type: integer } }
 *     responses:
 *       200:
 *         description: |
 *           overall (avg_rating, five_star, low_rated, total_reviews),
 *           distribution [{label(1-5), value}] — bar chart,
 *           lowest_rated flights [{route, avg_rating}] — attention list,
 *           satisfaction_trend [{label(date), avg_rating}] — line chart
 */
router.get(
  '/passenger-feedback',
  validate([...dateRange, query('flight_id').optional().isInt()]),
  ctrl.passengerFeedback
);

module.exports = router;
