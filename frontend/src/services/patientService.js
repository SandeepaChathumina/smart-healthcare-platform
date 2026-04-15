import axios from '../lib/axios';

const PATIENT_BASE_URL = import.meta.env.VITE_PATIENT_BASE_URL || 'http://localhost:5002';

// ==================== REPORT SERVICES ====================

// Upload a medical report
export const uploadReport = async (formData) => {
  const response = await axios.post(
    `${PATIENT_BASE_URL}/api/patient/reports/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Get all reports for current patient
export const getMyReports = async (params = {}) => {
  const { reportType, page = 1, limit = 10 } = params;
  let url = `${PATIENT_BASE_URL}/api/patient/reports?page=${page}&limit=${limit}`;
  if (reportType) {
    url += `&reportType=${reportType}`;
  }
  const response = await axios.get(url);
  return response.data;
};

// Get single report by ID
export const getReportById = async (reportId) => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/reports/${reportId}`);
  return response.data;
};

// Delete report (soft delete)
export const deleteReport = async (reportId) => {
  const response = await axios.delete(`${PATIENT_BASE_URL}/api/patient/reports/${reportId}`);
  return response.data;
};

// Download report file
export const downloadReport = async (reportId) => {
  const response = await axios.get(
    `${PATIENT_BASE_URL}/api/patient/reports/download/${reportId}`,
    {
      responseType: 'blob',
    }
  );
  return response;
};

// ==================== MEDICAL HISTORY SERVICES ====================

// Get medical history
export const getMedicalHistory = async () => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/medical-history`);
  return response.data;
};

// Update medical history
export const updateMedicalHistory = async (data) => {
  const response = await axios.put(`${PATIENT_BASE_URL}/api/patient/medical-history`, data);
  return response.data;
};

// ==================== APPOINTMENT SERVICES (from patient service) ====================

// Get appointment history from patient service
export const getMyAppointmentsFromPatientService = async (params = {}) => {
  const { status, page = 1, limit = 10 } = params;
  let url = `${PATIENT_BASE_URL}/api/patient/appointments?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }
  const response = await axios.get(url);
  return response.data;
};

// Get single appointment from patient service
export const getAppointmentFromPatientService = async (appointmentId) => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/appointments/${appointmentId}`);
  return response.data;
};

// ==================== PRESCRIPTION SERVICES ====================

// Get prescriptions (from reports where type is Prescription)
export const getMyPrescriptions = async (params = {}) => {
  const { page = 1, limit = 10 } = params;
  const response = await axios.get(
    `${PATIENT_BASE_URL}/api/patient/prescriptions?page=${page}&limit=${limit}`
  );
  return response.data;
};

// Get single prescription
export const getPrescriptionById = async (prescriptionId) => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/prescriptions/${prescriptionId}`);
  return response.data;
};