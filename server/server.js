const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path'); // <--- ADD THIS LINE

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexstep_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

// --- Model Imports (no changes here) ---
require('./models/User');
require('./models/Roadmap');
require('./models/Goal');
require('./models/Resource');
require('./models/PathItem');
require('./models/Rating');
require('./models/UserProgress');

try {
  require('./config/passport')(passport);
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('./config/passport')) {
    console.warn("Warning: Passport configuration file './config/passport.js' not found. If you use Passport, please ensure it exists and is correctly configured.");
  } else {
    console.error("Error loading Passport configuration:", error);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

// --- Static Files Middleware ---
// Serve static files from the 'public' directory (one level up from 'server' directory)
app.use(express.static(path.join(__dirname, '..','client', 'public'))); // <--- ADD THIS LINE

// --- API Routes (no changes here) ---
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const ratingRoutes = require('./routes/rating.routes.js');
const careerRoutes = require('./routes/career.routes.js');
const goalRoutes = require('./routes/goal.routes.js');
const roadmapRoutes = require('./routes/roadmap.routes.js');
const resourceRoutes = require('./routes/resource.routes.js');
const pathItemRoutes = require('./routes/pathItem.routes.js');
const progressRoutes = require('./routes/progress.routes.js');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/pathitems', pathItemRoutes);
app.use('/api/progress', progressRoutes);

// --- Serve the landing page for the root route ---
app.get('/', (req, res) => { // <--- CHANGE THIS
  res.sendFile(path.join(__dirname, '..', 'client/public', 'landing.html'));
});

// --- Error Handler (no changes here, but ensure it's last) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ success: false, message: message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;