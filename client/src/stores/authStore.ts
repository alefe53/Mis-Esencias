// src/stores/authStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, RegisterPayload, ProfileUpdatePayload } from '../types/index.ts';
import api from '../services/api';
import * as profileService from '../services/profileService.ts';
import { usePlayerStore } from './playerStore';
import { useUiStore } from './uiStore';
import { useRouter } from 'vue-router';
import { supabase } from '../services/supabaseClient';
// Usamos la importación nombrada, es el estándar moderno para módulos ES
import { jwtDecode } from 'jwt-decode';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Definimos una interfaz para el token decodificado para mayor seguridad de tipos
interface DecodedToken {
  exp: number; // 'exp' es el timestamp de expiración
  [key: string]: any;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const router = useRouter();

  // Variable para almacenar la referencia al timer del logout proactivo.
  // Usamos 'ReturnType<typeof setTimeout>' para que TypeScript sepa el tipo exacto.
  let expirationTimer: ReturnType<typeof setTimeout> | null = null;

  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const isAdmin = computed(() => user.value?.id === import.meta.env.VITE_ADMIN_USER_ID);

  /**
   * Centraliza la lógica de inicio de sesión.
   * 1. Actualiza el estado de Pinia (token y user).
   * 2. Guarda la sesión en localStorage.
   * 3. Limpia cualquier timer de expiración anterior.
   * 4. Decodifica el nuevo token y programa un logout proactivo.
   */
  function setSession(newToken: string, newUser: User) {
    token.value = newToken;
    user.value = newUser;

    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));

    // Si ya existía un timer, lo limpiamos para evitar múltiples timers ejecutándose.
    if (expirationTimer) {
      clearTimeout(expirationTimer);
      expirationTimer = null;
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(newToken);
      // 'exp' viene en segundos, lo convertimos a milisegundos.
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = Date.now();

      // Programamos el logout 5 segundos ANTES de que expire el token.
      // Esto previene errores en peticiones que se hagan justo en el límite.
      const timeoutDuration = expirationTime - currentTime - 5000;

      if (timeoutDuration > 0) {
        expirationTimer = setTimeout(() => {
          console.log('Sesión expirada. Realizando logout proactivo.');
          logout(true); // Llamamos a logout indicando que la sesión expiró.
        }, timeoutDuration);
      } else {
        // Si el token ya está expirado al momento de chequear, deslogueamos inmediatamente.
        console.warn('El token ya ha expirado. Forzando logout.');
        logout(true);
      }
    } catch (error) {
      console.error('Error al decodificar el token JWT. No se pudo programar el logout proactivo.', error);
    }
  }

  async function login(email: string, password: string) {
    // ... (Tu lógica de reintentos es buena y se mantiene igual)
    const MAX_RETRIES = 3
    const RETRY_DELAY_MS = 3000
    let lastError: any = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.success && data.token && data.user) {
          // Usamos la función centralizada para establecer la sesión.
          setSession(data.token, data.user);
          
          await fetchUserProfile();
          await useUiStore().ensureMoodsAvailable();
          return; // Salimos del bucle y la función.
        }
      } catch (error) {
        lastError = error
        console.warn(
          `Intento de login ${attempt}/${MAX_RETRIES} fallido. Reintentando en ${RETRY_DELAY_MS / 1000}s...`,
        )
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS)
        }
      }
    }

    console.error('Error en el login después de todos los reintentos:', lastError);
    throw lastError;
  }

  async function loginWithGoogle(supabaseToken: string) {
    const playerStore = usePlayerStore();
    const uiStore = useUiStore();
    playerStore.reset();

    try {
      const { data } = await api.post('/auth/google/callback', { supabaseToken });
      if (data.success && data.token && data.user) {
        // Usamos la función centralizada aquí también.
        setSession(data.token, data.user);

        await fetchUserProfile();
        await uiStore.ensureMoodsAvailable();
        // Para Google, la redirección con router es más fluida.
        router.push('/');
      }
    } catch (error) {
      console.error('Error en el callback de Google:', error);
      throw new Error('No se pudo iniciar sesión con Google.');
    }
  }
  
  async function logout(sessionExpired = false) {
    const playerStore = usePlayerStore();
    const uiStore = useUiStore();

    playerStore.reset();
    uiStore.resetLoginToast();

    // Importante: Asegurarse de limpiar el timer en un logout manual.
    if (expirationTimer) {
      clearTimeout(expirationTimer);
      expirationTimer = null;
    }

    // Limpiamos la sesión en Supabase y en el estado local.
    await supabase.auth.signOut();
    token.value = null;
    user.value = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');

    uiStore.ensureMoodsAvailable();

    if (sessionExpired) {
      uiStore.showToast({
        message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        color: '#ef4444',
        duration: 5000,
      });
    }

    // Forzamos una recarga completa a la página de inicio.
    // Esto garantiza que toda la app se reinicie en un estado "limpio".
    // El router se encargará de mostrar HomeView.vue porque ya no estamos autenticados.
    window.location.href = '/';
  }

  /**
   * Verifica la sesión desde localStorage al cargar la app.
   */
  function checkUserSession() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Usamos setSession para re-establecer el estado Y el timer proactivo.
        setSession(storedToken, parsedUser);
        fetchUserProfile(); // Actualizamos los datos del perfil por si cambiaron.
      } catch (e) {
        console.error('Datos de usuario corruptos, limpiando sesión.', e);
        logout();
      }
    }
  }
  
  // --- El resto de las funciones no necesitan cambios ---

  async function fetchUserProfile() {
    try {
      const response = await profileService.getProfile();
      if (response.success && response.data) {
        user.value = response.data;
        localStorage.setItem('authUser', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('No se pudo refrescar el perfil del usuario:', error);
    }
  }

  async function register(payload: RegisterPayload) {
    try {
      await api.post('/auth/register', payload);
    } catch (error) {
      console.error('Error en el registro:', error);
      throw error;
    }
  }

  async function updateUserProfile(payload: ProfileUpdatePayload) {
    try {
      const response = await profileService.updateProfile(payload);
      if (response.success && response.data) {
        const updatedUser = { ...user.value, ...response.data } as User;
        user.value = updatedUser;
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      throw error;
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
      console.error('Error al subir el avatar:', error);
      throw error;
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    loginWithGoogle,
    register,
    logout,
    checkUserSession,
    updateUserProfile,
    updateUserAvatar,
    fetchUserProfile,
  };
});