const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      default: "CUSTOM",
    },

    senderId: {
      type: String,
      default: null,
    },
    senderRole: {
      type: String,
      default: null,
    },
    senderName: {
      type: String,
      default: null,
    },

    recipientId: {
      type: String,
      required: true,
    },
    recipientRole: {
      type: String,
      default: null,
    },
    recipientName: {
      type: String,
      default: null,
    },

    email: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },

    emailSubject: {
      type: String,
      default: null,
    },
    emailMessage: {
      type: String,
      default: null,
    },
    smsMessage: {
      type: String,
      default: null,
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

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);