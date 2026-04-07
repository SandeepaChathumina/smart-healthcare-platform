const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Import routes
const availabilityRoutes = require("./routes/availabilityRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "doctor-service",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.send("Doctor Service Running...");
});

// Routes
app.use("/api/doctor/availability", availabilityRoutes);
app.use("/api/doctor/consultation-notes", consultationRoutes);
app.use("/api/doctor/prescriptions", prescriptionRoutes);

const PORT = process.env.PORT || 5003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected (Doctor Service)");
    console.log("Database:", mongoose.connection.name);
    app.listen(PORT, () => {
      console.log(`Doctor Service running on port ${PORT}`);
      console.log(`Routes available at /api/doctor/*`);
    });
  })
  .catch((err) => console.log("MongoDB connection error:", err));