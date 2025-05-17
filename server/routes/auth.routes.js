const express = require('express');
const { signup, login, getMe, googleAuth, googleAuthCallback } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/signup',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  validate,
  signup
);

router.post(
  '/login',
  [
    check('emailOrUsername', 'Email or Username is required').not().isEmpty(),
    check('password', 'Password is required').exists(),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

module.exports = router;