import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const createPayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { method, notes, gatewayResponse } = req.body || {};

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (
      req.user.role !== "Patient" ||
      String(appointment.patientId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only pay for your own appointment",
      });
    }

    if (appointment.status !== "awaiting_payment") {
      return res.status(400).json({
        message: "This appointment is not ready for payment",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This appointment is already paid",
      });
    }

    const existingPaidPayment = await Payment.findOne({
      appointmentId,
      status: "paid",
    });

    if (existingPaidPayment) {
      return res.status(400).json({
        message: "A successful payment already exists for this appointment",
      });
    }

    const payment = await Payment.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: appointment.consultationFee,
      method: method || "card",
      transactionId: generateTransactionId(),
      gatewayResponse: gatewayResponse || "Mock payment success",
      status: "paid",
      notes: notes || "",
    });

    appointment.paymentStatus = "paid";
    appointment.status = "confirmed";
    appointment.paidAt = new Date();

    await appointment.save();

    return res.status(201).json({
      message: "Payment completed successfully and appointment confirmed",
      payment,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (
      req.user.role !== "Admin" &&
      String(loggedInUserId) !== String(payment.patientId) &&
      String(loggedInUserId) !== String(payment.doctorId)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPaymentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        message: "Invalid patient ID",
      });
    }

    if (
      req.user.role === "Patient" &&
      String(loggedInUserId) !== String(patientId)
    ) {
      return res.status(403).json({
        message: "You can only view your own payments",
      });
    }

    const payments = await Payment.find({ patientId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPaymentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({
        message: "Invalid doctor ID",
      });
    }

    if (
      req.user.role === "Doctor" &&
      String(loggedInUserId) !== String(doctorId)
    ) {
      return res.status(403).json({
        message: "You can only view your own payments",
      });
    }

    const payments = await Payment.find({ doctorId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({
        message: "Only paid payments can be refunded",
      });
    }

    payment.status = "refunded";
    payment.notes = notes || payment.notes;

    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);

    if (appointment) {
      appointment.paymentStatus = "refunded";
      appointment.status = "cancelled";
      await appointment.save();
    }

    return res.status(200).json({
      message: "Payment refunded successfully",
      payment,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
