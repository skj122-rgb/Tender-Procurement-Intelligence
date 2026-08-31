const tenderService = require('../services/tender.service');

const getAllTenders = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      state: req.query.state,
      department: req.query.department,
      region: req.query.region,
      district: req.query.district,
      tender_status: req.query.tender_status
    };
    
    const data = await tenderService.getAllTenders(filters);
    res.json({ success: true, message: 'Tenders retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenderById = async (req, res) => {
  try {
    const data = await tenderService.getTenderById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Tender not found' });
    res.json({ success: true, message: 'Tender retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenderBids = async (req, res) => {
  try {
    const data = await tenderService.getTenderBids(req.params.id);
    res.json({ success: true, message: 'Bids retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTenderBoq = async (req, res) => {
  try {
    const data = await tenderService.getTenderBoq(req.params.id);
    res.json({ success: true, message: 'BOQ retrieved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTender = async (req, res) => {
  try {
    const data = await tenderService.deleteTender(req.params.id);
    res.json({ success: true, message: 'Tender successfully removed from repository', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTenders,
  getTenderById,
  getTenderBids,
  getTenderBoq,
  deleteTender
};
