const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the roadmap'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  goal: {
    type: mongoose.Schema.ObjectId,
    ref: 'Goal',
  },
  pathItems: [{
    type: mongoose.Schema.ObjectId,
    ref: 'PathItem',
  }],
  tags: [String],
  estimatedDuration: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

RoadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);