const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pathItemSchema = new Schema({
    resource: { 
        type: Schema.Types.ObjectId,
        ref: 'Resource',
        required: true,
    },
    roadmap: { 
        type: Schema.Types.ObjectId,
        ref: 'Roadmap', 
        required: true,
    },
    order: { 
        type: Number,
        required: true,
        min: 0,
    },
    moduleTitle: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed', 'Skipped'],
        default: 'Not Started',
        required: true,
    },
    userNotes: { 
        type: String,
        trim: true,
    },
    isOptional: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true }); 

pathItemSchema.index({ roadmap: 1, order: 1 }, { unique: true });

pathItemSchema.index({ roadmap: 1 });

pathItemSchema.index({ resource: 1 });


module.exports = mongoose.model('PathItem', pathItemSchema);