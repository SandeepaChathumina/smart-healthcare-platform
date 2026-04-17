import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getAppointmentById,
  updatePatientAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} from "../controllers/appointmentController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("Patient"), createAppointment);
router.get("/", protect, authorizeRoles("Admin"), getAllAppointments);
router.get("/patient/:patientId", protect, getAppointmentsByPatient);
router.get("/doctor/:doctorId", protect, getAppointmentsByDoctor);
router.get("/:id", protect, getAppointmentById);
router.patch(
  "/:id/edit",
  protect,
  authorizeRoles("Patient"),
  updatePatientAppointment,
);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("Doctor", "Admin"),
  updateAppointmentStatus,
);
router.patch("/:id/cancel", protect, cancelAppointment);

export default router;
