import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Mood } from '../types'
import apiPublic from '../services/apiPublic'

export const useUiStore = defineStore('ui', () => {
  const isMoodGlowEnabled = ref(true)
  // --- NUEVO ESTADO PARA VISIBILIDAD DEL BOTÓN ---
  const hasMoodGlowBeenActivated = ref(false)

  const isGlobalTransitionActive = ref(false)
  const hasShownInitialPrompt = ref(false)
  const loginToastDismissed = ref(false)
  const isToastVisible = ref(false)
  const toastMessage = ref('')
  const toastBackgroundColor = ref('#333')
  let toastTimeout: number | undefined;

  const availableMoods = ref<Mood[]>([])
  const isMoodsLoading = ref(false)

  // --- MODIFICACIÓN DE LA ACCIÓN ---
  function toggleMoodGlow() {
    isMoodGlowEnabled.value = !isMoodGlowEnabled.value
    // Marcamos que el efecto se ha usado al menos una vez para que el botón aparezca.
    if (!hasMoodGlowBeenActivated.value) {
      hasMoodGlowBeenActivated.value = true
    }
  }
  
  // --- NUEVA ACCIÓN PARA ACTIVAR EL BOTÓN DESDE EL REPRODUCTOR ---
  function activateMoodGlow() {
    if (!hasMoodGlowBeenActivated.value) {
      hasMoodGlowBeenActivated.value = true
    }
  }


  async function fetchAvailableMoods() {
    if (isMoodsLoading.value) return;
    isMoodsLoading.value = true;
    try {
      const response = await apiPublic.get('/moods');
      availableMoods.value = response.data.data;
    } catch (error) {
      console.error('Error al obtener la lista de moods:', error);
      availableMoods.value = [];
    } finally {
      isMoodsLoading.value = false;
    }
  }

  async function ensureMoodsAvailable() {
    if (availableMoods.value.length > 0 || isMoodsLoading.value) {
      return;
    }
    await fetchAvailableMoods();
  }

  function setTransitionState(isActive: boolean) {
    isGlobalTransitionActive.value = isActive
  }

  function setInitialPromptAsShown() {
    hasShownInitialPrompt.value = true
  }

  function dismissLoginToast() {
    loginToastDismissed.value = true
  }

  function resetLoginToast() {
    loginToastDismissed.value = false
  }

  function showToast({ message, color = '#333', duration = 3500 }: { message: string, color?: string, duration?: number }) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastMessage.value = message;
    toastBackgroundColor.value = color;
    isToastVisible.value = true;
    toastTimeout = window.setTimeout(() => {
      isToastVisible.value = false;
    }, duration);
  }

  return {
    isMoodGlowEnabled,
    toggleMoodGlow,
    hasMoodGlowBeenActivated, 
    activateMoodGlow, 
    isGlobalTransitionActive,
    setTransitionState,
    hasShownInitialPrompt,
    setInitialPromptAsShown,
    loginToastDismissed,
    dismissLoginToast,
    resetLoginToast,
    isToastVisible,
    toastMessage,
    toastBackgroundColor,
    showToast,
    availableMoods,
    isMoodsLoading,
    ensureMoodsAvailable
  }
})