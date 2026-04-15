import axios from '../lib/axios';

const APPOINTMENT_BASE_URL = import.meta.env.VITE_APPOINTMENT_BASE_URL || 'http://localhost:5004';

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