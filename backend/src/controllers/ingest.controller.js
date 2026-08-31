const ingestionService = require('../services/ingestion.service');

const processUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const userId = req.user ? req.user.id : null;
    const data = await ingestionService.processUpload(req.file, userId);
    res.json({ success: true, message: 'File uploaded and processing started', data });
  } catch (error) {
    console.error('[Ingest Error]:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

const getDataSources = async (req, res) => {
  try {
    const data = await ingestionService.getDataSources();
    res.json({ success: true, message: 'Data sources retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDataSourceById = async (req, res) => {
  try {
    const data = await ingestionService.getDataSourceById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Data source not found' });
    res.json({ success: true, message: 'Data source retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDataSource = async (req, res) => {
  try {
    const result = await ingestionService.deleteDataSource(req.params.id);
    res.json({ success: true, message: 'Dataset and associated records successfully removed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const runModelOnSource = async (req, res) => {
  try {
    const result = await ingestionService.runModelOnSource(req.params.id);
    res.json({ success: true, message: 'Risk model executed successfully on document records', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reanalyzeAll = async (req, res) => {
  try {
    const result = await ingestionService.reanalyzeAll();
    res.json({ success: true, message: 'Full analytical model re-functionalization executed across all documents', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  processUpload,
  getDataSources,
  getDataSourceById,
  deleteDataSource,
  runModelOnSource,
  reanalyzeAll
};
