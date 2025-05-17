const express = require('express');
const { fetchCareerRecommendations } = require('../controllers/career.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/recommendations', protect, fetchCareerRecommendations);

module.exports = router;