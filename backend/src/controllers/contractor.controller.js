const contractorService = require('../services/contractor.service');

const getAllContractors = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      state: req.query.state,
      category: req.query.category
    };
    const data = await contractorService.getAllContractors(filters);
    res.json({ success: true, message: 'Contractors retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContractorById = async (req, res) => {
  try {
    const data = await contractorService.getContractorById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Contractor not found' });
    res.json({ success: true, message: 'Contractor retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContractorPerformance = async (req, res) => {
  try {
    const data = await contractorService.getContractorPerformance(req.params.id);
    res.json({ success: true, message: 'Contractor performance retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContractorRisk = async (req, res) => {
  try {
    const data = await contractorService.getContractorRisk(req.params.id);
    res.json({ success: true, message: 'Contractor risk retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllContractors,
  getContractorById,
  getContractorPerformance,
  getContractorRisk
};
