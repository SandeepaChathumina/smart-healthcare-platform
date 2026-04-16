import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import TelemedicineSession from "../models/TelemedicineSession.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const generateRoomName = (appointmentId) => {
  return `smart-health-${appointmentId}-${Date.now()}`;
};

const generateMeetingLink = (roomName) => {
  return `https://meet.jit.si/${roomName}`;
};

export const createTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;
    const { platform, scheduledEndTime, sessionNotes, createdBy } =
      req.body || {};

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

    if (appointment.appointmentType !== "telemedicine") {
      return res.status(400).json({
        message:
          "Telemedicine session can only be created for telemedicine appointments",
      });
    }

    if (
      req.user.role !== "Admin" &&
      String(loggedInUserId) !== String(appointment.patientId) &&
      String(loggedInUserId) !== String(appointment.doctorId)
    ) {
      return res.status(403).json({
        message:
          "You can only create telemedicine sessions for your own appointment",
      });
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        message:
          "Telemedicine session can only be created for confirmed appointments",
      });
    }

    if (appointment.paymentStatus !== "paid") {
      return res.status(400).json({
        message:
          "Telemedicine session can only be created after successful payment",
      });
    }

    const existingSession = await TelemedicineSession.findOne({
      appointmentId,
    });

    if (existingSession) {
      return res.status(200).json({
        message: "Telemedicine session already exists for this appointment",
        session: existingSession,
      });
    }

    const roomName = generateRoomName(appointment._id);
    const meetingLink = generateMeetingLink(roomName);

    const session = await TelemedicineSession.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      platform: platform || "jitsi",
      roomName,
      meetingLink,
      scheduledStartTime:
        appointment.scheduledDateTime || appointment.preferredDateTime,
      scheduledEndTime: scheduledEndTime || null,
      sessionNotes: sessionNotes || "",
      createdBy: createdBy || "system",
      status: "scheduled",
    });

    appointment.isTelemedicineLinkGenerated = true;
    appointment.telemedicineSessionId = session._id;
    await appointment.save();

    return res.status(201).json({
      message: "Telemedicine session created successfully",
      session,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllTelemedicineSessions = async (req, res) => {
  try {
    const sessions = await TelemedicineSession.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getTelemedicineSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid session ID",
      });
    }

    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Telemedicine session not found",
      });
    }

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (
      req.user.role !== "Admin" &&
      String(loggedInUserId) !== String(session.patientId) &&
      String(loggedInUserId) !== String(session.doctorId)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getTelemedicineSessionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

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

    const session = await TelemedicineSession.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({
        message: "Telemedicine session not found for this appointment",
      });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getTelemedicineSessionsByPatient = async (req, res) => {
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
        message: "You can only view your own telemedicine sessions",
      });
    }

    const sessions = await TelemedicineSession.find({ patientId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getTelemedicineSessionsByDoctor = async (req, res) => {
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
        message: "You can only view your own telemedicine sessions",
      });
    }

    const sessions = await TelemedicineSession.find({ doctorId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateTelemedicineSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      actualStartTime,
      actualEndTime,
      sessionNotes,
      recordingUrl,
    } = req.body || {};

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid session ID",
      });
    }

    const allowedStatuses = [
      "scheduled",
      "active",
      "completed",
      "cancelled",
      "expired",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Valid status is required: scheduled, active, completed, cancelled, expired",
      });
    }

    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Telemedicine session not found",
      });
    }

    if (
      req.user.role === "Doctor" &&
      String(session.doctorId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only update your own telemedicine sessions",
      });
    }

    if (!["Doctor", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    session.status = status;

    if (actualStartTime !== undefined) {
      session.actualStartTime = actualStartTime;
    }

    if (actualEndTime !== undefined) {
      session.actualEndTime = actualEndTime;
    }

    if (sessionNotes !== undefined) {
      session.sessionNotes = sessionNotes;
    }

    if (recordingUrl !== undefined) {
      session.recordingUrl = recordingUrl;
    }

    if (status === "active" && !session.actualStartTime) {
      session.actualStartTime = new Date();
    }

    if (status === "completed" && !session.actualEndTime) {
      session.actualEndTime = new Date();
    }

    await session.save();

    return res.status(200).json({
      message: "Telemedicine session status updated successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};