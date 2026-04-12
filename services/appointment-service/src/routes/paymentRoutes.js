import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByPatient,
  getPaymentsByDoctor,
  refundPayment,
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/:appointmentId/pay", protect, authorizeRoles("Patient"), createPayment);
router.get("/", protect, authorizeRoles("Admin"), getAllPayments);
router.get("/patient/:patientId", protect, getPaymentsByPatient);
router.get("/doctor/:doctorId", protect, getPaymentsByDoctor);
router.patch("/:id/refund", protect, authorizeRoles("Admin"), refundPayment);
router.get("/:id", protect, getPaymentById);

export default router;