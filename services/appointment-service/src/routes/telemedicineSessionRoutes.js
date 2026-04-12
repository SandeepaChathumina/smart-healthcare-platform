import express from "express";
import {
  createTelemedicineSession,
  getAllTelemedicineSessions,
  getTelemedicineSessionById,
  getTelemedicineSessionsByPatient,
  getTelemedicineSessionsByDoctor,
  updateTelemedicineSessionStatus,
} from "../controllers/telemedicineSessionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/:appointmentId", protect, createTelemedicineSession);
router.get("/", protect, getAllTelemedicineSessions);
router.get("/patient/:patientId", protect, getTelemedicineSessionsByPatient);
router.get("/doctor/:doctorId", protect, getTelemedicineSessionsByDoctor);
router.patch("/:id/status", protect, updateTelemedicineSessionStatus);
router.get("/:id", protect, getTelemedicineSessionById);

export default router;