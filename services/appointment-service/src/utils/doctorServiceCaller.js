import axios from "axios";

const DOCTOR_SERVICE_URL =
  process.env.DOCTOR_SERVICE_URL || "http://doctor-service:5003/api/doctor";

const INTERNAL_API_KEY = process.env.INTERNAL_SERVICE_API_KEY;

/**
 * Increment booked count on availability slot
 */
export const incrementAvailabilityBookedCount = async (availabilityId, token) => {
  try {
    const response = await axios.post(
      `${DOCTOR_SERVICE_URL}/availability/${availabilityId}/increment-booked`,
      { increment: 1 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-internal-api-key": INTERNAL_API_KEY,
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `Failed to increment booked count for availability ${availabilityId}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Decrement booked count on availability slot
 */
export const decrementAvailabilityBookedCount = async (availabilityId, token) => {
  try {
    const response = await axios.post(
      `${DOCTOR_SERVICE_URL}/availability/${availabilityId}/decrement-booked`,
      { decrement: 1 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-internal-api-key": INTERNAL_API_KEY,
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `Failed to decrement booked count for availability ${availabilityId}:`,
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Get available slots for a doctor
 */
export const getAvailableSlotsByDoctor = async (
  doctorId,
  date,
  consultationType,
  token
) => {
  try {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (consultationType) params.append("consultationType", consultationType);

    const url = `${DOCTOR_SERVICE_URL}/availability/doctor/${doctorId}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    console.error(
      `Failed to get available slots for doctor ${doctorId}:`,
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to fetch availability: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};