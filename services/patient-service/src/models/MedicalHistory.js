const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  chronicConditions: [{
    condition: { type: String, required: true },
    diagnosedYear: Number,
    status: {
      type: String,
      enum: ['Active', 'In Remission', 'Resolved'],
      default: 'Active'
    },
    notes: String
  }],
  pastSurgeries: [{
    surgery: { type: String, required: true },
    year: Number,
    hospital: String,
    notes: String
  }],
  currentMedications: [{
    medication: { type: String, required: true },
    dosage: String,
    frequency: String,
    prescribedBy: String,
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  }],
  allergies: [{
    allergen: { type: String, required: true },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'],
      default: 'Moderate'
    },
    reaction: String
  }],
  immunizations: [{
    vaccine: { type: String, required: true },
    dateAdministered: Date,
    administeredBy: String,
    nextDueDate: Date
  }],
  familyHistory: {
    conditions: [String],
    notes: String
  },
  lifestyleFactors: {
    smoking: {
      status: {
        type: String,
        enum: ['Never', 'Former', 'Current'],
        default: 'Never'
      },
      duration: String
    },
    alcohol: {
      status: {
        type: String,
        enum: ['Never', 'Occasional', 'Regular'],
        default: 'Never'
      },
      frequency: String
    },
    exercise: {
      frequency: String,
      type: String
    }
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);