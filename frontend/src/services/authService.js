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

export const logoutUser = async () => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
};