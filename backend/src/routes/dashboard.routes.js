const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const dashboard = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(authenticate);

router.get('/summary', dashboard.getSummary);
router.get('/recent-tenders', dashboard.getRecentTenders);
router.get('/risk-distribution', dashboard.getRiskDistribution);

module.exports = router;
