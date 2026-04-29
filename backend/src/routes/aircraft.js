const router   = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/aircraftController');

/**
 * @swagger
 * tags:
 *   name: Aircraft
 *   description: Aircraft fleet management (UC-11)
 */

const STATUSES = ['Active', 'In_Maintenance', 'Retired'];

/**
 * @swagger
 * /api/v1/aircraft:
 *   get:
 *     summary: List aircraft (paginated, filterable)
 *     tags: [Aircraft]
 *     parameters:
 *       - { in: query, name: search,       schema: { type: string } }
 *       - { in: query, name: status,       schema: { type: string, enum: [Active, In_Maintenance, Retired] } }
 *       - { in: query, name: manufacturer, schema: { type: string } }
 *       - { in: query, name: sort_by,      schema: { type: string } }
 *       - { in: query, name: order,        schema: { type: string, enum: [asc, desc] } }
 *       - { in: query, name: page,         schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,        schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated aircraft list
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/aircraft/{id}:
 *   get:
 *     summary: Get aircraft by ID
 *     tags: [Aircraft]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Aircraft record
 *       404:
 *         description: Not found
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/v1/aircraft:
 *   post:
 *     summary: Register new aircraft
 *     tags: [Aircraft]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [model, manufacturer, weight_capacity, range_km]
 *             properties:
 *               model:           { type: string }
 *               manufacturer:   { type: string }
 *               weight_capacity: { type: integer, minimum: 1 }
 *               range_km:        { type: integer, minimum: 1 }
 *               status:          { type: string, enum: [Active, In_Maintenance, Retired] }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/',
  validate([
    body('model').notEmpty().withMessage('Model required'),
    body('manufacturer').notEmpty().withMessage('Manufacturer required'),
    body('weight_capacity')
      .isInt({ min: 1 }).withMessage('weight_capacity must be a positive integer'),
    body('range_km')
      .isInt({ min: 1 }).withMessage('range_km must be a positive integer'),
    body('status')
      .optional()
      .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  ]),
  ctrl.create
);

router.put(
  '/:id',
  validate([
    param('id').isInt().withMessage('Aircraft ID must be an integer'),
    body('model').optional().notEmpty(),
    body('manufacturer').optional().notEmpty(),
    body('weight_capacity').optional().isInt({ min: 1 }),
    body('range_km').optional().isInt({ min: 1 }),
  ]),
  ctrl.update
);

/**
 * @swagger
 * /api/v1/aircraft/{id}/status:
 *   patch:
 *     summary: Update aircraft operational status (Lab 07 state machine)
 *     tags: [Aircraft]
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
 *               status: { type: string, enum: [Active, In_Maintenance, Retired] }
 *     responses:
 *       200:
 *         description: Updated
 *       409:
 *         description: Conflict — active flight assignments prevent retirement
 */
router.patch(
  '/:id/status',
  validate([
    param('id').isInt().withMessage('Aircraft ID must be an integer'),
    body('status')
      .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  ]),
  ctrl.updateStatus
);

module.exports = router;
