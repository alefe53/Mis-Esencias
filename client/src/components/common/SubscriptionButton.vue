<template>
  <router-link
    to="/subscribe"
    class="subscription-button"
    :class="{
      scrolled: isEffectivelyScrolled, // Usamos la nueva propiedad computada
      'mode-corner-float': props.mode === 'corner-float',
    }"
    :style="dynamicStyle"
  >
    {{ buttonText }}
  </router-link>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useScrollState } from '../../composables/useScrollState'
import { usePlayerStore } from '../../stores/playerStore'
import { useUiStore } from '../../stores/uiStore'
import { moodColors } from '../../constants/moods'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  mode?: 'default' | 'corner-float'
  forceFloatOnMobile?: boolean // Nueva propiedad
}>()

const { isScrolled } = useScrollState(50)
const playerStore = usePlayerStore()
const uiStore = useUiStore()

const { currentMoodId } = storeToRefs(playerStore)
const { availableMoods } = storeToRefs(uiStore)

// --- LÓGICA PARA DETECTAR SI ES MÓVIL ---
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
// --- FIN LÓGICA MÓVIL ---

// --- LÓGICA MEJORADA PARA EL ESTADO DEL BOTÓN ---
const isEffectivelyScrolled = computed(() => {
  // En móvil, si se fuerza el modo flotante, siempre está "scrolled"
  if (props.forceFloatOnMobile && isMobile.value) {
    return true
  }
  // En otros casos, depende del scroll normal
  return isScrolled.value
})

const buttonText = computed(() => {
  return isEffectivelyScrolled.value ? 'U' : 'Unite a la comunidad'
})
// --- FIN LÓGICA MEJORADA ---

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex,
  )
  if (!result) {
    return '252, 163, 17'
  }
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `${r}, ${g}, ${b}`
}

const dynamicStyle = computed(() => {
  const defaultBgColor = '#fca311'
  const defaultGlowRgb = '252, 163, 17'
  if (!currentMoodId.value || currentMoodId.value === 5) {
    return {
      '--button-bg-color': defaultBgColor,
      '--button-glow-color-rgb': defaultGlowRgb,
    }
  }
  const currentMood = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )
  const color = currentMood ? moodColors[currentMood.name] : defaultBgColor
  const rgbColor = hexToRgb(color)
  return {
    '--button-bg-color': color,
    '--button-glow-color-rgb': rgbColor,
  }
})
</script>

<style scoped>
/* Tu CSS existente se mantiene igual */
@keyframes swoosh-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes pulse-animation {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(var(--button-glow-color-rgb), 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(var(--button-glow-color-rgb), 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(var(--button-glow-color-rgb), 0);
  }
}

@keyframes pulse-shake-animation {
  0% {
    transform: scale(1) translateX(0);
  }
  25% {
    transform: scale(1.15) translateX(-3px);
  }
  50% {
    transform: scale(0.9) translateX(0);
  }
  75% {
    transform: scale(1.1) translateX(3px);
  }
  100% {
    transform: scale(1) translateX(0);
  }
}

.subscription-button {
  --button-bg-color: #fca311;
  --button-glow-color-rgb: 252, 163, 17;

  position: relative;
  padding: 8px 16px;
  background-color: var(--button-bg-color);
  color: #14213d;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  z-index: 1050;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: pulse-animation 2s infinite;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.subscription-button.scrolled {
  font-family: 'Uncial Antiqua', serif;
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation:
    swoosh-in 0.4s ease-out forwards,
    pulse-shake-animation 1.5s ease-in-out 0.4s infinite;
}

.subscription-button.mode-corner-float.scrolled {
  position: fixed;
  top: 10rem;
  right: 3rem;
  left: auto;
  transform: none;
}

.subscription-button:hover {
  transform: scale(1.05);
  animation-play-state: paused;
}

.subscription-button.scrolled:hover {
  transform: scale(1.1);
  animation-play-state: paused;
}

@media (max-width: 768px) {
  .subscription-button.mode-corner-float.scrolled {
    top: 5.5rem;
    right: 1.5rem;
  }
}
</style>
