const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/fuelLogController');

/**
 * @swagger
 * tags:
 *   name: FuelLogs
 *   description: Aircraft fueling records and efficiency analytics (UC-18)
 */

// ── Admin summary + efficiency report — before /:id ─────────────────────────
/**
 * @swagger
 * /api/v1/fuel-logs/summary:
 *   get:
 *     summary: Admin fuel efficiency and consumption report
 *     tags: [FuelLogs]
 *     description: |
 *       overall (total_loaded, total_consumed, avg_per_flight, efficiency_pct),
 *       by_aircraft, and by_date trend (last 30 days).
 *     parameters:
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: overall, by_aircraft, by_date
 */
router.get(
  '/summary',
  validate([
    query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD'),
    query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD'),
    query('aircraft_id').optional().isInt(),
  ]),
  ctrl.summary
);

// ── Fuel history for an aircraft — before /:id ───────────────────────────────
/**
 * @swagger
 * /api/v1/fuel-logs/aircraft/{aircraftId}:
 *   get:
 *     summary: Fuel history for an aircraft (reverse-chronological)
 *     tags: [FuelLogs]
 *     parameters:
 *       - { in: path,  name: aircraftId, required: true, schema: { type: integer } }
 *       - { in: query, name: from_date,  schema: { type: string, format: date } }
 *       - { in: query, name: to_date,    schema: { type: string, format: date } }
 *       - { in: query, name: page,       schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,      schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated fuel logs with efficiency_pct per log
 */
router.get(
  '/aircraft/:aircraftId',
  validate([param('aircraftId').isInt().withMessage('Aircraft ID must be an integer')]),
  ctrl.getByAircraft
);

// ── Fuel log for a specific flight — before /:id ─────────────────────────────
/**
 * @swagger
 * /api/v1/fuel-logs/flight/{flightId}:
 *   get:
 *     summary: Fuel log(s) for a specific flight
 *     tags: [FuelLogs]
 *     parameters:
 *       - { in: path, name: flightId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Array of fuel logs for the flight
 */
router.get(
  '/flight/:flightId',
  validate([param('flightId').isInt().withMessage('Flight ID must be an integer')]),
  ctrl.getByFlight
);

// ── Admin list ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/fuel-logs:
 *   get:
 *     summary: List fuel logs (admin, filterable, paginated)
 *     tags: [FuelLogs]
 *     parameters:
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *       - { in: query, name: flight_id,   schema: { type: integer } }
 *       - { in: query, name: emp_id,      schema: { type: integer } }
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: sort_by,     schema: { type: string } }
 *       - { in: query, name: order,       schema: { type: string, enum: [asc,desc] } }
 *       - { in: query, name: page,        schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,       schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated fuel logs with per-row efficiency_pct
 */
router.get('/', ctrl.list);

// ── Single record ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Fuel log ID must be an integer')]),
  ctrl.getById
);

// ── Create ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/fuel-logs:
 *   post:
 *     summary: Log fuel loaded for a flight (UC-18)
 *     tags: [FuelLogs]
 *     description: |
 *       Guards enforced:
 *       - Aircraft must be Active
 *       - Aircraft must match the flight's assigned aircraft
 *       - fuel_loaded must be > 0
 *       - fuel_consumed (if provided) must be >= 0
 *       - emp_id (if provided) must be an Active Fuel_Staff employee
 *       - Auditable: no hard delete — records retained permanently
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             flight_id:     1
 *             aircraft_id:   1
 *             fuel_loaded:   18500.00
 *             fuel_date:     "2025-06-01"
 *             emp_id:        7
 *     responses:
 *       201:
 *         description: Fuel log created
 *       400:
 *         description: Aircraft/flight mismatch, invalid quantity, or wrong staff role
 */
router.post(
  '/',
  validate([
    body('flight_id').isInt({ min: 1 }).withMessage('flight_id must be a positive integer'),
    body('aircraft_id').isInt({ min: 1 }).withMessage('aircraft_id must be a positive integer'),
    body('fuel_loaded')
      .isFloat({ gt: 0 }).withMessage('fuel_loaded must be a number greater than 0'),
    body('fuel_consumed')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('fuel_consumed must be >= 0'),
    body('fuel_date').optional().isDate().withMessage('fuel_date must be YYYY-MM-DD'),
    body('emp_id').optional().isInt({ min: 1 }).withMessage('emp_id must be a positive integer'),
  ]),
  ctrl.create
);

// ── Update (add/correct fuel_consumed after flight) ───────────────────────────
/**
 * @swagger
 * /api/v1/fuel-logs/{id}:
 *   put:
 *     summary: Update a fuel log — typically to record fuel_consumed post-flight (UC-18)
 *     tags: [FuelLogs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fuel_loaded:   { type: number, minimum: 0.01 }
 *               fuel_consumed: { type: number, minimum: 0 }
 *               fuel_date:     { type: string, format: date }
 *     responses:
 *       200:
 *         description: Updated fuel log
 *       404:
 *         description: Not found
 */
router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Fuel log ID must be an integer'),
    body('fuel_loaded')
      .optional()
      .isFloat({ gt: 0 }).withMessage('fuel_loaded must be > 0'),
    body('fuel_consumed')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('fuel_consumed must be >= 0'),
    body('fuel_date').optional().isDate(),
  ]),
  ctrl.update
);

module.exports = router;
