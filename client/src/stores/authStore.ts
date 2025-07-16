// stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, RegisterPayload, ProfileUpdatePayload } from '../types/index.ts'
import api from '../services/api'
import * as profileService from '../services/profileService.ts' 
import { usePlayerStore } from './playerStore'
import { useUiStore } from './uiStore'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => {
    return user.value?.id === import.meta.env.VITE_ADMIN_USER_ID
  })

  async function login(email: string, password: string) {
    const playerStore = usePlayerStore()
    const uiStore = useUiStore()
    playerStore.reset()
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (data.success && data.token && data.user) {
        token.value = data.token
        user.value = data.user
        
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('authUser', JSON.stringify(data.user))
        await fetchUserProfile()
        await uiStore.ensureMoodsAvailable()
      }
    } catch (error) {
      console.error("Error en el login:", error)
      throw error
    }
  }

  async function fetchUserProfile() {
      try {
          const response = await profileService.getProfile();
          if(response.success && response.data) {
              user.value = response.data;
              localStorage.setItem('authUser', JSON.stringify(response.data));
          }
      } catch (error) {
          console.error("No se pudo refrescar el perfil del usuario:", error);
      }
  }

  function logout() {
    const playerStore = usePlayerStore()
    const uiStore = useUiStore()

    playerStore.reset()
    uiStore.resetLoginToast()

    token.value = null
    user.value = null

    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    
    uiStore.ensureMoodsAvailable()
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