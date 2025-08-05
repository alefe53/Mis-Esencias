// RUTA: client/src/stores/authStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, RegisterPayload, ProfileUpdatePayload } from '../types/index.ts'
import api from '../services/api'
import * as profileService from '../services/profileService.ts' 
import { usePlayerStore } from './playerStore'
import { useUiStore } from './uiStore'
import { useRouter } from 'vue-router' // Importamos useRouter

// --- INICIO: LÓGICA MODIFICADA ---

// Helper para crear una pausa
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const router = useRouter() // Obtenemos la instancia del router

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => {
    return user.value?.id === import.meta.env.VITE_ADMIN_USER_ID
  })

  async function login(email: string, password: string) {
    const playerStore = usePlayerStore()
    const uiStore = useUiStore()
    
    playerStore.reset()

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await api.post('/auth/login', { email, password })
        if (data.success && data.token && data.user) {
          token.value = data.token
          user.value = data.user
          
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('authUser', JSON.stringify(data.user))

          await fetchUserProfile()
          await uiStore.ensureMoodsAvailable()

          return; // Si el login es exitoso, salimos de la función.
        }
      } catch (error) {
        lastError = error;
        console.warn(`Intento de login ${attempt}/${MAX_RETRIES} fallido. Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    // Si el bucle termina sin éxito, lanzamos el último error capturado.
    console.error("Error en el login después de todos los reintentos:", lastError);
    throw lastError;
  }
// --- FIN: LÓGICA MODIFICADA ---

  async function fetchUserProfile() {
      try {
          const response = await profileService.getProfile();
          if(response.success && response.data) {
              user.value = response.data;
              localStorage.setItem('authUser', JSON.stringify(response.data));
          }
      } catch (error) {
          console.error("No se pudo refrescar el perfil del usuario:", error);
          // Si el perfil no se puede refrescar por un error 401, el interceptor se encargará
      }
  }

  function logout(sessionExpired = false) { // Acepta un parámetro opcional
    const playerStore = usePlayerStore()
    const uiStore = useUiStore()

    playerStore.reset()
    uiStore.resetLoginToast()

    token.value = null
    user.value = null

    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    
    uiStore.ensureMoodsAvailable()
    
    // Si la sesión expiró, mostramos un toast y redirigimos
    if (sessionExpired) {
        uiStore.showToast({
            message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
            color: '#ef4444', // Un color de error
            duration: 5000,
        });
        router.push('/auth');
    }
  }

  function checkUserSession() {
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('authUser')

    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
        fetchUserProfile();
      } catch (e) {
        console.error("Datos de usuario corruptos, limpiando sesión.", e)
        logout()
      }
    }
  }
  
  async function register(payload: RegisterPayload) {
    try {
      await api.post('/auth/register', payload)
    } catch (error) {
      console.error("Error en el registro:", error)
      throw error
    }
  }

  async function updateUserProfile(payload: ProfileUpdatePayload) {
    try {
      const response = await profileService.updateProfile(payload)
      if (response.success && response.data) {
        const updatedUser = { ...user.value, ...response.data } as User;
        user.value = updatedUser;
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)
      throw error
    }
  }
  async function updateUserAvatar(avatarFile: File) {
    try {
        const response = await profileService.uploadAvatar(avatarFile);
        if (response.success && response.data.avatarUrl && user.value) {
            user.value.avatar_url = response.data.avatarUrl;
            localStorage.setItem('authUser', JSON.stringify(user.value));
        }
        return response;
    } catch (error) {
        console.error("Error al subir el avatar:", error);
        throw error;
    }
  }
  return { 
    user, 
    token, 
    isAuthenticated, 
    isAdmin,
    login, 
    register, 
    logout, 
    checkUserSession,
    updateUserProfile,
    updateUserAvatar,
    fetchUserProfile ,
  }
})