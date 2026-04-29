const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/dutyLogController');

/**
 * @swagger
 * tags:
 *   name: DutyLogs
 *   description: Crew duty logging and compliance tracking (UC-14)
 */

// ── Admin summary — must be before /:id ──────────────────────────────────────

/**
 * @swagger
 * /api/v1/duty-logs/summary:
 *   get:
 *     summary: Admin crew utilization and duty compliance summary
 *     tags: [DutyLogs]
 *     parameters:
 *       - { in: query, name: from_date, schema: { type: string, format: date } }
 *       - { in: query, name: to_date,   schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: |
 *           Per-crew summary: flights_assigned, duty_logs_submitted,
 *           total_duty_hours, pending_duty_logs (Landed flights with no log)
 */
router.get(
  '/summary',
  validate([
    query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD'),
    query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD'),
  ]),
  ctrl.summary
);

// ── Employee duty history — must be before /:id ───────────────────────────────

/**
 * @swagger
 * /api/v1/duty-logs/employee/{empId}:
 *   get:
 *     summary: Paginated duty log history for a crew member (crew portal UC-14)
 *     tags: [DutyLogs]
 *     parameters:
 *       - { in: path,  name: empId,     required: true, schema: { type: integer } }
 *       - { in: query, name: from_date, schema: { type: string, format: date } }
 *       - { in: query, name: to_date,   schema: { type: string, format: date } }
 *       - { in: query, name: page,      schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,     schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated duty logs with flight context
 */
router.get(
  '/employee/:empId',
  validate([
    param('empId').isInt().withMessage('Employee ID must be an integer'),
    query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD'),
    query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD'),
  ]),
  ctrl.getByEmployee
);

// ── List all (admin) ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/duty-logs:
 *   get:
 *     summary: List duty logs with filters (admin view)
 *     tags: [DutyLogs]
 *     parameters:
 *       - { in: query, name: emp_id,    schema: { type: integer } }
 *       - { in: query, name: flight_id, schema: { type: integer } }
 *       - { in: query, name: from_date, schema: { type: string, format: date } }
 *       - { in: query, name: to_date,   schema: { type: string, format: date } }
 *       - { in: query, name: page,      schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,     schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated duty log list
 */
router.get('/', ctrl.list);

// ── Single record ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/duty-logs/{id}:
 *   get:
 *     summary: Get a single duty log with full flight and employee context
 *     tags: [DutyLogs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Duty log detail
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Log ID must be an integer')]),
  ctrl.getById
);

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/duty-logs:
 *   post:
 *     summary: Submit a duty log entry (UC-14)
 *     tags: [DutyLogs]
 *     description: |
 *       Business rules enforced:
 *       - Employee must be assigned to the flight
 *       - Flight must be Departed / En_Route / Landed / Completed
 *       - duty_end must be after duty_start
 *       - One log per crew per flight (duplicate → 409)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             emp_id:       3
 *             flight_id:    1
 *             duty_start:   "2025-06-01T05:30:00Z"
 *             duty_end:     "2025-06-01T09:15:00Z"
 *             observations: "Smooth flight, minor turbulence over BOM approach"
 *     responses:
 *       201:
 *         description: Duty log created with total_duty_hours calculated
 *       400:
 *         description: Invalid time range or flight not in loggable state
 *       403:
 *         description: Employee not assigned to this flight
 *       409:
 *         description: Duty log already exists for this crew/flight combination
 */
router.post(
  '/',
  validate([
    body('emp_id').isInt({ min: 1 }).withMessage('emp_id must be a positive integer'),
    body('flight_id').isInt({ min: 1 }).withMessage('flight_id must be a positive integer'),
    body('duty_start').isISO8601().withMessage('duty_start must be ISO 8601 datetime'),
    body('duty_end').isISO8601().withMessage('duty_end must be ISO 8601 datetime'),
    body('observations').optional().isString(),
  ]),
  ctrl.create
);

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/duty-logs/{id}:
 *   put:
 *     summary: Update an existing duty log (UC-14 E2 — overwrite confirmation implied)
 *     tags: [DutyLogs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duty_start:   { type: string, format: date-time }
 *               duty_end:     { type: string, format: date-time }
 *               observations: { type: string }
 *     responses:
 *       200:
 *         description: Updated with recalculated total_duty_hours
 *       400:
 *         description: Invalid time range
 *       404:
 *         description: Duty log not found
 */
router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Log ID must be an integer'),
    body('duty_start').optional().isISO8601().withMessage('duty_start must be ISO 8601 datetime'),
    body('duty_end').optional().isISO8601().withMessage('duty_end must be ISO 8601 datetime'),
    body('observations').optional().isString(),
  ]),
  ctrl.update
);

module.exports = router;
