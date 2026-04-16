// doctor-service/server.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const availabilityRoutes = require("./routes/availabilityRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const doctorProfileRoutes = require("./routes/doctorProfileRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "doctor-service",
    timestamp: new Date().toISOString()
  });
});

// Routes - IMPORTANT: Order matters
app.use("/api/doctor/availability", availabilityRoutes);
app.use("/api/doctor/consultation-notes", consultationRoutes);
app.use("/api/doctor/prescriptions", prescriptionRoutes);
app.use("/api/doctor", doctorProfileRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Doctor Service Running...");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected (Doctor Service)");
    console.log("Database:", mongoose.connection.name);
    
    app.listen(PORT, () => {
      console.log(`Doctor Service running on port ${PORT}`);
      console.log(`Routes available:`);
      console.log(`  - POST /api/doctor/availability/calculate-metrics`);
      console.log(`  - GET /api/doctor/availability/me`);
      console.log(`  - POST /api/doctor/availability`);
      console.log(`  - PATCH /api/doctor/availability/:id`);
      console.log(`  - DELETE /api/doctor/availability/:id`);
      console.log(`  - GET /api/doctor/availability/slots`);
      console.log(`  - GET /api/doctor/availability/check/:doctorId`);
      console.log(`  - GET /api/doctor/availability/doctor/:doctorId`);
      console.log(`  - /api/doctor/consultation-notes`);
      console.log(`  - /api/doctor/prescriptions`);
      console.log(`  - /api/doctor/profile`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });