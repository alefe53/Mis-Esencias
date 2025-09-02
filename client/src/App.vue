<template>
  <div id="app-container" :class="appContainerClass">
    <div class="background-layer"></div>

    <template v-if="!isPopupView">
      <main style="position: relative; z-index: 10">
        <router-view />
      </main>
      <MoodGlowEffect v-if="isMoodGlowEnabled" />

      <div
        class="mood-glow-toggle"
        v-if="
          hasMoodGlowBeenActivated &&
          authStore.isAuthenticated &&
          !isAuthView &&
          !isMobile
        "
        :style="toggleStyle"
      >
        <span class="toggle-label">Fx Humor</span>
        <button
          @click="uiStore.toggleMoodGlow"
          class="toggle-switch"
          :class="{ 'is-active': isMoodGlowEnabled }"
          aria-label="Activar o desactivar efecto de humor"
        >
          <div class="toggle-circle"></div>
        </button>
      </div>

      <transition name="fade">
        <header
          class="floating-nav-bar"
          v-if="!uiStore.isGlobalTransitionActive"
          :style="dynamicNavStyle"
        >
          <nav>
            <router-link
              to="/"
              :class="{ 'router-link-exact-active': isHomeRouteActive }"
              >Home</router-link
            >
            <router-link
              to="/music-intro"
              :class="{ 'router-link-exact-active': isMusicRouteActive }"
              >Música</router-link
            >
            <router-link
              to="/trabajos"
              :class="{ 'router-link-exact-active': isTrabajosRouteActive }"
              >Trabajos</router-link
            >
            <router-link to="/info">Info</router-link>

            <button
              v-if="
                isMobile &&
                hasMoodGlowBeenActivated &&
                authStore.isAuthenticated &&
                !isAuthView
              "
              @click="uiStore.toggleMoodGlow"
              class="nav-fx-toggle"
              :style="toggleStyle"
            >
              {{ fxButtonText }}
            </button>
          </nav>
        </header>
      </transition>

      <transition name="fade">
        <div class="auth-widget" v-if="!uiStore.isGlobalTransitionActive">
          <AuthButton />
        </div>
      </transition>

      <transition name="fade">
        <AudioPlayer v-show="!uiStore.isGlobalTransitionActive" />
      </transition>

      <Toast
        :visible="isToastVisible"
        :message="toastMessage"
        :backgroundColor="toastBackgroundColor"
      />

      <ChatWidget v-if="showChatWidget" />
      <LightboxModal />
    </template>

    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { moodColors } from './constants/moods'
import AudioPlayer from './components/player/AudioPlayer.vue'
import AuthButton from './components/layout/AuthButton.vue'
import MoodGlowEffect from './components/effects/MoodGlowEffect.vue'
import Toast from './components/common/Toast.vue'
import ChatWidget from './components/chat/ChatWidget.vue'
import LightboxModal from './components/gallery/LightboxModal.vue'
import { usePlayerStore } from './stores/playerStore'
import { useAuthStore } from './stores/authStore'
import { useUiStore } from './stores/uiStore'
import { useChatStore } from './stores/chatStore'

const route = useRoute()
const uiStore = useUiStore()
const playerStore = usePlayerStore()
const authStore = useAuthStore()
const chatStore = useChatStore()

const { isChatActivated } = storeToRefs(chatStore)
const { currentMoodId } = storeToRefs(playerStore)
const {
  isToastVisible,
  toastMessage,
  toastBackgroundColor,
  availableMoods,
  isMoodGlowEnabled,
  hasMoodGlowBeenActivated,
} = storeToRefs(uiStore)

watch(
  currentMoodId,
  (newMoodId) => {
    const root = document.documentElement
    const defaultColor = '#e0e0e0'

    if (newMoodId === null || availableMoods.value.length === 0) {
      root.style.setProperty('--cursor-color', defaultColor)
      return
    }

    const currentMood = availableMoods.value.find((m) => m.id === newMoodId)
    const newColor = currentMood ? moodColors[currentMood.name] : defaultColor

    root.style.setProperty('--cursor-color', newColor || defaultColor)
  },
  { immediate: true },
)

const toggleStyle = computed(() => {
  const defaultColor = '#3b82f6'
  if (currentMoodId.value === null) {
    return { '--toggle-active-color': defaultColor }
  }
  const currentMood = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )
  const color = currentMood ? moodColors[currentMood.name] : defaultColor
  return {
    '--toggle-active-color': color || defaultColor,
  }
})

const isPopupView = computed(() => route.name === 'chat-popup')

const isAuthView = computed(() => {
  const authPaths = ['/auth', '/profile', '/info', '/admin']
  return authPaths.some((basePath) => route.path.startsWith(basePath))
})

const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

const fxButtonText = computed(() => {
  return isMoodGlowEnabled.value ? 'FX ON' : 'FX OFF'
})

const showChatWidget = computed(() => {
  if (uiStore.isGlobalTransitionActive) {
    return false
  }
  if (!authStore.isAuthenticated) {
    return false
  }
  return isChatActivated.value || route.name === 'info'
})
const appContainerClass = computed(() => {
  const classes = []
  if (route.path.startsWith('/admin')) {
    classes.push('admin-background')
  } else {
    switch (route.name) {
      case 'home':
        classes.push('home-background')
        break
      case 'music-intro':
      case 'music':
      case 'my-music':
      case 'music-with-me':
        classes.push('music-background')
        break
      case 'auth':
      case 'profile':
        classes.push('login-background')
        break
      case 'info':
        classes.push('info-background')
        break
      case 'trabajos':
      case 'project-details':
        classes.push('works-background')
        break
      case 'social-feed':
        classes.push('feed-background')
        break
      case 'subscribe':
        classes.push('subscribe-background')
        break
    }
  }

  const isScrollable =
    route.meta.scrollable || (route.meta.scrollableOnMobile && isMobile.value)
  if (isScrollable) {
    classes.push('allow-scroll')
  }

  return classes.join(' ')
})

const isHomeRouteActive = computed(() => {
  return route.name === 'home' || route.name === 'social-feed'
})

const isMusicRouteActive = computed(() => {
  const musicRoutes = [
    'music-intro',
    'music',
    'my-music',
    'music-with-me',
    'subscribe',
  ]
  return musicRoutes.includes(route.name as string)
})

const isTrabajosRouteActive = computed(() => {
  const trabajosRoutes = ['trabajos', 'project-details']
  return trabajosRoutes.includes(route.name as string)
})

const dynamicNavStyle = computed(() => {
  const defaultColor = '#FFFFFF'
  if (!currentMoodId.value || availableMoods.value.length === 0) {
    return { '--active-nav-link-color': defaultColor }
  }

  const currentMood = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )
  const color = currentMood ? moodColors[currentMood.name] : defaultColor

  return {
    '--active-nav-link-color': color || defaultColor,
  }
})

watch(
  isMobile,
  (newValue) => {
    playerStore.setMobileStatus(newValue)
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  uiStore.ensureMoodsAvailable()
  authStore.checkUserSession()
  chatStore.checkChatActivationStatus()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
.mood-glow-toggle {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(31, 31, 31, 0.7);
  backdrop-filter: blur(8px);
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  --toggle-active-color: #3b82f6;
  transition: box-shadow 0.3s ease;
}
.mood-glow-toggle:has(.is-active) {
  box-shadow: 0 0 8px 0 var(--toggle-active-color);
  border-color: var(--toggle-active-color);
}

.toggle-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #a0a0a0;
  transition: color 0.3s ease;
}
.mood-glow-toggle:has(.is-active) .toggle-label {
  color: var(--toggle-active-color);
  text-shadow: 0 0 5px var(--toggle-active-color);
}
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #4b5563;
  border-radius: 12px;
  border: 1px solid #6b7280;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.toggle-switch.is-active {
  background-color: var(--toggle-active-color);
  border-color: var(--toggle-active-color);
}
.toggle-circle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.toggle-switch.is-active .toggle-circle {
  transform: translateX(20px);
}

.nav-fx-toggle {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  border: 1px solid;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  background-color: transparent;
  color: var(--toggle-active-color, #3b82f6);
  border-color: var(--toggle-active-color, #3b82f6);
  transition: all 0.3s ease;
}
/* --- FIN NUEVOS ETILOS --- */

@keyframes floatAnimation {
  0% {
    transform: translateY(-50%);
  }
  50% {
    transform: translateY(calc(-50% - 8px));
  }
  100% {
    transform: translateY(-50%);
  }
}
@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
.floating-nav-bar {
  position: fixed;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 140px;
  background-color: rgba(31, 31, 31, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 70px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
  padding: 2rem 0;
  z-index: 1001;
  animation: floatAnimation 6s ease-in-out infinite;
}
.fade-enter-active {
  transition: opacity 0.5s ease;
}
.fade-leave-active {
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}
nav a {
  font-weight: 500;
  font-size: 0.9rem;
  color: #a0a0a0;
  background: none;
  border: none;
  padding: 0.25rem 0;
  margin: 0;
  width: auto;
  transform: scale(1);
  transition:
    color 0.3s ease,
    transform 0.3s ease;
}
nav a:not(.router-link-exact-active):hover {
  transform: scale(1.1);
  color: #a0a0a0;
  background: none;
}
nav a.router-link-exact-active {
  color: var(--active-nav-link-color, #ffffff);
  font-weight: 700;
  font-size: 1rem;
  transform: scale(1.1);
  background: none;
  text-shadow: 0 0 8px var(--active-nav-link-color, #ffffff);
}
main {
  padding: 2rem;
  padding-bottom: 5rem;
  position: relative;
  z-index: 2;
}
.auth-widget {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1100;
}
footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}
#app-container {
  height: 100vh;
  position: relative;
  z-index: 1;
}
#app-container:not(.feed-background) {
  overflow: hidden;
}
#app-container.allow-scroll {
  overflow-y: auto;
}
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #111827;
  z-index: -1;
}
.background-layer::before,
.background-layer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center center;
  z-index: 1;
  opacity: 0;
  transition:
    opacity 1.5s ease-in-out,
    filter 1.5s ease-in-out;
}
.home-background .background-layer::before {
  background-image: url('/fondoHome.jpg');
  opacity: 1;
  filter: brightness(0.7);
}
.music-background .background-layer::before {
  background-image: url('/fondomusic1.jpg');
  opacity: 1;
  transition: none;
}
.music-background .background-layer::after {
  background-image: url('/fondomusic2.jpg');
  animation: fadeInOut 8s infinite ease-in-out;
}
.login-background .background-layer::before {
  background-image: url('/fondoLogin.jpg');
  opacity: 1;
}
.works-background .background-layer::before {
  background-image: url('/fondoTrabajos.jpg');
  opacity: 1;
  filter: brightness(0.6);
}
.info-background .background-layer::before {
  background-image: url('/fondoInfo.jpg');
  opacity: 1;
  filter: brightness(0.7);
}
.admin-background .background-layer::before {
  background-image: url('/adminFondo.jpg');
  opacity: 1;
  filter: brightness(0.2);
}
.feed-background .background-layer::before {
  background-image: url('/fondoFeed.jpg');
  opacity: 1;
  filter: brightness(0.2);
}
.subscribe-background .background-layer::before {
  background-image: url('/fondoSub.jpg');
  opacity: 1;
  filter: brightness(0.5);
}

@media (max-width: 768px) {
  .mood-glow-toggle {
    display: none;
  }

  body {
    padding-left: 0 !important;
  }

  .floating-nav-bar {
    width: 100%;
    top: 0;
    left: 0;
    transform: none;
    border-radius: 0;
    padding: 0.75rem 0rem;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    animation: none;
    background-color: rgba(17, 24, 39, 0.85);
    backdrop-filter: blur(12px);
  }

  nav {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  main {
    padding: 3rem 1rem;
  }

  .auth-widget {
    position: fixed;
    z-index: 1100;
    top: 9.2rem;
    right: 1.5rem;
  }
}
</style>
