import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import appointmentRoutes from "./routes/appointmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import telemedicineSessionRoutes from "./routes/telemedicineSessionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Appointment Service API is running",
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  });
});

app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/telemedicine-sessions", telemedicineSessionRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("STRIPE_SECRET_KEY loaded:", !!process.env.STRIPE_SECRET_KEY);

    const PORT = process.env.PORT || 5004;
    app.listen(PORT, () => {
      console.log(`Appointment Service is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });