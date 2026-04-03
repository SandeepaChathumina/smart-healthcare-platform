import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.post("/", createAppointment);
router.get("/", getAllAppointments);
router.get("/patient/:patientId", getAppointmentsByPatient);
router.get("/doctor/:doctorId", getAppointmentsByDoctor);
router.get("/:id", getAppointmentById);
router.patch("/:id/status", updateAppointmentStatus);
router.patch("/:id/cancel", cancelAppointment);

export default router;