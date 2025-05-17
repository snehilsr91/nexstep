const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the resource'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'Please add a URL for the resource'],
    match: [
        /^(ftp|http|https):\/\/[^ "]+$/,
        'Please use a valid URL with HTTP, HTTPS or FTP'
    ]
  },
  type: {
    type: String,
    enum: ['video', 'article', 'course', 'documentation', 'tool', 'book', 'other'],
    default: 'article',
  },
  pathItem: {
    type: mongoose.Schema.ObjectId,
    ref: 'PathItem',
    required: true,
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingsCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

ResourceSchema.statics.getAverageRating = async function(resourceId) {
  const obj = await this.model('Rating').aggregate([
    {
      $match: { resource: resourceId }
    },
    {
      $group: {
        _id: '$resource',
        avgRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj.length > 0) {
      await this.findByIdAndUpdate(resourceId, {
        avgRating: obj[0].avgRating.toFixed(1),
        ratingsCount: obj[0].ratingsCount
      });
    } else {
      await this.findByIdAndUpdate(resourceId, {
        avgRating: 0,
        ratingsCount: 0
      });
    }
  } catch (err) {
    console.error(`Error updating average rating for resource ${resourceId}:`, err);
  }
};

module.exports = mongoose.model('Resource', ResourceSchema);