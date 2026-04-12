const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { protect, authorizeRoles } = require("./middleware/auth");

const availabilityRoutes = require("./routes/availabilityRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api/doctor/availability", availabilityRoutes);
app.use("/api/doctor/consultation-notes", consultationRoutes);
app.use("/api/doctor/prescriptions", prescriptionRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
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
      console.log(`Routes available at /api/doctor/*`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });