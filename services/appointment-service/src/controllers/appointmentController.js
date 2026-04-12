import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createAppointment = async (req, res) => {
  try {
    const {
      // patientId,
      doctorId,
      appointmentType,
      reason,
      symptomsSummary,
      preferredDateTime,
      consultationFee,
      patientNotes,
      uploadedReportIds,
    } = req.body;

    const patientId = req.user?.id || req.user?._id || req.user?.userId;
    console.log("req.user =", req.user);

    if (req.user.role !== "Patient") {
      return res
        .status(403)
        .json({ message: "Only patients can create appointments" });
    }

    if (
      !patientId ||
      !doctorId ||
      !appointmentType ||
      !reason ||
      !preferredDateTime ||
      consultationFee === undefined
    ) {
      return res.status(400).json({
        message:
          "doctorId, appointmentType, reason, preferredDateTime and consultationFee are required, and a valid patient token must be provided",
      });
    }

    if (!isValidObjectId(patientId) || !isValidObjectId(doctorId)) {
      return res.status(400).json({
        message: "Invalid patientId or doctorId",
      });
    }

    if (
      uploadedReportIds &&
      (!Array.isArray(uploadedReportIds) ||
        uploadedReportIds.some((id) => !isValidObjectId(id)))
    ) {
      return res.status(400).json({
        message: "uploadedReportIds must be an array of valid ObjectIds",
      });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentType,
      reason,
      symptomsSummary,
      preferredDateTime,
      consultationFee,
      patientNotes,
      uploadedReportIds: uploadedReportIds || [],
      status: "pending",
      paymentStatus: "unpaid",
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        message: "Invalid patientId",
      });
    }

    if (
      req.user.role === "Patient" &&
      String(loggedInUserId) !== String(patientId)
    ) {
      return res.status(403).json({
        message: "You can only view your own appointments",
      });
    }

    const appointments = await Appointment.find({ patientId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({
        message: "Invalid doctorId",
      });
    }

    if (
      req.user.role === "Doctor" &&
      String(loggedInUserId) !== String(doctorId)
    ) {
      return res.status(403).json({
        message: "You can only view your own appointments",
      });
    }

    const appointments = await Appointment.find({ doctorId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (
      req.user.role !== "Admin" &&
      String(loggedInUserId) !== String(appointment.patientId) &&
      String(loggedInUserId) !== String(appointment.doctorId)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      scheduledDateTime,
      doctorResponseNote,
      rescheduleReason,
      cancellationReason,
    } = req.body;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const doctorAllowedStatuses = [
      "accepted",
      "rejected",
      "rescheduled",
      "awaiting_payment",
      "completed",
    ];

    const adminAllowedStatuses = [
      "accepted",
      "rejected",
      "rescheduled",
      "awaiting_payment",
      "confirmed",
      "completed",
      "cancelled",
    ];

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Doctor can update only own appointments
    if (
      req.user.role === "Doctor" &&
      String(appointment.doctorId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only update your own appointments",
      });
    }

    // Only Doctor or Admin can use this route
    if (!["Doctor", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Role-based allowed statuses
    if (req.user.role === "Doctor" && !doctorAllowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Doctor can only set: accepted, rejected, rescheduled, awaiting_payment, completed",
      });
    }

    if (req.user.role === "Admin" && !adminAllowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Admin can only set: accepted, rejected, rescheduled, awaiting_payment, confirmed, completed, cancelled",
      });
    }

    appointment.status = status;

    if (scheduledDateTime) {
      appointment.scheduledDateTime = scheduledDateTime;
    }

    if (doctorResponseNote !== undefined) {
      appointment.doctorResponseNote = doctorResponseNote;
    }

    if (rescheduleReason !== undefined) {
      appointment.rescheduleReason = rescheduleReason;
    }

    if (cancellationReason !== undefined) {
      appointment.cancellationReason = cancellationReason;
    }

    if (status === "accepted" && !appointment.scheduledDateTime) {
      appointment.scheduledDateTime = appointment.preferredDateTime;
      appointment.status = "awaiting_payment";
    }

    if (status === "rescheduled" && appointment.scheduledDateTime) {
      appointment.status = "awaiting_payment";
    }

    if (status === "completed") {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    return res.status(200).json({
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Patient can cancel only own appointments
    if (
      req.user.role === "Patient" &&
      String(appointment.patientId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only cancel your own appointments",
      });
    }

    // Doctor can cancel only own assigned appointments
    if (
      req.user.role === "Doctor" &&
      String(appointment.doctorId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only cancel your own appointments",
      });
    }

    // Optional: block other roles if needed
    if (!["Patient", "Doctor", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    appointment.status = "cancelled";
    appointment.cancellationReason =
      cancellationReason || "Appointment cancelled by user";

    await appointment.save();

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
