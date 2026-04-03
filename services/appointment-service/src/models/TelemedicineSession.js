import mongoose from "mongoose";

const telemedicineSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
      index: true,
      unique: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required"],
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
      index: true,
    },

    platform: {
      type: String,
      enum: ["jitsi", "zoom", "agora", "twilio", "custom"],
      default: "jitsi",
      required: true,
    },

    roomName: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      unique: true,
      index: true,
    },

    meetingLink: {
      type: String,
      required: [true, "Meeting link is required"],
      trim: true,
    },

    accessToken: {
      type: String,
      default: "",
      trim: true,
    },

    scheduledStartTime: {
      type: Date,
      required: [true, "Scheduled start time is required"],
    },

    scheduledEndTime: {
      type: Date,
      default: null,
    },

    actualStartTime: {
      type: Date,
      default: null,
    },

    actualEndTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled", "expired"],
      default: "scheduled",
      index: true,
    },

    sessionNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Session notes cannot exceed 1000 characters"],
    },

    recordingUrl: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: String,
      enum: ["system", "doctor", "admin"],
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

telemedicineSessionSchema.index({ patientId: 1, createdAt: -1 });
telemedicineSessionSchema.index({ doctorId: 1, createdAt: -1 });
telemedicineSessionSchema.index({ appointmentId: 1, status: 1 });

telemedicineSessionSchema.pre("save", function () {
  if (this.scheduledEndTime && this.scheduledStartTime) {
    if (this.scheduledEndTime <= this.scheduledStartTime) {
      throw new Error("Scheduled end time must be after scheduled start time");
    }
  }

  if (this.actualEndTime && this.actualStartTime) {
    if (this.actualEndTime <= this.actualStartTime) {
      throw new Error("Actual end time must be after actual start time");
    }
  }
});

const TelemedicineSession = mongoose.model(
  "TelemedicineSession",
  telemedicineSessionSchema
);

export default TelemedicineSession;