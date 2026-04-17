import axios from "../lib/axios";

const DOCTOR_BASE_URL =
  import.meta.env.VITE_DOCTOR_BASE_URL || "http://localhost:5003";

// Availability endpoints
export const getMyAvailability = async () => {
  const response = await axios.get(`${DOCTOR_BASE_URL}/api/doctor/availability/me`);
  return response.data;
};

export const createAvailability = async (payload) => {
  const response = await axios.post(`${DOCTOR_BASE_URL}/api/doctor/availability`, payload);
  return response.data;
};

export const updateAvailability = async (id, payload) => {
  const response = await axios.patch(`${DOCTOR_BASE_URL}/api/doctor/availability/${id}`, payload);
  return response.data;
};

export const deleteAvailability = async (id) => {
  const response = await axios.delete(`${DOCTOR_BASE_URL}/api/doctor/availability/${id}`);
  return response.data;
};

export const calculateAvailabilityMetrics = async (payload) => {
  const response = await axios.post(
    `${DOCTOR_BASE_URL}/api/doctor/availability/calculate-metrics`,
    payload
  );
  return response.data;
};

// Alias if some components still use old name
export const calculateMaxAppointments = async (payload) => {
  const response = await axios.post(
    `${DOCTOR_BASE_URL}/api/doctor/availability/calculate-metrics`,
    payload
  );
  return response.data;
};

export const checkTimeAvailability = async (payload) => {
  const response = await axios.post(
    `${DOCTOR_BASE_URL}/api/doctor/availability/check-time`,
    payload
  );
  return response.data;
};

// Patient-facing Availability endpoints
export const getAllAvailabilitySlots = async () => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/availability/slots/enriched`
  );
  return response.data;
};

export const getAvailableSlotsByDoctor = async (
  doctorId,
  { date, consultationType } = {}
) => {
  const params = new URLSearchParams();

  if (date) params.append("date", date);
  if (consultationType && consultationType !== "both") {
    params.append(
      "consultationType",
      consultationType === "physical" ? "in_person" : consultationType
    );
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/availability/doctor/${doctorId}${query}`
  );
  return response.data;
};

export const getDoctorDetailsById = async (doctorId) => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/details/${doctorId}`
  );
  return response.data;
};

// Consultation Notes endpoints
export const createConsultationNote = async (payload) => {
  const response = await axios.post(
    `${DOCTOR_BASE_URL}/api/doctor/consultation-notes`,
    payload
  );
  return response.data;
};

export const getConsultationNoteByAppointment = async (appointmentId) => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/appointment/${appointmentId}`
  );
  return response.data;
};

export const getConsultationNoteById = async (id) => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/${id}`
  );
  return response.data;
};

export const getMyConsultationNotes = async () => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/me`
  );
  return response.data;
};

export const getConsultationNotesByPatient = async (patientId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams
    ? `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/patient/${patientId}?${queryParams}`
    : `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/patient/${patientId}`;

  const response = await axios.get(url);
  return response.data;
};

export const updateConsultationNote = async (id, payload) => {
  const response = await axios.patch(
    `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/${id}`,
    payload
  );
  return response.data;
};

export const deleteConsultationNote = async (id) => {
  const response = await axios.delete(
    `${DOCTOR_BASE_URL}/api/doctor/consultation-notes/${id}`
  );
  return response.data;
};

// Prescription endpoints
export const createPrescription = async (payload) => {
  const response = await axios.post(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions`,
    payload
  );
  return response.data;
};

export const getPrescriptionsByDoctor = async (doctorId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams
    ? `${DOCTOR_BASE_URL}/api/doctor/prescriptions/doctor/${doctorId}?${queryParams}`
    : `${DOCTOR_BASE_URL}/api/doctor/prescriptions/doctor/${doctorId}`;

  const response = await axios.get(url);
  return response.data;
};

export const getPrescriptionsByPatient = async (patientId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams
    ? `${DOCTOR_BASE_URL}/api/doctor/prescriptions/patient/${patientId}?${queryParams}`
    : `${DOCTOR_BASE_URL}/api/doctor/prescriptions/patient/${patientId}`;

  const response = await axios.get(url);
  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions/${id}`
  );
  return response.data;
};

export const getPrescriptionByAppointment = async (appointmentId) => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions/appointment/${appointmentId}`
  );
  return response.data;
};

export const updatePrescription = async (id, payload) => {
  const response = await axios.put(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions/${id}`,
    payload
  );
  return response.data;
};

export const deletePrescription = async (id) => {
  const response = await axios.delete(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions/${id}`
  );
  return response.data;
};

export const updatePrescriptionStatus = async (id, status) => {
  const response = await axios.patch(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions/${id}/status`,
    { status }
  );
  return response.data;
};

export const getPatientPrescriptionsSummary = async (patientId) => {
  const response = await axios.get(
    `${DOCTOR_BASE_URL}/api/doctor/prescriptions/patient/${patientId}/summary`
  );
  return response.data;
};

// Doctor Profile endpoints
export const getDoctorProfile = async () => {
  const response = await axios.get(`${DOCTOR_BASE_URL}/api/doctor/profile`);
  return response.data;
};

export const updateDoctorProfile = async (payload) => {
  const response = await axios.put(
    `${DOCTOR_BASE_URL}/api/doctor/profile`,
    payload
  );
  return response.data;
};

export const getDoctorStats = async () => {
  const response = await axios.get(`${DOCTOR_BASE_URL}/api/doctor/stats`);
  return response.data;
};

export const getDoctorPatients = async () => {
  const response = await axios.get(`${DOCTOR_BASE_URL}/api/doctor/patients`);
  return response.data;
};