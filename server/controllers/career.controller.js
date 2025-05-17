const { getCareerRecommendations } = require('../utils/recommendations');

exports.fetchCareerRecommendations = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const recommendations = await getCareerRecommendations(userId);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Fetch Career Recommendations Error:", error);
    next(error);
  }
};