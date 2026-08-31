const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const ingest = require('../controllers/ingest.controller');

const router = express.Router();

router.use(authenticate);

// File Ingestion & Management
router.post('/upload', uploadSingle, ingest.processUpload);
router.get('/sources', ingest.getDataSources);
router.get('/sources/:id', ingest.getDataSourceById);
router.delete('/sources/:id', ingest.deleteDataSource);
router.post('/sources/:id/run-model', ingest.runModelOnSource);
router.post('/reanalyze-all', ingest.reanalyzeAll);

module.exports = router;
