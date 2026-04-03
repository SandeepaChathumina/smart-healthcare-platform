import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import appointmentRoutes from "./routes/appointmentRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Appointment Service API is running",
  });
});

app.use("/api/appointments", appointmentRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    const PORT = process.env.PORT || 5004;
    app.listen(PORT, () => {
      console.log(`Appointment Service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });