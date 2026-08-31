const dashboardService = require('../services/dashboard.service');

const getSummary = async (req, res) => {
  try {
    const data = await dashboardService.getSummary();
    res.json({ success: true, message: 'Summary retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecentTenders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await dashboardService.getRecentTenders(limit);
    res.json({ success: true, message: 'Recent tenders retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRiskDistribution = async (req, res) => {
  try {
    const data = await dashboardService.getRiskDistribution();
    res.json({ success: true, message: 'Risk distribution retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSummary,
  getRecentTenders,
  getRiskDistribution
};
