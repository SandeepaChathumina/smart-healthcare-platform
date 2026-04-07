const mongoose = require("mongoose");

const consultationNoteSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, "Appointment ID is required"],
      unique: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: [true, "Doctor ID is required"],
      index: true,
    },
    patientId: {
      type: String,
      required: [true, "Patient ID is required"],
      index: true,
    },
    notes: {
      type: String,
      required: [true, "Consultation notes are required"],
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    symptoms: {
      type: String,
      trim: true,
    },
    vitalSigns: {
      bloodPressure: String,
      heartRate: String,
      temperature: String,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ConsultationNote", consultationNoteSchema);