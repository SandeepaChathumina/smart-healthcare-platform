const mongoose = require('mongoose');

const patientReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  appointmentDetails: {
    reason: { type: String, default: '' },
    appointmentType: { type: String, default: '' },
    preferredDateTime: { type: Date, default: null },
    scheduledDateTime: { type: Date, default: null },
    status: { type: String, default: '' }
  },
  reportTitle: {
    type: String,
    required: true,
    trim: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Lab Report', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'],
    default: 'Other'
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

patientReportSchema.index({ patientId: 1, uploadedAt: -1 });
patientReportSchema.index({ patientId: 1, reportType: 1 });
patientReportSchema.index({ patientId: 1, appointmentId: 1 });
patientReportSchema.index({ doctorId: 1, uploadedAt: -1 });

module.exports = mongoose.model('PatientReport', patientReportSchema);