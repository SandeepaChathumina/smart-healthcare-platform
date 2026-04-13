import axiosInstance from '../lib/axios';

export const loginUser = async (payload) => {
  const response = await axiosInstance.post('/api/auth/login', payload);
  return response.data;
};

export const registerPatient = async (payload) => {
  const response = await axiosInstance.post('/api/auth/register/patient', payload);
  return response.data;
};

export const registerDoctor = async (payload) => {
  const response = await axiosInstance.post('/api/auth/register/doctor', payload);
  return response.data;
};

export const registerAdmin = async (payload) => {
  const response = await axiosInstance.post('/api/auth/register/admin', payload);
  return response.data;
};

export const requestVerificationOtp = async (payload) => {
  const response = await axiosInstance.post('/api/auth/request-otp', payload);
  return response.data;
};

export const verifyEmailOtp = async (payload) => {
  const response = await axiosInstance.post('/api/auth/verify-email', payload);
  return response.data;
};

export const forgotPassword = async (payload) => {
  const response = await axiosInstance.post('/api/auth/forgot-password', payload);
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await axiosInstance.post('/api/auth/reset-password', payload);
  return response.data;
};

export const getPatientProfile = async () => {
  const response = await axiosInstance.get('/api/patient/profile');
  return response.data;
};

export const updatePatientProfile = async (payload) => {
  const response = await axiosInstance.put('/api/patient/profile', payload);
  return response.data;
};

export const getDoctorProfile = async () => {
  const response = await axiosInstance.get('/api/doctor/profile');
  return response.data;
};

export const updateDoctorProfile = async (payload) => {
  const response = await axiosInstance.put('/api/doctor/profile', payload);
  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
};

export const getPendingDoctors = async () => {
  const response = await axiosInstance.get('/api/admin/doctors/pending');
  return response.data;
};

export const approveDoctor = async (doctorId) => {
  const response = await axiosInstance.put(`/api/admin/doctors/${doctorId}/approve`);
  return response.data;
};

export const rejectDoctor = async (doctorId, payload = {}) => {
  const response = await axiosInstance.put(`/api/admin/doctors/${doctorId}/reject`, payload);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await axiosInstance.get('/api/admin/users');
  return response.data;
};

export const deleteUserById = async (userId) => {
  const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
  return response.data;
};

export const getUsersByRole = async (role) => {
  const response = await axiosInstance.get(`/api/admin/users/role/${role}`);
  return response.data;
};