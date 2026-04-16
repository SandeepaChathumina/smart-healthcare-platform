const ConsultationNote = require("../models/ConsultationNote");
const Prescription = require("../models/Prescription");
const { validateAppointment, updateAppointmentStatus, sendNotification, getUserContacts } = require("../utils/serviceCaller");

exports.createConsultationNote = async (req, res) => {
  try {
    const { 
      appointmentId, 
      notes, 
      diagnosis, 
      symptoms, 
      vitalSigns, 
      investigations,
      treatmentPlan,
      followUpRequired, 
      followUpDate,
      followUpNotes
    } = req.body;

    if (!appointmentId || !notes) {
      return res.status(400).json({ message: "appointmentId and notes are required" });
    }

    const existingNote = await ConsultationNote.findOne({ appointmentId });
    if (existingNote) {
      return res.status(400).json({ message: "Consultation note already exists for this appointment" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const appointment = await validateAppointment(appointmentId, req.user.id, token);

    // Calculate BMI if height and weight provided
    let bmi = null;
    if (vitalSigns?.height && vitalSigns?.weight) {
      const heightInMeters = vitalSigns.height / 100;
      bmi = vitalSigns.weight / (heightInMeters * heightInMeters);
    }

    const consultationNote = await ConsultationNote.create({
      appointmentId,
      doctorId: req.user.id,
      patientId: appointment.patientId,
      notes,
      diagnosis,
      symptoms,
      vitalSigns: {
        ...vitalSigns,
        bmi: bmi ? parseFloat(bmi.toFixed(1)) : null,
      },
      investigations: investigations || [],
      treatmentPlan,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate || null,
      followUpNotes: followUpNotes || null,
    });

    await updateAppointmentStatus(appointmentId, "completed", token);
    
    // Send notification to patient
    await sendNotification(
      appointment.patientId,
      "CONSULTATION_COMPLETED",
      { appointmentId, consultationId: consultationNote._id },
      token
    );

    res.status(201).json({ 
      success: true, 
      message: "Consultation note created successfully", 
      consultationNote 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getConsultationNoteByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const note = await ConsultationNote.findOne({ appointmentId });

    if (!note) return res.status(404).json({ message: "Consultation note not found" });
    if (String(note.doctorId) !== String(req.user.id) && String(note.patientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ success: true, consultationNote: note });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getConsultationNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await ConsultationNote.findById(id);

    if (!note) return res.status(404).json({ message: "Consultation note not found" });
    if (String(note.doctorId) !== String(req.user.id) && String(note.patientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ success: true, consultationNote: note });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyConsultationNotes = async (req, res) => {
  try {
    const notes = await ConsultationNote.find({ doctorId: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notes.length, consultationNotes: notes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateConsultationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, diagnosis, symptoms, vitalSigns, investigations, treatmentPlan, followUpRequired, followUpDate } = req.body;

    const consultationNote = await ConsultationNote.findById(id);

    if (!consultationNote) {
      return res.status(404).json({ message: "Consultation note not found" });
    }

    if (String(consultationNote.doctorId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only update your own consultation notes" });
    }

    if (notes) consultationNote.notes = notes;
    if (diagnosis) consultationNote.diagnosis = diagnosis;
    if (symptoms) consultationNote.symptoms = symptoms;
    if (vitalSigns) consultationNote.vitalSigns = { ...consultationNote.vitalSigns, ...vitalSigns };
    if (investigations) consultationNote.investigations = investigations;
    if (treatmentPlan) consultationNote.treatmentPlan = treatmentPlan;
    if (followUpRequired !== undefined) consultationNote.followUpRequired = followUpRequired;
    if (followUpDate) consultationNote.followUpDate = followUpDate;

    await consultationNote.save();

    res.status(200).json({ 
      success: true, 
      message: "Consultation note updated successfully", 
      consultationNote 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};