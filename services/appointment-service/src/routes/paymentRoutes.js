import express from "express";
import {
  createPayment,
  createStripeCheckoutSession,
  confirmStripePayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByPatient,
  getPaymentsByDoctor,
  refundPayment,
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/:appointmentId/checkout-session",
  protect,
  authorizeRoles("Patient"),
  createStripeCheckoutSession
);

router.post(
  "/confirm-stripe-payment",
  protect,
  authorizeRoles("Patient"),
  confirmStripePayment
);

router.post("/:appointmentId/pay", protect, authorizeRoles("Patient"), createPayment);
router.get("/", protect, authorizeRoles("Admin"), getAllPayments);
router.get("/patient/:patientId", protect, getPaymentsByPatient);
router.get("/doctor/:doctorId", protect, getPaymentsByDoctor);
router.patch("/:id/refund", protect, authorizeRoles("Admin"), refundPayment);
router.get("/:id", protect, getPaymentById);

export default router;