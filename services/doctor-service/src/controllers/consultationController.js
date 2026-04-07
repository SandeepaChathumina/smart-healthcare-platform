const ConsultationNote = require("../models/ConsultationNote");
const { validateAppointment, updateAppointmentStatus, sendNotification } = require("../utils/serviceCaller");

exports.createConsultationNote = async (req, res) => {
  try {
    const { appointmentId, notes, diagnosis, symptoms, vitalSigns, followUpRequired, followUpDate } = req.body;

    if (!appointmentId || !notes) {
      return res.status(400).json({ message: "appointmentId and notes are required" });
    }

    const existingNote = await ConsultationNote.findOne({ appointmentId });
    if (existingNote) {
      return res.status(400).json({ message: "Consultation note already exists for this appointment" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const appointment = await validateAppointment(appointmentId, req.user.id, token);

    const consultationNote = await ConsultationNote.create({
      appointmentId,
      doctorId: req.user.id,
      patientId: appointment.patientId,
      notes,
      diagnosis,
      symptoms,
      vitalSigns,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate || null,
    });

    await updateAppointmentStatus(appointmentId, "completed", token);
    await sendNotification(appointment.patientId, "CONSULTATION_COMPLETED", { appointmentId }, token);

    res.status(201).json({ success: true, message: "Consultation note created", consultationNote });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getConsultationNoteByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const note = await ConsultationNote.findOne({ appointmentId });

    if (!note) return res.status(404).json({ message: "Consultation note not found" });
    if (note.doctorId !== req.user.id && note.patientId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ success: true, consultationNote: note });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyConsultationNotes = async (req, res) => {
  try {
    const notes = await ConsultationNote.find({ doctorId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notes.length, consultationNotes: notes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};