const buildMessages = ({ eventType = "CUSTOM", recipientName = "User", metadata = {} }) => {
  if (metadata.emailSubject || metadata.emailMessage || metadata.smsMessage) {
    return {
      emailSubject: metadata.emailSubject || null,
      emailMessage: metadata.emailMessage || null,
      smsMessage: metadata.smsMessage || null,
    };
  }

  switch (eventType) {
    case "APPOINTMENT_BOOKED":
      return {
        emailSubject: "Appointment Booking Confirmation",
        emailMessage: `Hello ${recipientName},\n\nYour appointment booking has been created successfully.\n\nType: ${metadata.appointmentType || "N/A"}\nScheduled Time: ${metadata.scheduledDateTime || "N/A"}\n\nThank you.`,
        smsMessage: `Hello ${recipientName}, your appointment has been booked. Time: ${metadata.scheduledDateTime || "N/A"}.`,
      };

    case "APPOINTMENT_ACCEPTED":
      return {
        emailSubject: "Appointment Accepted",
        emailMessage: `Hello ${recipientName},\n\nYour appointment has been accepted.\nScheduled Time: ${metadata.scheduledDateTime || "N/A"}\n\nThank you.`,
        smsMessage: `Hello ${recipientName}, your appointment has been accepted.`,
      };

    case "CONSULTATION_COMPLETED":
      return {
        emailSubject: "Consultation Completed",
        emailMessage: `Hello ${recipientName},\n\nYour consultation has been completed successfully.\n\nThank you.`,
        smsMessage: `Hello ${recipientName}, your consultation has been completed.`,
      };

    default:
      return {
        emailSubject: null,
        emailMessage: null,
        smsMessage: null,
      };
  }
};

module.exports = {
  buildMessages,
};