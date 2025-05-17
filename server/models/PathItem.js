const mongoose = require('mongoose');

const PathItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the path item/topic'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  roadmap: {
    type: mongoose.Schema.ObjectId,
    ref: 'Roadmap',
    required: true,
  },
  resources: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Resource',
  }],
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('PathItem', PathItemSchema);