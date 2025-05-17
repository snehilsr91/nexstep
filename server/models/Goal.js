const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a goal name (e.g., Fullstack Developer)'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  roadmaps: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Roadmap',
  }],
  icon: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Goal', GoalSchema);