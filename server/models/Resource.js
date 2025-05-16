const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resourceSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Resource title is required'],
        trim: true,
    },
    url: {
        type: String,
        required: [true, 'Resource URL is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    contentType: {
        type: String,
        required: true,
        enum: ['Video', 'Course', 'Article', 'Book', 'Documentation', 'Interactive Tutorial', 'Podcast', 'Other'],
    },
    sourceName: {
        type: String,
        trim: true,
    },
    estimatedDurationMinutes: {
        type: Number,
        min: 0,
    },
    difficultyLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        default: 'All Levels',
    },
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'Tag',
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    ratingCount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

resourceSchema.index({ title: 'text', description: 'text', sourceName: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);