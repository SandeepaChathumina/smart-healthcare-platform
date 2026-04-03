import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByPatient,
  getPaymentsByDoctor,
  refundPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/:appointmentId/pay", createPayment);
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.get("/patient/:patientId", getPaymentsByPatient);
router.get("/doctor/:doctorId", getPaymentsByDoctor);
router.patch("/:id/refund", refundPayment);

export default router;