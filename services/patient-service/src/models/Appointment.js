const mongoose = require('mongoose');

// Simplified subset of the schema specifically for patient viewing history
const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    appointmentType: String,
    reason: String,
    symptomsSummary: String,
    preferredDateTime: Date,
    scheduledDateTime: Date,
    status: {
      type: String,
      default: "pending",
      index: true,
    },
    paymentStatus: String,
    consultationFee: Number,
    patientNotes: String,
    doctorResponseNote: String,
    rescheduleReason: String,
    cancellationReason: String,
    uploadedReportIds: [mongoose.Schema.Types.ObjectId],
    isTelemedicineLinkGenerated: Boolean,
    telemedicineSessionId: mongoose.Schema.Types.ObjectId,
    paidAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
