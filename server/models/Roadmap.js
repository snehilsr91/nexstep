const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roadmapSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Roadmap title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },

    nodes: [{
        type: Schema.Types.ObjectId,
        ref: 'Node',
    }],
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'Tag',
    }],
    isGenerated: {
        type: Boolean,
        default: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isBookmarked: {
        type: Boolean,
        default: false,
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    estimatedTotalDurationMinutes: { 
        type: Number,
        min: 0,
    },
}, { timestamps: true });


roadmapSchema.methods.calculateProgress = async function() {
    if (this.nodes.length === 0) {
        this.progressPercentage = 0;
        return;
    }
    const populatedRoadmap = await this.populate({
        path: 'nodes',
        select: 'status'
    });

    const completedNodes = populatedRoadmap.nodes.filter(node => node.status === 'Completed').length;
    this.progressPercentage = Math.round((completedNodes / populatedRoadmap.nodes.length) * 100);
};


module.exports = mongoose.model('Roadmap', roadmapSchema);