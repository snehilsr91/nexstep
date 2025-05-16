const express = require('express');
const connectDB = require('./config/db'); // Adjust path if needed

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Your middlewares and routes here
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
