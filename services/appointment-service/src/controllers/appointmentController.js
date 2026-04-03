import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentType,
      reason,
      symptomsSummary,
      preferredDateTime,
      consultationFee,
      patientNotes,
      uploadedReportIds,
    } = req.body;

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
          "patientId, doctorId, appointmentType, reason, preferredDateTime and consultationFee are required",
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

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        message: "Invalid patientId",
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

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({
        message: "Invalid doctorId",
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

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const allowedStatuses = [
      "accepted",
      "rejected",
      "rescheduled",
      "awaiting_payment",
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Valid status is required: accepted, rejected, rescheduled, awaiting_payment, confirmed, completed, cancelled",
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
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