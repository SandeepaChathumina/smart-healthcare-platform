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

    if (appointment.doctorId !== doctorId) {
      throw new Error("This appointment does not belong to you");
    }

    if (appointment.status !== "confirmed" && appointment.status !== "completed") {
      throw new Error(`Cannot add consultation note. Appointment status is ${appointment.status}`);
    }

    return appointment;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Appointment validation failed");
    }
    throw new Error(error.message || "Failed to validate appointment");
  }
};

const updateAppointmentStatus = async (appointmentId, status, token) => {
  try {
    const response = await axios.patch(
      `${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/status`,
      { status },
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
  }
};

const sendNotification = async (receiverIds, eventType, metadata, token) => {
  try {
    const response = await axios.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      {
        receiverIds: [receiverIds],
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
  }
};

module.exports = {
  validateAppointment,
  updateAppointmentStatus,
  sendNotification,
};