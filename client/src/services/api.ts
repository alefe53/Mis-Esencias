// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response, 
  (error) => {
    console.error('Error en la llamada API:', error);
    if (error.response?.status === 401) {
        console.log("Token inválido o expirado. Se requiere nuevo login.");
    }
    return Promise.reject(error);
  }
);

export default api;