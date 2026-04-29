const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/passengerController');

/**
 * @swagger
 * tags:
 *   name: Passengers
 *   description: Passenger profile management and booking history (UC-01)
 */

const STATUSES = ['Active', 'Inactive', 'Blacklisted'];
const GENDERS  = ['Male', 'Female', 'Other'];

// ── Admin list ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/passengers:
 *   get:
 *     summary: List passengers (admin, paginated + searchable)
 *     tags: [Passengers]
 *     parameters:
 *       - { in: query, name: search,  schema: { type: string }, description: "Name/contact/email/ID" }
 *       - { in: query, name: status,  schema: { type: string } }
 *       - { in: query, name: gender,  schema: { type: string } }
 *       - { in: query, name: sort_by, schema: { type: string } }
 *       - { in: query, name: order,   schema: { type: string, enum: [asc,desc] } }
 *       - { in: query, name: page,    schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,   schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated passenger list
 */
router.get('/', ctrl.list);

// ── Passenger-portal: own booking history — before /:id to avoid capture ─────
/**
 * @swagger
 * /api/v1/passengers/{id}/reservations:
 *   get:
 *     summary: Passenger portal — own booking history
 *     tags: [Passengers]
 *     parameters:
 *       - { in: path,  name: id,       required: true, schema: { type: integer } }
 *       - { in: query, name: status,   schema: { type: string } }
 *       - { in: query, name: upcoming, schema: { type: boolean } }
 *       - { in: query, name: page,     schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,    schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated reservation list with full flight context
 */
router.get(
  '/:id/reservations',
  validate([param('id').isInt().withMessage('Passenger ID must be an integer')]),
  ctrl.getMyReservations
);

// ── Single passenger ──────────────────────────────────────────────────────────
router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Passenger ID must be an integer')]),
  ctrl.getById
);

// ── Register passenger ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/passengers:
 *   post:
 *     summary: Register a new passenger (UC-01)
 *     tags: [Passengers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name:        "Priya Sharma"
 *             gender:      "Female"
 *             contact:     "+91-9876543210"
 *             email:       "priya@example.com"
 *             passport_no: "P1234567"
 *     responses:
 *       201:
 *         description: Passenger created
 *       409:
 *         description: Duplicate email / contact / passport
 */
router.post(
  '/',
  validate([
    body('name').notEmpty().isLength({ max: 200 }).withMessage('Name required'),
    body('gender').isIn(GENDERS).withMessage(`Gender must be: ${GENDERS.join(', ')}`),
    body('contact').notEmpty().isLength({ min: 7, max: 20 }).withMessage('Contact required (7–20 chars)'),
    body('email').isEmail().withMessage('Valid email required'),
    body('passport_no').optional().notEmpty().isLength({ max: 50 }),
  ]),
  ctrl.create
);

// ── Update profile ────────────────────────────────────────────────────────────
router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Passenger ID must be an integer'),
    body('name').optional().notEmpty().isLength({ max: 200 }),
    body('gender').optional().isIn(GENDERS),
    body('contact').optional().isLength({ min: 7, max: 20 }),
    body('email').optional().isEmail(),
    body('passport_no').optional().isLength({ max: 50 }),
  ]),
  ctrl.update
);

// ── Soft lifecycle ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/passengers/{id}/status:
 *   patch:
 *     summary: Deactivate / reactivate / blacklist passenger (audit-safe)
 *     tags: [Passengers]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Active, Inactive, Blacklisted] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  validate([
    param('id').isInt().withMessage('Passenger ID must be an integer'),
    body('status').isIn(STATUSES).withMessage(`Status must be: ${STATUSES.join(', ')}`),
  ]),
  ctrl.updateStatus
);

module.exports = router;
