const router   = require('express').Router();
const { param, query, body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/boardingController');

/**
 * @swagger
 * tags:
 *   name: Boarding
 *   description: Ground staff boarding operations — manifest, check-in, window management (UC-15, UC-16)
 */

const flightIdParam = param('flightId')
  .isInt({ min: 1 }).withMessage('flightId must be a positive integer');

const pnrIdParam = param('pnrId')
  .isInt({ min: 1 }).withMessage('pnrId must be a positive integer');

// ── Manifest ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/boarding/{flightId}/manifest:
 *   get:
 *     summary: Paginated, searchable flight manifest (UC-15)
 *     tags: [Boarding]
 *     description: |
 *       Returns all reservations for the flight with passenger details + seat + boarding status.
 *       Optimised for large manifests via pagination and indexed queries.
 *     parameters:
 *       - { in: path,  name: flightId, required: true, schema: { type: integer } }
 *       - { in: query, name: search,   schema: { type: string },
 *           description: "Passenger name / seat / passport" }
 *       - { in: query, name: status,   schema: { type: string },
 *           enum: [Confirmed, Checked_In, No_Show, Waitlisted, Cancelled, Completed] }
 *       - { in: query, name: sort_by,  schema: { type: string, default: seat_no } }
 *       - { in: query, name: order,    schema: { type: string, enum: [asc, desc] } }
 *       - { in: query, name: page,     schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,    schema: { type: integer, default: 50 } }
 *     responses:
 *       200:
 *         description: Paginated manifest rows — each row has pnr_id, seat_no, passenger details, boarding_status
 */
router.get(
  '/:flightId/manifest',
  validate([
    flightIdParam,
    query('status')
      .optional()
      .isIn(['Confirmed','Checked_In','No_Show','Waitlisted','Cancelled','Completed'])
      .withMessage('Invalid status filter'),
  ]),
  ctrl.getManifest
);

// ── Boarding progress summary ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/boarding/{flightId}/status:
 *   get:
 *     summary: Real-time boarding progress summary (ground staff dashboard widget)
 *     tags: [Boarding]
 *     description: Returns counts of boarded / pending / no_show / cancelled + boarding_pct
 *     parameters:
 *       - { in: path, name: flightId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Boarding stats — boarding_open flag, total_booked, boarded, boarding_pct, ...
 */
router.get(
  '/:flightId/status',
  validate([flightIdParam]),
  ctrl.getBoardingStatus
);

// ── Not-boarded alert list ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/boarding/{flightId}/alerts:
 *   get:
 *     summary: Not-boarded alert list — pending and No_Show passengers (UC-16)
 *     tags: [Boarding]
 *     description: |
 *       Returns separate lists of passengers still pending (Confirmed/Waitlisted)
 *       and those already marked No_Show. Supports the not-boarded alert workflow.
 *     parameters:
 *       - { in: path, name: flightId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: pending_count, no_show_count, pending[], no_shows[]
 */
router.get(
  '/:flightId/alerts',
  validate([flightIdParam]),
  ctrl.getAlerts
);

// ── Single passenger check-in ────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/boarding/{flightId}/check-in/{pnrId}:
 *   patch:
 *     summary: Confirm a passenger has boarded — Confirmed → Checked_In (UC-16)
 *     tags: [Boarding]
 *     description: |
 *       Guards enforced:
 *       - Flight must be in 'Boarding' state
 *       - Reservation must be Confirmed (not already Checked_In or terminal)
 *       - Passenger must be Active
 *       - If emp_id provided, employee must be Active Ground_Staff
 *     parameters:
 *       - { in: path, name: flightId, required: true, schema: { type: integer } }
 *       - { in: path, name: pnrId,    required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emp_id: { type: integer, description: "Ground staff ID performing check-in" }
 *     responses:
 *       200:
 *         description: Reservation updated to Checked_In
 *       400:
 *         description: Reservation not in Confirmed state
 *       403:
 *         description: emp_id is not Ground Staff
 *       409:
 *         description: Boarding not open (flight not in Boarding state)
 */
router.patch(
  '/:flightId/check-in/:pnrId',
  validate([
    flightIdParam,
    pnrIdParam,
    body('emp_id').optional().isInt({ min: 1 }).withMessage('emp_id must be a positive integer'),
  ]),
  ctrl.checkIn
);

// ── Close boarding window ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/boarding/{flightId}/close:
 *   post:
 *     summary: Close boarding window — auto-mark unboarded passengers as No_Show (UC-16)
 *     tags: [Boarding]
 *     description: |
 *       Implements the Lab 07 "Not-Boarded alert path on window expiry".
 *       All Confirmed/Waitlisted reservations become No_Show atomically (transaction).
 *       Returns the alert list of affected passengers for ground staff follow-up.
 *       Note: Flight status remains 'Boarding' — crew transitions it to 'Departed' separately.
 *     parameters:
 *       - { in: path, name: flightId, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emp_id: { type: integer, description: "Ground staff ID closing the window" }
 *     responses:
 *       200:
 *         description: boarding_closed, no_show_count, boarded_count, no_show_alerts[]
 *       409:
 *         description: Flight is not in Boarding state
 */
router.post(
  '/:flightId/close',
  validate([
    flightIdParam,
    body('emp_id').optional().isInt({ min: 1 }).withMessage('emp_id must be a positive integer'),
  ]),
  ctrl.closeBoarding
);

module.exports = router;
