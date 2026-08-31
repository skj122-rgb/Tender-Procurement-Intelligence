const express = require('express');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const tender = require('../controllers/tender.controller');
const analysis = require('../controllers/analysis.controller');
const { tenderQuerySchema } = require('../validators/tender.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', validate({ query: tenderQuerySchema }), tender.getAllTenders);
router.get('/:id', tender.getTenderById);
router.delete('/:id', tender.deleteTender);
router.get('/:id/bids', tender.getTenderBids);
router.get('/:id/boq', tender.getTenderBoq);
router.get('/:id/analysis', analysis.getAnalysis);
router.post('/:id/analyze', analysis.analyzeTender);
router.get('/:id/compare', analysis.compareBidders);

module.exports = router;
