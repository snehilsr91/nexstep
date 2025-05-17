const express = require('express');
const mongoose = require('mongoose');
const {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal
} = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check } = require('express-validator');

const router = express.Router();

router.route('/')
  .get(getAllGoals)
  .post(
    protect,
    [
      check('name', 'Goal name is required').not().isEmpty(),
      check('description').optional().isString(),
      check('roadmapIds').optional().isArray().withMessage('Roadmap IDs must be an array')
                         .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)))
                         .withMessage('Each roadmap ID must be a valid MongoDB ObjectId'),
    ],
    validate,
    createGoal
  );

router.route('/:id')
  .get(getGoalById)
  .put(
    protect,
    [
      check('name').optional().not().isEmpty().withMessage('Goal name cannot be empty'),
      check('description').optional().isString(),
      check('roadmapIds').optional().isArray().withMessage('Roadmap IDs must be an array')
                         .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)))
                         .withMessage('Each roadmap ID must be a valid MongoDB ObjectId'),
    ],
    validate,
    updateGoal
  )
  .delete(protect, deleteGoal);

module.exports = router;