const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: [true, "Doctor ID is required"],
      index: true,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
    },
    specificDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    consultationType: {
      type: String,
      enum: ["telemedicine", "in_person", "both"],
      default: "both",
    },
    maxAppointments: {
      type: Number,
      default: 1,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

availabilitySchema.index({ doctorId: 1, isAvailable: 1 });

module.exports = mongoose.model("Availability", availabilitySchema);