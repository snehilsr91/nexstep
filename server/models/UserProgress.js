const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  roadmap: {
    type: mongoose.Schema.ObjectId,
    ref: 'Roadmap',
    required: true,
  },
  pathItem: {
    type: mongoose.Schema.ObjectId,
    ref: 'PathItem',
    required: true,
  },
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resource',
    required: true,
  },
  status: {
    type: String,
    enum: ['incomplete', 'completed'],
    default: 'incomplete',
  },
  completedAt: {
    type: Date,
  },
});

UserProgressSchema.index({ user: 1, resource: 1 }, { unique: true });
UserProgressSchema.index({ user: 1, roadmap: 1, pathItem: 1 });

UserProgressSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  } else if (this.isModified('status') && this.status === 'incomplete') {
    this.completedAt = null;
  }
  next();
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);