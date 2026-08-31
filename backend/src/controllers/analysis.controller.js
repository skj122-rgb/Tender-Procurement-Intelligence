const analysisService = require('../services/analysis.service');

const analyzeTender = async (req, res) => {
  try {
    const tenderId = req.params.id || req.body.tenderId || req.params.tenderId;
    if (!tenderId) {
      return res.status(400).json({ success: false, message: 'tenderId is required' });
    }
    const data = await analysisService.analyzeTender(tenderId);
    res.json({ success: true, message: 'Tender analysis initiated successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalysis = async (req, res) => {
  try {
    const tenderId = req.params.id || req.params.tenderId;
    const data = await analysisService.getAnalysis(tenderId);
    if (!data) return res.status(404).json({ success: false, message: 'Analysis not found for this tender' });
    res.json({ success: true, message: 'Analysis retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const compareBidders = async (req, res) => {
  try {
    const tenderId = req.params.id || req.params.tenderId || req.query.tenderId;
    const data = await analysisService.compareBidders(tenderId);
    res.json({ success: true, message: 'Bidders comparison retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  analyzeTender,
  getAnalysis,
  compareBidders
};
