const mongoose = require("mongoose");

const consultationNoteSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Appointment ID is required"],
      unique: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Doctor ID is required"],
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Patient ID is required"],
      index: true,
    },
    notes: {
      type: String,
      required: [true, "Consultation notes are required"],
      trim: true,
      maxlength: [5000, "Notes cannot exceed 5000 characters"],
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [1000, "Diagnosis cannot exceed 1000 characters"],
    },
    symptoms: {
      type: String,
      trim: true,
      maxlength: [2000, "Symptoms cannot exceed 2000 characters"],
    },
    vitalSigns: {
      bloodPressure: { type: String, default: null },
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null },
      respiratoryRate: { type: Number, default: null },
      oxygenSaturation: { type: Number, default: null },
      weight: { type: Number, default: null },
      height: { type: Number, default: null },
      bmi: { type: Number, default: null },
    },
    investigations: [
      {
        testName: { type: String, required: true },
        result: { type: String, default: null },
        notes: { type: String, default: null },
        date: { type: Date, default: Date.now },
      },
    ],
    treatmentPlan: {
      type: String,
      trim: true,
      maxlength: [2000, "Treatment plan cannot exceed 2000 characters"],
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpNotes: {
      type: String,
      default: null,
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

consultationNoteSchema.index({ doctorId: 1, createdAt: -1 });
consultationNoteSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model("ConsultationNote", consultationNoteSchema);