const router = require('express').Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', version: 'v1' });
});

// ─── Master data (Prompt 2) ───────────────────────────────────────────────────
router.use('/airports',  require('./airports'));
router.use('/aircraft',  require('./aircraft'));
router.use('/employees', require('./employees'));

// ─── Flight ops + crew assignment (Prompt 3) ─────────────────────────────────
router.use('/flights',          require('./flights'));
router.use('/crew-assignments', require('./crewAssignments'));

// ─── Crew operations + duty logs (Prompt 4) ──────────────────────────────────
router.use('/duty-logs', require('./dutyLogs'));

// ─── Passenger domain (Prompt 5) ─────────────────────────────────────────────
router.use('/passengers',   require('./passengers'));
router.use('/reservations', require('./reservations'));
router.use('/feedback',     require('./feedback'));

// ─── Ground staff + boarding (Prompt 6) ──────────────────────────────────────
router.use('/boarding', require('./boarding'));

// ─── Maintenance + fuel ops (Prompt 7) ───────────────────────────────────────
router.use('/maintenance', require('./maintenance'));
router.use('/fuel-logs',   require('./fuelLogs'));

// ─── Reporting + analytics + delay prediction (Prompt 8) ─────────────────────
router.use('/reports', require('./reports'));

module.exports = router;
