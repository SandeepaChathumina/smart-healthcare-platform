import axios from '../lib/axios';

const PATIENT_BASE_URL =
  import.meta.env.VITE_PATIENT_BASE_URL || 'http://localhost:5002';

// Report endpoints
export const uploadReport = async (formData) => {
  const response = await axios.post(`${PATIENT_BASE_URL}/api/patient/reports/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAllReports = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams 
    ? `${PATIENT_BASE_URL}/api/patient/reports?${queryParams}`
    : `${PATIENT_BASE_URL}/api/patient/reports`;
  const response = await axios.get(url);
  return response.data;
};

export const getReportById = async (reportId) => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/reports/${reportId}`);
  return response.data;
};

export const deleteReport = async (reportId) => {
  const response = await axios.delete(`${PATIENT_BASE_URL}/api/patient/reports/${reportId}`);
  return response.data;
};

export const downloadReport = async (reportId) => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/reports/download/${reportId}`, {
    responseType: 'blob',
  });
  return response;
};

// Medical History endpoints
export const getMedicalHistory = async () => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/medical-history`);
  return response.data;
};

export const updateMedicalHistory = async (payload) => {
  const response = await axios.put(`${PATIENT_BASE_URL}/api/patient/medical-history`, payload);
  return response.data;
};

// Prescription endpoints
export const getPatientPrescriptions = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams 
    ? `${PATIENT_BASE_URL}/api/patient/prescriptions?${queryParams}`
    : `${PATIENT_BASE_URL}/api/patient/prescriptions`;
  const response = await axios.get(url);
  return response.data;
};

export const getPatientPrescriptionById = async (prescriptionId) => {
  const response = await axios.get(`${PATIENT_BASE_URL}/api/patient/prescriptions/${prescriptionId}`);
  return response.data;
};