const router   = require('express').Router();
const { param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl     = require('../controllers/crewAssignmentController');

/**
 * @swagger
 * tags:
 *   name: CrewAssignments
 *   description: Crew portal — view own assignments (UC-13)
 */

/**
 * @swagger
 * /api/v1/crew-assignments/employee/{empId}:
 *   get:
 *     summary: Get all flight assignments for an employee (crew portal)
 *     tags: [CrewAssignments]
 *     parameters:
 *       - { in: path,  name: empId,    required: true, schema: { type: integer } }
 *       - { in: query, name: upcoming, schema: { type: boolean },
 *           description: "If true, only return flights departing after now" }
 *     responses:
 *       200:
 *         description: Sorted list of assignments with full flight context (departure, airports, status)
 */
router.get(
  '/employee/:empId',
  validate([param('empId').isInt().withMessage('Employee ID must be an integer')]),
  ctrl.getByEmployee
);

module.exports = router;
