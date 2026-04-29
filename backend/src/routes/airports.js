const router   = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/airportController');

/**
 * @swagger
 * tags:
 *   name: Airports
 *   description: Airport master data (UC-08 source/dest references)
 */

/**
 * @swagger
 * /api/v1/airports:
 *   get:
 *     summary: List airports (paginated, searchable)
 *     tags: [Airports]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated airport list
 */
router.get('/', ctrl.list);

/**
 * @swagger
 * /api/v1/airports/{code}:
 *   get:
 *     summary: Get airport by IATA code
 *     tags: [Airports]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Airport record
 *       404:
 *         description: Not found
 */
router.get('/:code', ctrl.getByCode);

/**
 * @swagger
 * /api/v1/airports:
 *   post:
 *     summary: Create airport
 *     tags: [Airports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [airport_code, name, city, country]
 *             properties:
 *               airport_code: { type: string, example: "DEL" }
 *               name:         { type: string }
 *               city:         { type: string }
 *               country:      { type: string }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Duplicate airport code
 */
router.post(
  '/',
  validate([
    body('airport_code')
      .notEmpty().withMessage('Airport code required')
      .isLength({ min: 2, max: 10 }).withMessage('Airport code must be 2–10 characters'),
    body('name').notEmpty().isLength({ max: 200 }).withMessage('Airport name required'),
    body('city').notEmpty().withMessage('City required'),
    body('country').notEmpty().withMessage('Country required'),
  ]),
  ctrl.create
);

router.put(
  '/:code',
  validate([
    param('code').notEmpty(),
    body('name').notEmpty().isLength({ max: 200 }).withMessage('Name required'),
    body('city').notEmpty().withMessage('City required'),
    body('country').notEmpty().withMessage('Country required'),
  ]),
  ctrl.update
);

router.delete('/:code', ctrl.remove);

module.exports = router;
