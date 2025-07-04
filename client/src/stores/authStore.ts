// src/stores/authStores.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue' 
import type { User, RegisterPayload, ProfileUpdatePayload  } from '../types/index.ts'
import api from '../services/api' 
import * as profileService from '../services/profileService.ts'
import { usePlayerStore } from './playerStore'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('authToken'))

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  async function login(email: string, password: string) {
    const playerStore = usePlayerStore()
    console.log('AUTH_STORE: login() called. Resetting player store...');
    playerStore.reset() 
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success && data.token) {
        console.log('FRONTEND: Token generado en login ->', data.token);
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('authToken', data.token);
         console.log('AUTH_STORE: Login successful. Now calling ensureMoodsAvailable...');
       
        await playerStore.ensureMoodsAvailable();
           console.log('AUTH_STORE: Finished ensureMoodsAvailable call after login.');
     
      }
    } catch (error) {
      console.error("Error en el login:", error);
      throw error; 
    }
  }

  async function register(payload: RegisterPayload) {
    try {
      await api.post('/auth/register', payload);
    } catch (error) {
      console.error("Error en el registro:", error);
      throw error;
    }
  }

  async function updateUserProfile(payload: ProfileUpdatePayload) {
    try {
      const response = await profileService.updateProfile(payload);
      
      if (response.success && response.data) {
        user.value = { ...user.value, ...response.data };
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      throw error; 
    }
  }

  function logout() {
    const playerStore = usePlayerStore()
     console.log('AUTH_STORE: logout() called. Resetting player store...');
  
    playerStore.reset()
    token.value = null;
    user.value = null;
    localStorage.removeItem('authToken');
     console.log('AUTH_STORE: Logout finished. Now calling ensureMoodsAvailable...');
    
    playerStore.ensureMoodsAvailable();
       console.log('AUTH_STORE: Finished ensureMoodsAvailable call after logout.');
 
  }

  function checkUserSession() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      token.value = storedToken;
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        user.value = payload.user; 
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
    checkUserSession,
    updateUserProfile
  }
})
