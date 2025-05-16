const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    category: {
        type: String,
        trim: true,
        enum: ['technical_skill', 'soft_skill', 'tool', 'concept', 'domain', 'other'],
        default: 'other',
    },
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);