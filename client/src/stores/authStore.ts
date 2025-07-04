// src/stores/authStores.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue' 
import type { User, RegisterPayload } from '../types/index.ts' // Importa el nuevo tipo
import api from '../services/api' 

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('authToken'))

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  async function login(email: string, password: string) {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success && data.token) {
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('authToken', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
    } catch (error) {
      console.error("Error en el login:", error);
      throw error; // Re-lanza el error para que el componente lo atrape
    }
  }

  // --- NUEVA ACCIÓN DE REGISTRO ---
  async function register(payload: RegisterPayload) {
    try {
      // Tu backend debería esperar un objeto con email, password, firstName, etc.
      await api.post('/auth/register', payload);
    } catch (error) {
      console.error("Error en el registro:", error);
      throw error; // Re-lanza el error para que el componente lo atrape
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  }

  function checkUserSession() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      token.value = storedToken;
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        user.value = payload;
      } catch (error) {
        console.error("Token almacenado es inválido, limpiando sesión:", error);
        logout();
      }
    }
  }
  
  return { 
    user, 
    token, 
    isAuthenticated, 
    login, 
    register, 
    logout, 
    checkUserSession 
  }
})
