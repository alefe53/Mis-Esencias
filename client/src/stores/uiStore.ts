// RUTA: client/src/stores/uiStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isGlobalTransitionActive = ref(false)
  const hasShownInitialPrompt = ref(false)
  function setTransitionState(isActive: boolean) {
    isGlobalTransitionActive.value = isActive
  }

  function setInitialPromptAsShown() {
    hasShownInitialPrompt.value = true
  }

  return {
    isGlobalTransitionActive,
    setTransitionState,
    hasShownInitialPrompt,
    setInitialPromptAsShown,
  }
})