const express = require('express');
const {
  getPathItemsByRoadmap,
  getPathItemById,
  createPathItem,
  updatePathItem,
  deletePathItem
} = require('../controllers/pathItem.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check, param } = require('express-validator');

const router = express.Router();

router.get(
  '/roadmap/:roadmapId',
  [param('roadmapId').isMongoId().withMessage('Invalid Roadmap ID format')],
  validate,
  getPathItemsByRoadmap
);

router.post(
  '/roadmap/:roadmapId',
  protect,
  [
    param('roadmapId').isMongoId().withMessage('Invalid Roadmap ID format'),
    check('title', 'Title is required for the path item').not().isEmpty(),
    check('description').optional().isString(),
    check('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
  ],
  validate,
  createPathItem
);

router.route('/:id')
  .get(
    [param('id').isMongoId().withMessage('Invalid PathItem ID format')],
    validate,
    getPathItemById
  )
  .put(
    protect,
    [
      param('id').isMongoId().withMessage('Invalid PathItem ID format'),
      check('title').optional().not().isEmpty().withMessage('Title cannot be empty'),
      check('description').optional().isString(),
      check('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
    ],
    validate,
    updatePathItem
  )
  .delete(
    protect,
    [param('id').isMongoId().withMessage('Invalid PathItem ID format')],
    validate,
    deletePathItem
  );

module.exports = router;