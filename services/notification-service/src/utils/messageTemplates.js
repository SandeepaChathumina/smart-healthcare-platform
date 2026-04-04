const buildMessages = ({ eventType, recipientName, appointmentId, appointmentType, scheduledDateTime }) => {
  switch (eventType) {
    case "APPOINTMENT_BOOKED":
      return {
        emailSubject: "Appointment Booking Confirmation",
        emailMessage: `Hello ${recipientName},\n\nYour appointment booking has been created successfully.\nAppointment ID: ${appointmentId}\nType: ${appointmentType}\nScheduled Time: ${scheduledDateTime}\n\nThank you.`,
        smsMessage: `Hello ${recipientName}, your appointment booking is confirmed. ID: ${appointmentId}, Time: ${scheduledDateTime}.`,
      };

    case "CONSULTATION_COMPLETED":
      return {
        emailSubject: "Consultation Completed",
        emailMessage: `Hello ${recipientName},\n\nYour consultation has been completed successfully.\nAppointment ID: ${appointmentId}\n\nThank you.`,
        smsMessage: `Hello ${recipientName}, your consultation for appointment ${appointmentId} has been completed.`,
      };

    case "APPOINTMENT_ACCEPTED":
      return {
        emailSubject: "Appointment Accepted",
        emailMessage: `Hello ${recipientName},\n\nYour appointment has been accepted.\nAppointment ID: ${appointmentId}\nScheduled Time: ${scheduledDateTime}\n\nThank you.`,
        smsMessage: `Hello ${recipientName}, your appointment ${appointmentId} has been accepted.`,
      };

    default:
      return {
        emailSubject: "Notification",
        emailMessage: `Hello ${recipientName},\n\nThere is an update for your appointment ${appointmentId}.`,
        smsMessage: `Hello ${recipientName}, there is an update for appointment ${appointmentId}.`,
      };
  }
};

module.exports = {
  buildMessages,
};