const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check } = require('express-validator');

const router = express.Router();

router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(
    [
      check('name').optional().not().isEmpty().withMessage('Name cannot be empty'),
      check('username').optional().not().isEmpty().withMessage('Username cannot be empty'),
      check('email').optional().isEmail().withMessage('Must be a valid email'),
      check('goalId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid Goal ID format')
    ],
    validate,
    updateUserProfile
  );

module.exports = router;