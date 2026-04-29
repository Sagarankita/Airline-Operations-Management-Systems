const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/maintenanceController');

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Aircraft maintenance records (UC-17) — Scheduled, Unscheduled, Emergency
 */

const TYPES = ['Scheduled', 'Unscheduled', 'Emergency'];

// ── Admin summary + trend report — before /:id ───────────────────────────────
/**
 * @swagger
 * /api/v1/maintenance/summary:
 *   get:
 *     summary: Admin maintenance trend report
 *     tags: [Maintenance]
 *     description: |
 *       overall counts by type, top 10 aircraft by maintenance frequency,
 *       and most recent 15 Emergency/Unscheduled records.
 *     parameters:
 *       - { in: query, name: from_date, schema: { type: string, format: date } }
 *       - { in: query, name: to_date,   schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: overall, by_type, by_aircraft, recent_critical
 */
router.get(
  '/summary',
  validate([
    query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD'),
    query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD'),
  ]),
  ctrl.summary
);

// ── Aircraft maintenance history — before /:id ───────────────────────────────
/**
 * @swagger
 * /api/v1/maintenance/aircraft/{aircraftId}:
 *   get:
 *     summary: Reverse-chronological maintenance history for an aircraft
 *     tags: [Maintenance]
 *     parameters:
 *       - { in: path,  name: aircraftId, required: true, schema: { type: integer } }
 *       - { in: query, name: type,       schema: { type: string, enum: [Scheduled,Unscheduled,Emergency] } }
 *       - { in: query, name: from_date,  schema: { type: string, format: date } }
 *       - { in: query, name: to_date,    schema: { type: string, format: date } }
 *       - { in: query, name: page,       schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,      schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated maintenance records (newest first)
 */
router.get(
  '/aircraft/:aircraftId',
  validate([param('aircraftId').isInt().withMessage('Aircraft ID must be an integer')]),
  ctrl.getByAircraft
);

// ── Admin list ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/maintenance:
 *   get:
 *     summary: List maintenance records (admin, filterable, reverse-chronological)
 *     tags: [Maintenance]
 *     parameters:
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *       - { in: query, name: emp_id,      schema: { type: integer } }
 *       - { in: query, name: type,        schema: { type: string, enum: [Scheduled,Unscheduled,Emergency] } }
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: sort_by,     schema: { type: string } }
 *       - { in: query, name: order,       schema: { type: string, enum: [asc,desc], default: desc } }
 *       - { in: query, name: page,        schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,       schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated records with aircraft and staff details
 */
router.get('/', ctrl.list);

// ── Single record ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Record ID must be an integer')]),
  ctrl.getById
);

// ── Create ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/maintenance:
 *   post:
 *     summary: Create maintenance record (UC-17)
 *     tags: [Maintenance]
 *     description: |
 *       Guards enforced:
 *       - Aircraft must exist and not be Retired
 *       - Responsible emp_id must be an Active Maintenance employee
 *       - Supports Scheduled / Unscheduled / Emergency types
 *       - Auditable: records are retained permanently (no hard delete)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             date:             "2025-06-01"
 *             title:            "Engine A overhaul"
 *             remark:           "Replaced worn turbine blades"
 *             emp_id:           5
 *             aircraft_id:      1
 *             maintenance_type: "Scheduled"
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Invalid aircraft status or non-Maintenance staff
 */
router.post(
  '/',
  validate([
    body('date').isDate().withMessage('date must be YYYY-MM-DD'),
    body('title').notEmpty().isLength({ max: 200 }).withMessage('title required (max 200 chars)'),
    body('remark').optional().isString(),
    body('emp_id').isInt({ min: 1 }).withMessage('emp_id must be a positive integer'),
    body('aircraft_id').isInt({ min: 1 }).withMessage('aircraft_id must be a positive integer'),
    body('maintenance_type')
      .optional()
      .isIn(TYPES).withMessage(`maintenance_type must be: ${TYPES.join(', ')}`),
  ]),
  ctrl.create
);

// ── Update ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/maintenance/{id}:
 *   put:
 *     summary: Update a maintenance record
 *     tags: [Maintenance]
 *     description: Staff change re-validates new emp_id is a Maintenance employee
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Updated record
 *       404:
 *         description: Not found
 */
router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Record ID must be an integer'),
    body('date').optional().isDate(),
    body('title').optional().notEmpty().isLength({ max: 200 }),
    body('emp_id').optional().isInt({ min: 1 }),
    body('maintenance_type').optional().isIn(TYPES),
  ]),
  ctrl.update
);

module.exports = router;
