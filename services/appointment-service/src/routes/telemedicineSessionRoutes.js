import express from "express";
import {
  createTelemedicineSession,
  getAllTelemedicineSessions,
  getTelemedicineSessionById,
  getTelemedicineSessionsByPatient,
  getTelemedicineSessionsByDoctor,
  updateTelemedicineSessionStatus,
} from "../controllers/telemedicineSessionController.js";

const router = express.Router();

router.post("/:appointmentId", createTelemedicineSession);
router.get("/", getAllTelemedicineSessions);
router.get("/patient/:patientId", getTelemedicineSessionsByPatient);
router.get("/doctor/:doctorId", getTelemedicineSessionsByDoctor);
router.patch("/:id/status", updateTelemedicineSessionStatus);
router.get("/:id", getTelemedicineSessionById);

export default router;