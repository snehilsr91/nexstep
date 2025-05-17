const express = require('express');
const {
  addOrUpdateRating,
  getRatingsForResource,
  getUserRatingForResource,
  deleteRating
} = require('../controllers/rating.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check, param } = require('express-validator');

const router = express.Router();

router.post(
  '/resource/:resourceId',
  protect,
  [
    param('resourceId').isMongoId().withMessage('Invalid Resource ID format'),
    check('rating', 'Rating must be a number between 1 and 5').isFloat({ min: 1, max: 5 }),
    check('comment').optional().isString().trim().isLength({ max: 500 }).withMessage('Comment too long')
  ],
  validate,
  addOrUpdateRating
);

router.get(
  '/resource/:resourceId',
  [param('resourceId').isMongoId().withMessage('Invalid Resource ID format')],
  validate,
  getRatingsForResource
);

router.get(
    '/resource/:resourceId/user',
    protect,
    [param('resourceId').isMongoId().withMessage('Invalid Resource ID format')],
    validate,
    getUserRatingForResource
);

router.delete(
    '/:ratingId',
    protect,
    [param('ratingId').isMongoId().withMessage('Invalid Rating ID format')],
    validate,
    deleteRating
);

module.exports = router;