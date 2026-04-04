const Notification = require("../models/Notification");
const sendEmail = require("../services/emailService");
const sendSMS = require("../services/smsService");
const { getUserContactsByIds } = require("../services/authService");
const { buildMessages } = require("../utils/messageTemplates");

const sendNotifications = async (req, res) => {
  try {
    const {
      senderId = null,
      senderRole = null,
      senderName = null,
      receiverIds,
      eventType = "CUSTOM",
      metadata = {},
    } = req.body;

    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({
        message: "receiverIds must be a non-empty array",
      });
    }

    const uniqueIds = [...new Set([...receiverIds, ...(senderId ? [senderId] : [])])];

    const contactResponse = await getUserContactsByIds(uniqueIds);
    const contacts = contactResponse.contacts || [];

    if (!contacts.length) {
      return res.status(404).json({
        message: "No user contacts found from auth service",
      });
    }

    const senderContact = senderId
      ? contacts.find((user) => String(user.id) === String(senderId))
      : null;

    const receiverContacts = contacts.filter((user) =>
      receiverIds.map(String).includes(String(user.id))
    );

    if (!receiverContacts.length) {
      return res.status(404).json({
        message: "No receiver contacts found from auth service",
      });
    }

    const results = [];

    for (const contact of receiverContacts) {
      const { emailSubject, emailMessage, smsMessage } = buildMessages({
        eventType,
        recipientName: contact.fullName,
        metadata,
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
        eventType,

        senderId: senderContact ? senderContact.id : senderId,
        senderRole: senderContact ? senderContact.role : senderRole,
        senderName: senderContact ? senderContact.fullName : senderName,

        recipientId: contact.id,
        recipientRole: contact.role || null,
        recipientName: contact.fullName || null,

        email: contact.email || null,
        phone: contact.phone || null,

        emailSubject,
        emailMessage,
        smsMessage,

        emailStatus,
        smsStatus,
        errorMessage,
        metadata,
      });

      results.push(log);
    }

    return res.status(200).json({
      success: true,
      message: "Notifications processed successfully",
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
  sendNotifications,
  getAllNotifications,
  sendTestEmail,
};