const express = require('express');
const {
  getResourcesByPathItem,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resource.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check, param } = require('express-validator');

const router = express.Router();

const resourceTypes = ['video', 'article', 'course', 'documentation', 'tool', 'book', 'other'];

router.get(
  '/pathitem/:pathItemId',
  [param('pathItemId').isMongoId().withMessage('Invalid PathItem ID format')],
  validate,
  getResourcesByPathItem
);

router.post(
  '/pathitem/:pathItemId',
  protect,
  [
    param('pathItemId').isMongoId().withMessage('Invalid PathItem ID format'),
    check('title', 'Title is required for the resource').not().isEmpty(),
    check('url', 'URL is required and must be a valid URL').isURL(),
    check('type').optional().isIn(resourceTypes).withMessage(`Type must be one of: ${resourceTypes.join(', ')}`)
  ],
  validate,
  createResource
);

router.route('/:id')
  .get(
    [param('id').isMongoId().withMessage('Invalid Resource ID format')],
    validate,
    getResourceById
  )
  .put(
    protect,
    [
      param('id').isMongoId().withMessage('Invalid Resource ID format'),
      check('title').optional().not().isEmpty().withMessage('Title cannot be empty'),
      check('url').optional().isURL().withMessage('Must be a valid URL'),
      check('type').optional().isIn(resourceTypes).withMessage(`Type must be one of: ${resourceTypes.join(', ')}`)
    ],
    validate,
    updateResource
  )
  .delete(
    protect,
    [param('id').isMongoId().withMessage('Invalid Resource ID format')],
    validate,
    deleteResource
  );

module.exports = router;