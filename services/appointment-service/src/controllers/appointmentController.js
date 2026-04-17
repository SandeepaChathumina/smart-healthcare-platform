import mongoose from "mongoose";
import axios from "axios";
import Appointment from "../models/Appointment.js";
import {
  decrementAvailabilityBookedCount,
  getAvailableSlotsByDoctor,
  incrementAvailabilityBookedCount,
} from "../utils/doctorServiceCaller.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const APPOINTMENT_DURATION_MINUTES = 30;
const RESERVED_STATUSES = [
  "pending",
  "accepted",
  "awaiting_payment",
  "confirmed",
  "completed",
];
const isReservedStatus = (status) => RESERVED_STATUSES.includes(String(status || ""));

const normalizeAppointmentType = (value) => {
  if (value === "physical") return "in_person";
  if (value === "in_person" || value === "telemedicine") return value;
  return value;
};

const SRI_LANKA_OFFSET_MINUTES = 330;
const SRI_LANKA_OFFSET_MS = SRI_LANKA_OFFSET_MINUTES * 60 * 1000;
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

const createSriLankaDate = (year, month, day, hours = 0, minutes = 0) => {
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes) - SRI_LANKA_OFFSET_MS,
  );
};

const getSriLankaParts = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const sriLankaDate = new Date(date.getTime() + SRI_LANKA_OFFSET_MS);

  return {
    year: sriLankaDate.getUTCFullYear(),
    month: sriLankaDate.getUTCMonth() + 1,
    day: sriLankaDate.getUTCDate(),
    hours: sriLankaDate.getUTCHours(),
    minutes: sriLankaDate.getUTCMinutes(),
  };
};

const parseDateOnly = (dateValue) => {
  if (!dateValue) return null;

  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return createSriLankaDate(year, month, day);
  }

  const parts = getSriLankaParts(dateValue);
  if (!parts) return null;

  return createSriLankaDate(parts.year, parts.month, parts.day);
};

const combineDateAndTime = (dateValue, timeValue) => {
  if (
    !dateValue ||
    !/^([0-1]?\d|2[0-3]):[0-5]\d$/.test(String(timeValue || ""))
  ) {
    return null;
  }

  let year;
  let month;
  let day;

  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    [year, month, day] = dateValue.split("-").map(Number);
  } else {
    const parts = getSriLankaParts(dateValue);
    if (!parts) return null;
    year = parts.year;
    month = parts.month;
    day = parts.day;
  }

  const [hours, minutes] = String(timeValue).split(":").map(Number);
  return createSriLankaDate(year, month, day, hours, minutes);
};

const parseSriLankaDateTimeLocal = (value) => {
  if (!value) return null;

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (match) {
    const [, year, month, day, hours, minutes] = match.map(Number);
    return createSriLankaDate(year, month, day, hours, minutes);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatSriLankaDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const minutesFromTime = (timeValue) => {
  const [hours, minutes] = String(timeValue).split(":").map(Number);
  return hours * 60 + minutes;
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const getAppointmentStart = (appointment) =>
  appointment.scheduledDateTime || appointment.preferredDateTime;

const rangesOverlap = (startA, endA, startB, endB) =>
  startA < endB && startB < endA;

const isDateMatchingAvailability = (slot, appointmentDate) => {
  const normalizedDate = parseDateOnly(appointmentDate);
  if (!normalizedDate) return false;

  // If doctor service returned a specific date, compare exact date only
  if (slot.specificDate) {
    const slotDate = parseDateOnly(slot.specificDate);
    return slotDate?.getTime() === normalizedDate.getTime();
  }

  // For recurring slots, trust the slot returned by doctor service.
  // The doctor service already filtered slots for the requested date.
  return true;
};

const isWithinBreak = (slot, appointmentTime, durationMinutes) => {
  const start = minutesFromTime(appointmentTime);
  const end = start + durationMinutes;
  const breaks = Array.isArray(slot.breakTime) ? slot.breakTime : [];

  return breaks.some((breakSlot) => {
    const breakStart = minutesFromTime(breakSlot.start);
    const breakEnd = minutesFromTime(breakSlot.end);
    return rangesOverlap(start, end, breakStart, breakEnd);
  });
};

const isWithinAvailabilityWindow = (slot, appointmentTime, durationMinutes) => {
  const start = minutesFromTime(appointmentTime);
  const end = start + durationMinutes;
  const slotStart = minutesFromTime(slot.startTime);
  const slotEnd = minutesFromTime(slot.endTime);
  return start >= slotStart && end <= slotEnd;
};

const is30MinuteBoundary = (appointmentTime) => {
  const minutes = minutesFromTime(appointmentTime) % 60;
  return minutes === 0 || minutes === 30;
};

const validateCommonTextFields = ({
  reason,
  symptomsSummary,
  patientNotes,
  doctorResponseNote,
}) => {
  if (!reason || !String(reason).trim()) {
    return "Reason for consultation is required";
  }

  if (String(reason).trim().length > 500) {
    return "Reason cannot exceed 500 characters";
  }

  if (symptomsSummary && String(symptomsSummary).trim().length > 1000) {
    return "Symptoms summary cannot exceed 1000 characters";
  }

  if (patientNotes && String(patientNotes).trim().length > 1000) {
    return "Patient notes cannot exceed 1000 characters";
  }

  if (doctorResponseNote && String(doctorResponseNote).trim().length > 1000) {
    return "Doctor response note cannot exceed 1000 characters";
  }

  return null;
};

const findConflictingAppointment = async ({
  doctorId,
  startDateTime,
  durationMinutes,
  excludeAppointmentId = null,
}) => {
  const endDateTime = addMinutes(startDateTime, durationMinutes);

  const query = {
    doctorId,
    status: { $in: RESERVED_STATUSES },
    $or: [
      {
        scheduledDateTime: {
          $lt: endDateTime,
          $gte: addMinutes(startDateTime, -durationMinutes),
        },
      },
      {
        preferredDateTime: {
          $lt: endDateTime,
          $gte: addMinutes(startDateTime, -durationMinutes),
        },
      },
    ],
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const possibleConflicts = await Appointment.find(query);

  return possibleConflicts.find((item) => {
    const itemStart = getAppointmentStart(item);
    if (!itemStart) return false;
    const itemEnd = addMinutes(
      itemStart,
      item.durationMinutes || APPOINTMENT_DURATION_MINUTES,
    );
    return rangesOverlap(startDateTime, endDateTime, itemStart, itemEnd);
  });
};

const fetchAndValidateSlot = async ({
  doctorId,
  availabilityId,
  appointmentDate,
  appointmentType,
  token,
}) => {
  const date = parseDateOnly(appointmentDate);
  if (!date) {
    throw new Error("A valid appointment date is required");
  }

  const data = await getAvailableSlotsByDoctor(
    doctorId,
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-"),
    appointmentType,
    token,
  );

  const slots = data?.slots || [];
  const selectedSlot = slots.find(
    (slot) => String(slot._id) === String(availabilityId),
  );

  if (!selectedSlot) {
    throw new Error(
      "Selected doctor availability is no longer available for that date",
    );
  }

  // If specificDate exists, validate exact date.
  // For normal recurring weekly slots, doctor-service already filtered by date.
  if (
    selectedSlot.specificDate &&
    !isDateMatchingAvailability(selectedSlot, appointmentDate)
  ) {
    throw new Error("Selected date does not match the doctor's availability");
  }

  return selectedSlot;
};

const getUserDirectory = async (userIds = []) => {
  const uniqueIds = [
    ...new Set(userIds.filter(Boolean).map((id) => String(id))),
  ];

  if (!uniqueIds.length || !process.env.INTERNAL_SERVICE_API_KEY) {
    return {};
  }

  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/internal/users/contacts`,
      { userIds: uniqueIds },
      {
        headers: {
          "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
        },
        timeout: 5000,
      },
    );

    const contacts = response.data?.contacts || [];

    return contacts.reduce((map, contact) => {
      map[String(contact.id)] = contact;
      return map;
    }, {});
  } catch (error) {
    console.error(
      "Failed to fetch user contacts:",
      error.response?.data || error.message,
    );
    return {};
  }
};

const enrichAppointment = (appointment, userDirectory) => {
  const item = appointment.toObject
    ? appointment.toObject()
    : { ...appointment };
  const patient = userDirectory[String(item.patientId)] || null;
  const doctor = userDirectory[String(item.doctorId)] || null;

  return {
    ...item,
    patientName: patient?.fullName || "Patient",
    patientEmail: patient?.email || "",
    doctorName: doctor?.fullName || "Doctor",
    doctorEmail: doctor?.email || "",
  };
};

const enrichAppointments = async (appointments) => {
  const userDirectory = await getUserDirectory(
    appointments.flatMap((appointment) => [
      appointment.patientId,
      appointment.doctorId,
    ]),
  );

  return appointments.map((appointment) =>
    enrichAppointment(appointment, userDirectory),
  );
};

export const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentType,
      reason,
      symptomsSummary,
      patientNotes,
      uploadedReportIds,
      availabilityId,
      appointmentDate,
      appointmentTime,
      durationMinutes,
    } = req.body;

    const patientId = req.user?.id || req.user?._id || req.user?.userId;
    const authToken = req.headers.authorization?.split(" ")[1];
    const normalizedType = normalizeAppointmentType(appointmentType);
    const bookingDuration =
      Number(durationMinutes) || APPOINTMENT_DURATION_MINUTES;

    if (req.user.role !== "Patient") {
      return res
        .status(403)
        .json({ message: "Only patients can create appointments" });
    }

    if (
      !patientId ||
      !doctorId ||
      !availabilityId ||
      !appointmentDate ||
      !appointmentTime ||
      !normalizedType
    ) {
      return res.status(400).json({
        message:
          "doctorId, availabilityId, appointmentType, appointmentDate and appointmentTime are required",
      });
    }

    const textError = validateCommonTextFields({
      reason,
      symptomsSummary,
      patientNotes,
    });
    if (textError) {
      return res.status(400).json({ message: textError });
    }

    if (
      !isValidObjectId(patientId) ||
      !isValidObjectId(doctorId) ||
      !isValidObjectId(availabilityId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid patientId, doctorId or availabilityId" });
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

    if (!["telemedicine", "in_person"].includes(normalizedType)) {
      return res.status(400).json({ message: "Invalid appointment type" });
    }

    if (bookingDuration !== APPOINTMENT_DURATION_MINUTES) {
      return res
        .status(400)
        .json({ message: "Only 30 minute appointments are allowed right now" });
    }

    if (!is30MinuteBoundary(appointmentTime)) {
      return res
        .status(400)
        .json({ message: "Appointment time must be on a 30 minute boundary" });
    }

    const preferredDateTime = combineDateAndTime(
      appointmentDate,
      appointmentTime,
    );
    if (!preferredDateTime) {
      return res
        .status(400)
        .json({ message: "Invalid appointment date or time" });
    }

    if (preferredDateTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Appointment time must be in the future" });
    }

    let selectedSlot;
    try {
      selectedSlot = await fetchAndValidateSlot({
        doctorId,
        availabilityId,
        appointmentDate,
        appointmentType: normalizedType,
        token: authToken,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (
      !isWithinAvailabilityWindow(
        selectedSlot,
        appointmentTime,
        bookingDuration,
      )
    ) {
      return res.status(400).json({
        message: `Selected time must be inside doctor's available window (${selectedSlot.startTime} - ${selectedSlot.endTime})`,
      });
    }

    if (isWithinBreak(selectedSlot, appointmentTime, bookingDuration)) {
      return res.status(400).json({
        message: "Selected time falls inside the doctor's break time",
      });
    }

    const conflictingAppointment = await findConflictingAppointment({
      doctorId,
      startDateTime: preferredDateTime,
      durationMinutes: bookingDuration,
    });

    if (conflictingAppointment) {
      const conflictStart = getAppointmentStart(conflictingAppointment);
      return res.status(400).json({
        message: `This doctor already has an appointment at ${formatSriLankaDateTime(
          conflictStart,
        )}. Please choose another 30 minute time slot.`,
      });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentType: normalizedType,
      reason: String(reason).trim(),
      symptomsSummary: symptomsSummary ? String(symptomsSummary).trim() : "",
      preferredDateTime,
      scheduledDateTime: null,
      durationMinutes: bookingDuration,
      consultationFee: 0,
      patientNotes: patientNotes ? String(patientNotes).trim() : "",
      uploadedReportIds: uploadedReportIds || [],
      availabilityId,
      status: "pending",
      paymentStatus: "unpaid",
    });

    if (availabilityId && authToken) {
      await incrementAvailabilityBookedCount(availabilityId, authToken);
    }

    const [enrichedAppointment] = await enrichAppointments([appointment]);

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment: enrichedAppointment,
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
    const enrichedAppointments = await enrichAppointments(appointments);

    return res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      appointments: enrichedAppointments,
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
      return res.status(400).json({ message: "Invalid patientId" });
    }

    if (
      req.user.role === "Patient" &&
      String(loggedInUserId) !== String(patientId)
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own appointments" });
    }

    const appointments = await Appointment.find({ patientId }).sort({
      createdAt: -1,
    });
    const enrichedAppointments = await enrichAppointments(appointments);

    return res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId" });
    }

    if (
      req.user.role === "Doctor" &&
      String(loggedInUserId) !== String(doctorId)
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own appointments" });
    }

    const appointments = await Appointment.find({ doctorId }).sort({
      createdAt: -1,
    });
    const enrichedAppointments = await enrichAppointments(appointments);

    return res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (
      req.user.role !== "Admin" &&
      String(loggedInUserId) !== String(appointment.patientId) &&
      String(loggedInUserId) !== String(appointment.doctorId)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [enrichedAppointment] = await enrichAppointments([appointment]);

    return res
      .status(200)
      .json({ success: true, appointment: enrichedAppointment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      scheduledDateTime,
      consultationFee,
      doctorResponseNote,
      rescheduleReason,
      cancellationReason,
    } = req.body;

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role === "Doctor" &&
      String(appointment.doctorId) !== String(loggedInUserId)
    ) {
      return res
        .status(403)
        .json({ message: "You can only update your own appointments" });
    }

    if (!["Doctor", "Admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const doctorAllowedStatuses = [
      "accepted",
      "rejected",
      "rescheduled",
      "awaiting_payment",
      "completed",
      "cancelled",
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

    if (status === "rejected" && !String(doctorResponseNote || "").trim()) {
      return res.status(400).json({
        message: "Doctor must provide a reason when rejecting an appointment",
      });
    }

    if (status === "rescheduled" && !String(rescheduleReason || "").trim()) {
      return res.status(400).json({
        message:
          "Doctor must provide a reason when rescheduling an appointment",
      });
    }

    if (req.user.role === "Doctor" && !doctorAllowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Doctor can only set: accepted, rejected, rescheduled, awaiting_payment, completed, cancelled",
      });
    }

    if (req.user.role === "Admin" && !adminAllowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Admin can only set: accepted, rejected, rescheduled, awaiting_payment, confirmed, completed, cancelled",
      });
    }

    const textError = validateCommonTextFields({
      reason: appointment.reason,
      doctorResponseNote,
      symptomsSummary: appointment.symptomsSummary,
      patientNotes: appointment.patientNotes,
    });

    if (textError) {
      return res.status(400).json({ message: textError });
    }

    let nextScheduledDateTime =
      appointment.scheduledDateTime || appointment.preferredDateTime;

    if (scheduledDateTime) {
      const parsed = parseSriLankaDateTimeLocal(scheduledDateTime);
      if (!parsed || Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid scheduledDateTime" });
      }
      if (parsed <= new Date()) {
        return res
          .status(400)
          .json({ message: "Scheduled date/time must be in the future" });
      }
      nextScheduledDateTime = parsed;
    }

    const previousStatus = appointment.status;

    if (["accepted", "awaiting_payment", "rescheduled"].includes(status)) {
      const feeValue = Number(consultationFee ?? appointment.consultationFee);
      if (!Number.isFinite(feeValue) || feeValue <= 0) {
        return res.status(400).json({
          message:
            "Doctor must set a valid consultation fee before requesting payment",
        });
      }

      const conflictingAppointment = await findConflictingAppointment({
        doctorId: appointment.doctorId,
        startDateTime: nextScheduledDateTime,
        durationMinutes:
          appointment.durationMinutes || APPOINTMENT_DURATION_MINUTES,
        excludeAppointmentId: appointment._id,
      });

      if (conflictingAppointment) {
        const conflictStart = getAppointmentStart(conflictingAppointment);
        return res.status(400).json({
          message: `Doctor already has another appointment at ${formatSriLankaDateTime(conflictStart)}`,
        });
      }

      appointment.consultationFee = feeValue;
      appointment.scheduledDateTime = nextScheduledDateTime;
      appointment.status = "awaiting_payment";
      appointment.paymentStatus =
        appointment.paymentStatus === "paid" ? "paid" : "unpaid";

      if (status === "rescheduled") {
        appointment.rescheduleReason =
          rescheduleReason || "Appointment rescheduled by doctor";
      }
    } else {
      appointment.status = status;

      if (status === "completed") {
        appointment.completedAt = new Date();
      }

      if (status === "cancelled") {
        appointment.cancellationReason =
          cancellationReason || "Appointment cancelled by doctor";
      }
    }

    if (doctorResponseNote !== undefined) {
      appointment.doctorResponseNote = doctorResponseNote
        ? String(doctorResponseNote).trim()
        : "";
    }

    if (status === "rejected") {
      appointment.doctorResponseNote = String(doctorResponseNote || "").trim();
    }

    if (status === "rescheduled") {
      appointment.rescheduleReason = String(rescheduleReason || "").trim();
      if (doctorResponseNote !== undefined) {
        appointment.doctorResponseNote = doctorResponseNote
          ? String(doctorResponseNote).trim()
          : "";
      }
    }

    if (cancellationReason !== undefined && status !== "cancelled") {
      appointment.cancellationReason = cancellationReason;
    }

    await appointment.save();

    // Keep doctor availability booked count in sync with status transitions.
    // Reserved -> non-reserved should decrement, non-reserved -> reserved should increment.
    const authToken = req.headers.authorization?.split(" ")[1];
    if (appointment.availabilityId && authToken) {
      const wasReserved = isReservedStatus(previousStatus);
      const isNowReserved = isReservedStatus(appointment.status);

      if (wasReserved && !isNowReserved) {
        await decrementAvailabilityBookedCount(appointment.availabilityId, authToken);
      } else if (!wasReserved && isNowReserved) {
        await incrementAvailabilityBookedCount(appointment.availabilityId, authToken);
      }
    }

    const [enrichedAppointment] = await enrichAppointments([appointment]);

    return res.status(200).json({
      message: "Appointment status updated successfully",
      appointment: enrichedAppointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role === "Patient" &&
      String(appointment.patientId) !== String(loggedInUserId)
    ) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own appointments" });
    }

    if (
      req.user.role === "Doctor" &&
      String(appointment.doctorId) !== String(loggedInUserId)
    ) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own appointments" });
    }

    if (!["Patient", "Doctor", "Admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const previousStatus = appointment.status;
    appointment.status = "cancelled";
    appointment.cancellationReason =
      cancellationReason || "Appointment cancelled by user";
    await appointment.save();

    const authToken = req.headers.authorization?.split(" ")[1];
    if (
      appointment.availabilityId &&
      authToken &&
      isReservedStatus(previousStatus) &&
      !isReservedStatus(appointment.status)
    ) {
      await decrementAvailabilityBookedCount(
        appointment.availabilityId,
        authToken,
      );
    }

    const [enrichedAppointment] = await enrichAppointments([appointment]);

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment: enrichedAppointment,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
