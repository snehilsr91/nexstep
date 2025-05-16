const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const skillLevelSchema = new Schema({
    skill: {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        required: true,
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        required: true,
        default: 'Beginner',
    }
}, { _id: false });

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    profilePicture: {
        type: String, 
        default: '', 
    },
    interests: [{ 
        type: Schema.Types.ObjectId,
        ref: 'Tag',
    }],
    skillLevels: [skillLevelSchema],
    learningGoals: [{ 
        type: String,
        trim: true,
    }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};