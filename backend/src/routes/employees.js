const router   = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/employeeController');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management — core + subtypes (UC-07, Lab 07 hierarchy)
 */

const ROLES    = ['Pilot', 'Cabin_Crew', 'Ground_Staff', 'Maintenance', 'Fuel_Staff', 'Admin'];
const STATUSES = ['Active', 'On_Leave', 'Inactive', 'Terminated'];
const GENDERS  = ['Male', 'Female', 'Other'];
const FITNESS  = ['Fit', 'Unfit', 'Conditional'];
const RANKS    = ['Captain', 'First Officer', 'Second Officer', 'Cadet'];

const createRules = validate([
  body('name').notEmpty().isLength({ max: 200 }).withMessage('Name required'),
  body('gender').isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
  body('dob').isDate().withMessage('Valid date of birth required (YYYY-MM-DD)'),
  body('doj').isDate().withMessage('Valid date of joining required (YYYY-MM-DD)'),
  body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  body('contact').notEmpty().isLength({ min: 7, max: 20 }).withMessage('Contact required (7–20 chars)'),

  // ── Pilot subtype ────────────────────────────────────────────────────────
  body('pilot.passport_no')
    .if(body('role').equals('Pilot'))
    .notEmpty().withMessage('Passport number required for Pilot'),
  body('pilot.license_number')
    .if(body('role').equals('Pilot'))
    .notEmpty().withMessage('License number required for Pilot'),
  body('pilot.rank')
    .if(body('role').equals('Pilot'))
    .notEmpty().isIn(RANKS).withMessage(`Rank required for Pilot. Must be: ${RANKS.join(', ')}`),
  body('pilot.fitness')
    .if(body('role').equals('Pilot'))
    .optional().isIn(FITNESS).withMessage(`Fitness must be: ${FITNESS.join(', ')}`),
  body('pilot.total_flight_hours')
    .if(body('role').equals('Pilot'))
    .optional().isInt({ min: 0 }).withMessage('Flight hours must be a non-negative integer'),

  // ── Cabin Crew subtype ───────────────────────────────────────────────────
  body('cabin_crew.passport_no')
    .if(body('role').equals('Cabin_Crew'))
    .notEmpty().withMessage('Passport number required for Cabin Crew'),
  body('cabin_crew.fitness')
    .if(body('role').equals('Cabin_Crew'))
    .optional().isIn(FITNESS).withMessage(`Fitness must be: ${FITNESS.join(', ')}`),
  body('cabin_crew.total_exp_years')
    .if(body('role').equals('Cabin_Crew'))
    .optional().isInt({ min: 0 }).withMessage('Experience years must be a non-negative integer'),

  // ── Ground Staff subtype ─────────────────────────────────────────────────
  body('ground_staff.department')
    .if(body('role').equals('Ground_Staff'))
    .notEmpty().withMessage('Department required for Ground Staff'),
  body('ground_staff.shift_time')
    .if(body('role').equals('Ground_Staff'))
    .notEmpty().withMessage('Shift time required for Ground Staff'),
]);

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: List employees (paginated, filterable, searchable)
 *     tags: [Employees]
 *     parameters:
 *       - { in: query, name: search,       schema: { type: string }, description: "Name / contact / ID" }
 *       - { in: query, name: role,         schema: { type: string } }
 *       - { in: query, name: status,       schema: { type: string } }
 *       - { in: query, name: base_airport, schema: { type: string }, description: "IATA code" }
 *       - { in: query, name: sort_by,      schema: { type: string } }
 *       - { in: query, name: order,        schema: { type: string, enum: [asc, desc] } }
 *       - { in: query, name: page,         schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,        schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated employee list with subtype summary fields
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     summary: Get full employee record including subtype details
 *     tags: [Employees]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Employee + subtype detail
 *       404:
 *         description: Not found
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     summary: Create employee with role-specific subtype data (UC-07)
 *     tags: [Employees]
 *     description: |
 *       Body must include top-level fields. For Pilot include `pilot: {}`,
 *       for Cabin_Crew include `cabin_crew: {}`, for Ground_Staff include `ground_staff: {}`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Rajesh Kumar"
 *             gender: "Male"
 *             dob: "1978-04-12"
 *             doj: "2005-06-01"
 *             role: "Pilot"
 *             contact: "+91-9876543210"
 *             pilot:
 *               passport_no: "P9876543"
 *               license_number: "DGCA-2025-001"
 *               rank: "Captain"
 *               fitness: "Fit"
 *               total_flight_hours: 8500
 *               base_airport: "DEL"
 *     responses:
 *       201:
 *         description: Created with subtype detail
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate contact / passport / license
 */
router.post('/', createRules, ctrl.create);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   put:
 *     summary: Update employee and/or subtype fields
 *     tags: [Employees]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Updated employee + subtype
 *       404:
 *         description: Not found
 */
router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Employee ID must be an integer'),
    body('name').optional().notEmpty().isLength({ max: 200 }),
    body('gender').optional().isIn(GENDERS),
    body('dob').optional().isDate(),
    body('doj').optional().isDate(),
    body('contact').optional().isLength({ min: 7, max: 20 }),
    body('status').optional().isIn(STATUSES),
    body('pilot.fitness').optional().isIn(FITNESS),
    body('pilot.rank').optional().isIn(RANKS),
    body('pilot.total_flight_hours').optional().isInt({ min: 0 }),
    body('cabin_crew.fitness').optional().isIn(FITNESS),
    body('cabin_crew.total_exp_years').optional().isInt({ min: 0 }),
  ]),
  ctrl.update
);

/**
 * @swagger
 * /api/v1/employees/{id}/status:
 *   patch:
 *     summary: Update employee active/status lifecycle (soft deactivation)
 *     tags: [Employees]
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
 *               status: { type: string, enum: [Active, On_Leave, Inactive, Terminated] }
 *     responses:
 *       200:
 *         description: Status updated
 *       409:
 *         description: Cannot deactivate — upcoming flight assignments exist
 */
router.patch(
  '/:id/status',
  validate([
    param('id').isInt().withMessage('Employee ID must be an integer'),
    body('status')
      .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  ]),
  ctrl.updateStatus
);

module.exports = router;
