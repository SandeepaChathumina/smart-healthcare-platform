const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "APPOINTMENT_BOOKED",
        "APPOINTMENT_ACCEPTED",
        "APPOINTMENT_REJECTED",
        "APPOINTMENT_RESCHEDULED",
        "CONSULTATION_COMPLETED",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
      ],
    },
    recipientId: {
      type: String,
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ["Patient", "Doctor", "Admin"],
      required: true,
    },
    recipientName: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    emailSubject: {
      type: String,
    },
    emailMessage: {
      type: String,
    },
    smsMessage: {
      type: String,
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
    },
    smsStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);