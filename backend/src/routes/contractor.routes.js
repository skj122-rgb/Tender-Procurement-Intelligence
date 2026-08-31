const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const contractor = require('../controllers/contractor.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', contractor.getAllContractors);
router.get('/:id', contractor.getContractorById);
router.get('/:id/performance', contractor.getContractorPerformance);
router.get('/:id/risk', contractor.getContractorRisk);

module.exports = router;
