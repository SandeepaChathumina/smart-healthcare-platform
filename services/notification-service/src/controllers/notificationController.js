const Notification = require("../models/Notification");
const sendEmail = require("../services/emailService");
const sendSMS = require("../services/smsService");
const { getUserContactsByIds } = require("../services/authService");
const { buildMessages } = require("../utils/messageTemplates");

const sendAppointmentNotifications = async (req, res) => {
  try {
    const {
      appointmentId,
      eventType,
      patientId,
      doctorId,
      appointmentType,
      scheduledDateTime,
    } = req.body;

    if (!appointmentId || !eventType || !patientId || !doctorId) {
      return res.status(400).json({
        message: "appointmentId, eventType, patientId and doctorId are required",
      });
    }

    const contactResponse = await getUserContactsByIds([patientId, doctorId]);
    const contacts = contactResponse.contacts || [];

    if (!contacts.length) {
      return res.status(404).json({
        message: "No recipient contacts found from auth service",
      });
    }

    const results = [];

    for (const contact of contacts) {
      const { emailSubject, emailMessage, smsMessage } = buildMessages({
        eventType,
        recipientName: contact.fullName,
        appointmentId,
        appointmentType,
        scheduledDateTime,
      });

      let emailStatus = "skipped";
      let smsStatus = "skipped";
      let errorMessage = null;

      if (contact.email) {
        try {
          await sendEmail({
            to: contact.email,
            subject: emailSubject,
            text: emailMessage,
          });
          emailStatus = "sent";
        } catch (error) {
          emailStatus = "failed";
          errorMessage = error.message;
        }
      }

      if (contact.phone) {
        try {
          await sendSMS({
            to: contact.phone,
            message: smsMessage,
          });
          smsStatus = "sent";
        } catch (error) {
          smsStatus = "failed";
          errorMessage = errorMessage
            ? `${errorMessage}; ${error.message}`
            : error.message;
        }
      }

      const log = await Notification.create({
        appointmentId,
        eventType,
        recipientId: contact.id,
        recipientRole: contact.role,
        recipientName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        emailSubject,
        emailMessage,
        smsMessage,
        emailStatus,
        smsStatus,
        errorMessage,
      });

      results.push(log);
    }

    return res.status(200).json({
      success: true,
      message: "Notifications processed",
      count: results.length,
      notifications: results,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        message: "Recipient email is required",
      });
    }

    await sendEmail({
      to,
      subject: "Smart Healthcare Email Test",
      text: "Hello! This is a test email from the Smart Healthcare Notification Service.",
    });

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Email sending failed",
      error: error.message,
    });
  }
};

module.exports = {
  sendAppointmentNotifications,
  getAllNotifications,
  sendTestEmail,
};