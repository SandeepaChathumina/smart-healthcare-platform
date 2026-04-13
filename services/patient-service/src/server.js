const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const patientRoutes = require('./routes/patientRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/patient', patientRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Patient service is running'
  });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Global Error Handler for cleaner API responses (especially File Uploads)
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        message: `Unexpected form field. The backend expects the file key to be named 'file'. Check your Postman form-data keys.`
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  
  if (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
  next();
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});