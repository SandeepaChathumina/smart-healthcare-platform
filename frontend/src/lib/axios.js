import axios from 'axios';
import { AUTH_BASE_URL } from '../config/env';
import { clearAuthData, getToken } from '../utils/authStorage';

const axiosInstance = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error?.response?.status;
    const message = error?.response?.data?.message || '';

    if (
      statusCode === 401 ||
      message.toLowerCase().includes('token failed') ||
      message.toLowerCase().includes('token expired')
    ) {
      clearAuthData();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;