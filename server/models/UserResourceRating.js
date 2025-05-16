const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userResourceRatingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    resource: {
        type: Schema.Types.ObjectId,
        ref: 'Resource',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5, 
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
}, { timestamps: true });


userResourceRatingSchema.index({ user: 1, resource: 1 }, { unique: true });

userResourceRatingSchema.post('save', async function(doc) {
    try {
        const resourceId = doc.resource;
        const ratings = await mongoose.model('UserResourceRating').find({ resource: resourceId });
        const totalRating = ratings.reduce((acc, item) => acc + item.rating, 0);
        const averageRating = ratings.length > 0 ? (totalRating / ratings.length) : 0;

        await mongoose.model('Resource').findByIdAndUpdate(resourceId, {
            averageRating: averageRating.toFixed(1), 
            ratingCount: ratings.length
        });
    } catch (error) {
        console.error("Error updating resource average rating:", error);
    }
});


module.exports = mongoose.model('UserResourceRating', userResourceRatingSchema);


module.exports = mongoose.model('User', userSchema);