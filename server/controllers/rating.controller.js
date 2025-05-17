const Rating = require('../models/Rating');
const Resource = require('../models/Resource');

exports.addOrUpdateRating = async (req, res, next) => {
  const { rating, comment } = req.body;
  const resourceId = req.params.resourceId;
  const userId = req.user.id;

  try {
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: `Resource not found with id ${resourceId}` });
    }

    let existingRating = await Rating.findOne({ user: userId, resource: resourceId });

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.comment = comment ?? existingRating.comment;
      await existingRating.save();
      res.status(200).json({ success: true, message: 'Rating updated successfully', data: existingRating });
    } else {
      const newRating = await Rating.create({
        user: userId,
        resource: resourceId,
        rating,
        comment
      });
      res.status(201).json({ success: true, message: 'Rating added successfully', data: newRating });
    }
  } catch (error) {
    console.error("Add/Update Rating Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'You have already rated this resource. Try updating your existing rating.' });
    }
    next(error);
  }
};

exports.getRatingsForResource = async (req, res, next) => {
  try {
    const resourceExists = await Resource.findById(req.params.resourceId);
    if (!resourceExists) {
        return res.status(404).json({ success: false, message: `Resource not found with id ${req.params.resourceId}` });
    }

    const ratings = await Rating.find({ resource: req.params.resourceId })
      .populate('user', 'username name');
    res.status(200).json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    console.error("Get Ratings For Resource Error:", error);
    next(error);
  }
};

exports.getUserRatingForResource = async (req, res, next) => {
    const resourceId = req.params.resourceId;
    const userId = req.user.id;
    try {
        const rating = await Rating.findOne({ resource: resourceId, user: userId });
        if (!rating) {
            return res.status(200).json({ success: true, data: null, message: 'User has not rated this resource yet.' });
        }
        res.status(200).json({ success: true, data: rating });
    } catch (error) {
        console.error("Get User Rating For Resource Error:", error);
        next(error);
    }
};

exports.deleteRating = async (req, res, next) => {
    try {
        const rating = await Rating.findById(req.params.ratingId);
        if (!rating) {
            return res.status(404).json({ success: false, message: 'Rating not found.' });
        }

        if (rating.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this rating.' });
        }

        const resourceId = rating.resource;
        await rating.deleteOne();
        await Resource.getAverageRating(resourceId);

        res.status(200).json({ success: true, message: 'Rating deleted successfully.' });
    } catch (error) {
        console.error("Delete Rating Error:", error);
        next(error);
    }
};