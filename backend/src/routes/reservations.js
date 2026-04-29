const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/reservationController');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Booking lifecycle and boarding state management (UC-03, Lab 07)
 */

const STATUSES = ['Confirmed','Waitlisted','Checked_In','Cancelled','Completed','No_Show'];

// ── Admin list ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: List reservations (admin, filterable + paginated)
 *     tags: [Reservations]
 *     parameters:
 *       - { in: query, name: passenger_id, schema: { type: integer } }
 *       - { in: query, name: flight_id,    schema: { type: integer } }
 *       - { in: query, name: status,       schema: { type: string } }
 *       - { in: query, name: from_date,    schema: { type: string, format: date } }
 *       - { in: query, name: to_date,      schema: { type: string, format: date } }
 *       - { in: query, name: sort_by,      schema: { type: string } }
 *       - { in: query, name: order,        schema: { type: string, enum: [asc,desc] } }
 *       - { in: query, name: page,         schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,        schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated reservation list with passenger and flight context
 */
router.get('/', ctrl.list);

// ── Single reservation ────────────────────────────────────────────────────────
router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Reservation ID must be an integer')]),
  ctrl.getById
);

// ── Create (book a seat) ──────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/reservations:
 *   post:
 *     summary: Book a seat on a flight (UC-03)
 *     tags: [Reservations]
 *     description: |
 *       Guards enforced:
 *       - Passenger must be Active
 *       - Flight must be Scheduled / Boarding / Delayed
 *       - Passenger may not hold more than one active booking per flight
 *       - Seat uniqueness enforced per flight (UNIQUE constraint → 409)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             passenger_id: 1
 *             flight_id:    2
 *             seat_no:      "12A"
 *     responses:
 *       201:
 *         description: Reservation created with Confirmed status
 *       400:
 *         description: Flight not bookable or passenger inactive
 *       409:
 *         description: Seat already taken or duplicate booking
 */
router.post(
  '/',
  validate([
    body('passenger_id').isInt({ min: 1 }).withMessage('passenger_id must be a positive integer'),
    body('flight_id').isInt({ min: 1 }).withMessage('flight_id must be a positive integer'),
    body('seat_no')
      .notEmpty()
      .isLength({ min: 1, max: 10 }).withMessage('seat_no required (max 10 chars)'),
  ]),
  ctrl.create
);

// ── Status transition (boarding state machine) ────────────────────────────────
/**
 * @swagger
 * /api/v1/reservations/{id}/status:
 *   patch:
 *     summary: Update reservation status (Lab 07 boarding state machine)
 *     tags: [Reservations]
 *     description: |
 *       Valid transitions:
 *       Confirmed  → Checked_In | Cancelled | No_Show | Completed
 *       Waitlisted → Confirmed  | Cancelled
 *       Checked_In → Completed
 *       (Cancelled, Completed, No_Show are terminal)
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
 *               status: { type: string, enum: [Confirmed,Waitlisted,Checked_In,Cancelled,Completed,No_Show] }
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 */
router.patch(
  '/:id/status',
  validate([
    param('id').isInt().withMessage('Reservation ID must be an integer'),
    body('status').isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  ]),
  ctrl.updateStatus
);

module.exports = router;
