import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Patient ID is required"],
      ref: "User",
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Doctor ID is required"],
      ref: "User",
      index: true,
    },

    appointmentType: {
      type: String,
      required: [true, "Appointment type is required"],
      enum: ["in_person", "telemedicine"],
      trim: true,
    },

    reason: {
      type: String,
      required: [true, "Reason for consultation is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },

    symptomsSummary: {
      type: String,
      trim: true,
      maxlength: [1000, "Symptoms summary cannot exceed 1000 characters"],
      default: "",
    },

    preferredDateTime: {
      type: Date,
      required: [true, "Preferred date and time is required"],
    },

    scheduledDateTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "rescheduled",
        "awaiting_payment",
        "confirmed",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },

    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: [0, "Consultation fee cannot be negative"],
      default: 0,
    },

    patientNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Patient notes cannot exceed 1000 characters"],
      default: "",
    },

    doctorResponseNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Doctor response note cannot exceed 1000 characters"],
      default: "",
    },

    rescheduleReason: {
      type: String,
      trim: true,
      maxlength: [500, "Reschedule reason cannot exceed 500 characters"],
      default: "",
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: "",
    },

    uploadedReportIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
      },
    ],

    isTelemedicineLinkGenerated: {
      type: Boolean,
      default: false,
    },

    telemedicineSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });

appointmentSchema.pre("save", function () {
  if (this.scheduledDateTime && this.scheduledDateTime < new Date()) {
    throw new Error("Scheduled date/time cannot be in the past");
  }

  if (this.preferredDateTime && this.preferredDateTime < new Date()) {
    throw new Error("Preferred date/time cannot be in the past");
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;