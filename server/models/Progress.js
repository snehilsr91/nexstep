const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const progressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    node: { 
        type: Schema.Types.ObjectId,
        ref: 'Node', 
        required: true,
    },
    roadmap: { 
        type: Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true,
    },

    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed', 'Skipped'],
        default: 'Not Started',
    },
    timeSpentSeconds: { 
        type: Number,
        default: 0,
        min: 0,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },

}, { timestamps: true });

progressSchema.index({ user: 1, node: 1, roadmap: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
