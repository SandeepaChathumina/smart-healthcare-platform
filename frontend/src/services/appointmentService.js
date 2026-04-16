import axios from '../lib/axios';

const APPOINTMENT_BASE_URL = import.meta.env.VITE_APPOINTMENT_BASE_URL;

export const createAppointment = async (payload) => {
  const response = await axios.post(`${APPOINTMENT_BASE_URL}/api/appointments`, payload);
  return response.data;
};

export const getAppointmentsByPatient = async (patientId) => {
  const response = await axios.get(`${APPOINTMENT_BASE_URL}/api/appointments/patient/${patientId}`);
  return response.data;
};

export const getAppointmentsByDoctor = async (doctorId) => {
  const response = await axios.get(`${APPOINTMENT_BASE_URL}/api/appointments/doctor/${doctorId}`);
  return response.data;
};

export const getAppointmentById = async (appointmentId) => {
  const response = await axios.get(`${APPOINTMENT_BASE_URL}/api/appointments/${appointmentId}`);
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, payload) => {
  const response = await axios.patch(
    `${APPOINTMENT_BASE_URL}/api/appointments/${appointmentId}/status`,
    payload
  );
  return response.data;
};

export const cancelAppointment = async (appointmentId, payload) => {
  const response = await axios.patch(
    `${APPOINTMENT_BASE_URL}/api/appointments/${appointmentId}/cancel`,
    payload
  );
  return response.data;
};

// Payment endpoints
export const createPayment = async (appointmentId, payload) => {
  const response = await axios.post(
    `${APPOINTMENT_BASE_URL}/api/payments/${appointmentId}/pay`,
    payload
  );
  return response.data;
};

export const getPaymentById = async (paymentId) => {
  const response = await axios.get(`${APPOINTMENT_BASE_URL}/api/payments/${paymentId}`);
  return response.data;
};

// Telemedicine endpoints
export const createTelemedicineSession = async (appointmentId, payload = {}) => {
  const response = await axios.post(
    `${APPOINTMENT_BASE_URL}/api/telemedicine-sessions/${appointmentId}`,
    payload
  );
  return response.data;
};

export const getTelemedicineSessionByAppointment = async (appointmentId) => {
  const response = await axios.get(`${APPOINTMENT_BASE_URL}/api/telemedicine-sessions/appointment/${appointmentId}`);
  return response.data;
};

export const updateTelemedicineSessionStatus = async (sessionId, payload) => {
  const response = await axios.patch(
    `${APPOINTMENT_BASE_URL}/api/telemedicine-sessions/${sessionId}/status`,
    payload
  );
  return response.data;
};