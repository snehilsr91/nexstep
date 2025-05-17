const User = require('../models/User');
const Goal = require('../models/Goal');
const { generateToken } = require('../utils/helpers'); // Assuming this utility exists
const passport = require('passport');

// Define FRONTEND_URL (ideally from .env, with a fallback)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000'; // Adjust port if your Express server runs elsewhere

exports.signup = async (req, res, next) => {
  const { name, username, email, password, goalName } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this email or username' });
    }

    let selectedGoal = null;
    if (goalName && goalName !== "") { // Check if goalName is provided and not empty
      selectedGoal = await Goal.findOne({ name: goalName });
      if (!selectedGoal) {
        console.warn(`Goal named "${goalName}" not found during signup. User will be created without a currentGoal.`);
        // Optionally, you could create the goal if it doesn't exist, or return an error.
        // For now, we proceed without setting a goal if not found.
      }
    }

    user = new User({ // Use new User() and then user.save() to trigger pre-save hooks for password hashing
      name,
      username,
      email,
      password, // Mongoose pre-save hook in User model should hash this
      currentGoal: selectedGoal ? selectedGoal._id : null,
    });
    await user.save();


    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        currentGoal: selectedGoal // Send the populated goal object if found, or null
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
    }).select('+password').populate('currentGoal');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password); // Assumes matchPassword method in User model

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials (password mismatch)' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        currentGoal: user.currentGoal // Send the populated goal object
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user.id).populate('currentGoal');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};

// --- Google OAuth Routes ---
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/auth.html?error=google_auth_failed#login`, // Redirect to login tab on failure
    session: false // Important for token-based auth
  }, (err, user, info) => {
    if (err) {
      console.error('Google auth callback error:', err);
      return res.redirect(`${FRONTEND_URL}/auth.html?error=google_auth_error#login`);
    }
    if (!user) {
      console.warn('Google auth callback: No user returned. Info:', info);
      return res.redirect(`${FRONTEND_URL}/auth.html?error=google_auth_failed#login`);
    }

    // User is authenticated by Google and either found or created in your DB
    const token = generateToken(user._id);

    // Redirect back to your frontend auth page with the token in the query string
    // The frontend (auth.js) will pick this up, store it, and then redirect.
    res.redirect(`${FRONTEND_URL}/auth.html?google_token=${token}#login`); // Can also use #register or another hash
  })(req, res, next);
};