const router      = require('express').Router();
const { body, param, query } = require('express-validator');
const validate    = require('../middleware/validate');
const flight      = require('../controllers/flightController');
const crewAssign  = require('../controllers/crewAssignmentController');

/**
 * @swagger
 * tags:
 *   name: Flights
 *   description: Flight scheduling and status management (UC-08, Lab 07 state machine)
 */

const FLIGHT_STATUSES   = ['Scheduled','Boarding','Delayed','Departed','En_Route','Landed','Cancelled'];
const ASSIGN_ROLES      = ['Captain','First Officer','Second Officer','Cadet','Cabin_Crew'];

// ── List & dashboard ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/flights:
 *   get:
 *     summary: List flights (paginated, filterable)
 *     tags: [Flights]
 *     parameters:
 *       - { in: query, name: status,      schema: { type: string } }
 *       - { in: query, name: source,      schema: { type: string }, description: "Source airport IATA code" }
 *       - { in: query, name: dest,        schema: { type: string }, description: "Destination airport IATA code" }
 *       - { in: query, name: aircraft_id, schema: { type: integer } }
 *       - { in: query, name: from_date,   schema: { type: string, format: date } }
 *       - { in: query, name: to_date,     schema: { type: string, format: date } }
 *       - { in: query, name: sort_by,     schema: { type: string } }
 *       - { in: query, name: order,       schema: { type: string, enum: [asc, desc] } }
 *       - { in: query, name: page,        schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,       schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated flight list
 */
router.get('/', flight.list);

/**
 * @swagger
 * /api/v1/flights/today:
 *   get:
 *     summary: Flights departing today (admin dashboard widget)
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: Array of today's flights with status
 */
// NOTE: /today MUST be registered before /:id to avoid param capture
router.get('/today', flight.today);

/**
 * @swagger
 * /api/v1/flights/{id}:
 *   get:
 *     summary: Full flight details with schedule history and crew
 *     tags: [Flights]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Flight + schedules + crew
 *       404:
 *         description: Not found
 */
router.get('/:id', flight.getById);

// ── Create / Update ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/flights:
 *   post:
 *     summary: Create a new flight schedule (UC-08)
 *     tags: [Flights]
 *     description: |
 *       Validates aircraft availability (no time overlap, Active status).
 *       Auto-creates a flight_schedule entry with status=Scheduled.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             aircraft_id: 1
 *             departure_time: "2025-06-01T06:00:00Z"
 *             arrival_time:   "2025-06-01T08:30:00Z"
 *             source_airport_code: "DEL"
 *             dest_airport_code:   "BOM"
 *     responses:
 *       201:
 *         description: Flight created with Scheduled status
 *       400:
 *         description: Validation error (bad airports, bad timing)
 *       409:
 *         description: Aircraft conflict or not Active
 */
router.post(
  '/',
  validate([
    body('aircraft_id').isInt({ min: 1 }).withMessage('aircraft_id must be a positive integer'),
    body('departure_time').isISO8601().withMessage('departure_time must be ISO 8601 datetime'),
    body('arrival_time').isISO8601().withMessage('arrival_time must be ISO 8601 datetime'),
    body('source_airport_code').notEmpty().isLength({ min: 2, max: 10 }).withMessage('Source airport code required'),
    body('dest_airport_code').notEmpty().isLength({ min: 2, max: 10 }).withMessage('Destination airport code required'),
  ]),
  flight.create
);

router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Flight ID must be an integer'),
    body('aircraft_id').optional().isInt({ min: 1 }),
    body('departure_time').optional().isISO8601(),
    body('arrival_time').optional().isISO8601(),
  ]),
  flight.update
);

// ── Status transition (Lab 07 state machine) ──────────────────────────────────

/**
 * @swagger
 * /api/v1/flights/{id}/status:
 *   patch:
 *     summary: Transition flight status (Lab 07 state machine)
 *     tags: [Flights]
 *     description: |
 *       Valid transitions:
 *       Scheduled → Boarding | Delayed | Cancelled
 *       Boarding  → Departed | Delayed | Cancelled
 *       Delayed   → Boarding | Cancelled
 *       Departed  → En_Route | Delayed
 *       En_Route  → Landed   | Delayed
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
 *               status:       { type: string, enum: [Boarding,Departed,En_Route,Landed,Delayed,Cancelled] }
 *               delay_reason: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 */
router.patch(
  '/:id/status',
  validate([
    param('id').isInt().withMessage('Flight ID must be an integer'),
    body('status')
      .isIn(FLIGHT_STATUSES).withMessage(`Status must be one of: ${FLIGHT_STATUSES.join(', ')}`),
    body('delay_reason')
      .if(body('status').equals('Delayed'))
      .notEmpty().withMessage('delay_reason is required when status is Delayed'),
    body('emp_id')
      .optional()
      .isInt({ min: 1 }).withMessage('emp_id must be a positive integer when provided'),
  ]),
  flight.updateStatus
);

// ── Nested crew assignment routes ─────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/flights/{id}/crew:
 *   get:
 *     summary: Get crew assigned to a flight
 *     tags: [Flights]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Crew list with employee and subtype details
 */
router.get('/:id/crew', crewAssign.getByFlight);

/**
 * @swagger
 * /api/v1/flights/{id}/crew:
 *   post:
 *     summary: Assign a crew member to a flight (UC-09)
 *     tags: [Flights]
 *     description: |
 *       Validates role fit, Active status, fitness (Unfit blocked), and
 *       schedule overlap with other flights.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emp_id, role]
 *             properties:
 *               emp_id:          { type: integer }
 *               role:            { type: string, enum: [Captain, First Officer, Second Officer, Cadet, Cabin_Crew] }
 *               assignment_date: { type: string, format: date, description: "Defaults to flight departure date" }
 *     responses:
 *       201:
 *         description: Assignment created
 *       400:
 *         description: Role mismatch or validation error
 *       409:
 *         description: Schedule conflict or employee Unfit
 */
router.post(
  '/:id/crew',
  validate([
    param('id').isInt().withMessage('Flight ID must be an integer'),
    body('emp_id').isInt({ min: 1 }).withMessage('emp_id must be a positive integer'),
    body('role')
      .isIn(ASSIGN_ROLES).withMessage(`role must be one of: ${ASSIGN_ROLES.join(', ')}`),
    body('assignment_date').optional().isDate().withMessage('assignment_date must be YYYY-MM-DD'),
  ]),
  crewAssign.assign
);

/**
 * @swagger
 * /api/v1/flights/{id}/crew/{empId}:
 *   delete:
 *     summary: Remove a crew member from a flight
 *     tags: [Flights]
 *     parameters:
 *       - { in: path, name: id,    required: true, schema: { type: integer } }
 *       - { in: path, name: empId, required: true, schema: { type: integer } }
 *     responses:
 *       204:
 *         description: Removed
 *       409:
 *         description: Flight already Departed / En Route / Landed
 */
router.delete(
  '/:id/crew/:empId',
  validate([
    param('id').isInt().withMessage('Flight ID must be an integer'),
    param('empId').isInt().withMessage('Employee ID must be an integer'),
  ]),
  crewAssign.remove
);

module.exports = router;
