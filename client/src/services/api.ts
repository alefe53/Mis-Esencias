// RUTA: client/src/services/api.ts

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Flag para evitar múltiples redirecciones por errores 401 simultáneos
let isRedirecting = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, reseteamos el flag de redirección
    isRedirecting = false;
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Obtenemos la instancia del store de autenticación DENTRO del interceptor
      const authStore = useAuthStore();
      
      // Solo actuamos si el usuario ESTABA autenticado
      if (authStore.isAuthenticated) {
        isRedirecting = true; // Activamos el flag
        console.error("Token inválido o expirado. Deslogueando...");
        
        // Llamamos a la función logout con el nuevo parámetro
        authStore.logout(true); 
      }
    }
    return Promise.reject(error);
  }
);

export default api;