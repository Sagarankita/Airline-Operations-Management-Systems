const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/feedbackController');

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Post-flight passenger feedback (UC-07)
 */

// ── Admin analytics — must be before /:id ────────────────────────────────────
/**
 * @swagger
 * /api/v1/feedback/analytics:
 *   get:
 *     summary: Admin feedback analytics — overall stats, per-flight ratings, distribution
 *     tags: [Feedback]
 *     parameters:
 *       - { in: query, name: flight_id,  schema: { type: integer } }
 *       - { in: query, name: from_date,  schema: { type: string, format: date } }
 *       - { in: query, name: to_date,    schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: overall (total, avg, star counts), by_flight, distribution
 */
router.get(
  '/analytics',
  validate([
    query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD'),
    query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD'),
    query('flight_id').optional().isInt(),
  ]),
  ctrl.analytics
);

// ── Passenger portal — own feedback history — before /:id ────────────────────
/**
 * @swagger
 * /api/v1/feedback/passenger/{id}:
 *   get:
 *     summary: Passenger portal — own submitted feedback
 *     tags: [Feedback]
 *     parameters:
 *       - { in: path,  name: id,    required: true, schema: { type: integer } }
 *       - { in: query, name: page,  schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated feedback history with flight context
 */
router.get(
  '/passenger/:id',
  validate([param('id').isInt().withMessage('Passenger ID must be an integer')]),
  ctrl.getByPassenger
);

// ── Admin: list all feedback ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/feedback:
 *   get:
 *     summary: List all feedback (admin, filterable)
 *     tags: [Feedback]
 *     parameters:
 *       - { in: query, name: flight_id,    schema: { type: integer } }
 *       - { in: query, name: passenger_id, schema: { type: integer } }
 *       - { in: query, name: from_date,    schema: { type: string, format: date } }
 *       - { in: query, name: to_date,      schema: { type: string, format: date } }
 *       - { in: query, name: min_rating,   schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: max_rating,   schema: { type: integer, maximum: 5 } }
 *       - { in: query, name: page,         schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,        schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated feedback list
 */
router.get('/', ctrl.list);

// ── Submit feedback ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/feedback:
 *   post:
 *     summary: Submit post-flight feedback (UC-07)
 *     tags: [Feedback]
 *     description: |
 *       Guards enforced:
 *       - Flight must be Departed / En_Route / Landed / Completed
 *       - Passenger must have a Checked_In or Completed reservation for the flight
 *       - Rating must be 1–5
 *       - One feedback per passenger per flight (duplicate → 409)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             passenger_id: 1
 *             flight_id:    2
 *             rating:       5
 *             comments:     "Excellent service and on-time arrival!"
 *     responses:
 *       201:
 *         description: Feedback submitted
 *       400:
 *         description: Rating out of range or flight not reviewable
 *       403:
 *         description: Passenger did not board this flight
 *       409:
 *         description: Feedback already submitted for this flight
 */
router.post(
  '/',
  validate([
    body('passenger_id').isInt({ min: 1 }).withMessage('passenger_id must be a positive integer'),
    body('flight_id').isInt({ min: 1 }).withMessage('flight_id must be a positive integer'),
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comments').optional().isString().isLength({ max: 2000 }),
  ]),
  ctrl.create
);

module.exports = router;
