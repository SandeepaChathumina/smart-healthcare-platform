const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Medicine name is required"],
    trim: true,
  },
  dosage: {
    type: String,
    required: [true, "Dosage is required"],
    trim: true,
  },
  frequency: {
    type: String,
    required: [true, "Frequency is required"],
    trim: true,
  },
  duration: {
    type: String,
    required: [true, "Duration is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, "Appointment ID is required"],
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
    patientName: {
      type: String,
      trim: true,
    },
    doctorName: {
      type: String,
      trim: true,
    },
    medicines: [medicineSchema],
    instructions: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired", "cancelled"],
      default: "active",
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patientId: 1, issuedDate: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);