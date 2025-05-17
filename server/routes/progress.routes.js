const express = require('express');
const {
  updateResourceProgress,
  getUserProgressForRoadmap,
  getUserGoalProgressSummary,
  getUserProgressForPathItem
} = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check, param } = require('express-validator');

const router = express.Router();

router.use(protect);

router.post(
  '/resource/:resourceId',
  [
    param('resourceId').isMongoId().withMessage('Invalid Resource ID format'),
    check('status', "Status must be 'incomplete' or 'completed'").isIn(['incomplete', 'completed'])
  ],
  validate,
  updateResourceProgress
);

router.get(
  '/roadmap/:roadmapId',
  [param('roadmapId').isMongoId().withMessage('Invalid Roadmap ID format')],
  validate,
  getUserProgressForRoadmap
);

router.get('/goal/summary', getUserGoalProgressSummary);

router.get(
    '/pathitem/:pathItemId',
    [param('pathItemId').isMongoId().withMessage('Invalid PathItem ID format')],
    validate,
    getUserProgressForPathItem
  );

module.exports = router;