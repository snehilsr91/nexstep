const User = require('../models/User');
const Goal = require('../models/Goal');

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('currentGoal');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get User Profile Error:', error);
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  const { name, username, email, goalId } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username && username !== user.username) {
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername && existingUserByUsername._id.toString() !== user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        user.username = username;
    }
    if (email && email !== user.email) {
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail && existingUserByEmail._id.toString() !== user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        user.email = email;
    }

    if (name) user.name = name;

    if (goalId) {
      const goal = await Goal.findById(goalId);
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Goal not found' });
      }
      user.currentGoal = goalId;
    } else if (goalId === null || goalId === '') {
        user.currentGoal = null;
    }

    const updatedUser = await user.save();
    await updatedUser.populate('currentGoal');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update User Profile Error:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};