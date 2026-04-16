const axios = require("axios");

const validateAppointment = async (appointmentId, doctorId, token) => {
  try {
    const response = await axios.get(
      `${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
        },
      }
    );

    const appointment = response.data.appointment;

    if (String(appointment.doctorId) !== String(doctorId)) {
      throw new Error("This appointment does not belong to you");
    }

    const validStatuses = ["accepted", "awaiting_payment", "confirmed", "completed", "rescheduled"];
    if (!validStatuses.includes(appointment.status)) {
      throw new Error(
        `Cannot add consultation note. Appointment status is ${appointment.status}`
      );
    }

    return appointment;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Appointment validation failed");
    }
    throw new Error(error.message || "Failed to validate appointment");
  }
};

const updateAppointmentStatus = async (appointmentId, status, token, additionalData = {}) => {
  try {
    const response = await axios.patch(
      `${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/status`,
      { status, ...additionalData },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update appointment status:", error.message);
    return null;
  }
};

const sendNotification = async (receiverIds, eventType, metadata, token) => {
  try {
    const receivers = Array.isArray(receiverIds) ? receiverIds : [receiverIds];

    const response = await axios.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      {
        receiverIds: receivers,
        eventType,
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to send notification:", error.message);
    return null;
  }
};

const getUserContacts = async (userId, token) => {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/internal/users/contacts`,
      { userIds: [userId] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
        },
      }
    );
    return response.data.contacts[0] || null;
  } catch (error) {
    console.error("Failed to get user contacts:", error.message);
    return null;
  }
};

module.exports = {
  validateAppointment,
  updateAppointmentStatus,
  sendNotification,
  getUserContacts,
};