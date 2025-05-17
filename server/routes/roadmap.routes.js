const express = require('express');
const mongoose = require('mongoose');
const {
  getAllRoadmaps,
  getRoadmapById,
  getRoadmapsByGoal,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap
} = require('../controllers/roadmap.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check, query } = require('express-validator');

const router = express.Router();

router.route('/')
  .get(
    [query('goalId').optional().isMongoId().withMessage('Invalid Goal ID format')],
    validate,
    getAllRoadmaps
  )
  .post(
    protect,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('goalId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid Goal ID format'),
      check('tags').optional().isArray().withMessage('Tags must be an array of strings')
                   .custom((value) => value.every(tag => typeof tag === 'string'))
                   .withMessage('Each tag must be a string'),
      check('estimatedDuration').optional().isString()
    ],
    validate,
    createRoadmap
  );

router.get('/goal/:goalId',
    [check('goalId').isMongoId().withMessage('Invalid Goal ID format')],
    validate,
    getRoadmapsByGoal
);

router.route('/:id')
  .get(
    [check('id').isMongoId().withMessage('Invalid Roadmap ID format')],
    validate,
    getRoadmapById
  )
  .put(
    protect,
    [
      check('id').isMongoId().withMessage('Invalid Roadmap ID format'),
      check('title').optional().not().isEmpty().withMessage('Title cannot be empty'),
      check('description').optional().not().isEmpty().withMessage('Description cannot be empty'),
      check('goalId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid Goal ID format'),
      check('tags').optional().isArray().withMessage('Tags must be an array of strings')
                   .custom((value) => value.every(tag => typeof tag === 'string'))
                   .withMessage('Each tag must be a string'),
      check('estimatedDuration').optional().isString(),
      check('pathItemOrder').optional().isArray().withMessage('pathItemOrder must be an array of IDs')
                            .custom((value) => value.every(id => mongoose.Types.ObjectId.isValid(id)))
                            .withMessage('Each pathItemOrder ID must be a valid MongoDB ObjectId')
    ],
    validate,
    updateRoadmap
  )
  .delete(
    protect,
    [check('id').isMongoId().withMessage('Invalid Roadmap ID format')],
    validate,
    deleteRoadmap
  );

module.exports = router;