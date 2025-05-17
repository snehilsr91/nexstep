const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resource',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5'],
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

RatingSchema.index({ resource: 1, user: 1 }, { unique: true });

RatingSchema.post('save', async function() {
  await this.constructor.model('Resource').getAverageRating(this.resource);
});

RatingSchema.post('remove', async function() {
  await this.constructor.model('Resource').getAverageRating(this.resource);
});

module.exports = mongoose.model('Rating', RatingSchema);