<template>
  <div id="app-container" :class="backgroundClass">
    
    <div class="background-layer"></div>

    <MoodGlowEffect />

    <transition name="fade">
      <header class="floating-nav-bar" v-if="!uiStore.isGlobalTransitionActive">
        <nav>
          <router-link to="/">Home</router-link>
          <router-link to="/music-intro">Música</router-link> 
          <router-link to="#">Trabajos</router-link>
          <router-link to="#">Info</router-link>
        </nav>
      </header>
    </transition>

    <main>
      <router-view />
    </main>
    
    <transition name="fade">
      <div class="auth-widget" v-if="!uiStore.isGlobalTransitionActive">
        <AuthButton />
      </div>
    </transition>

    <transition name="fade">
      <footer v-show="!uiStore.isGlobalTransitionActive">
        <AudioPlayer />
      </footer>
    </transition>
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';
import AudioPlayer from './components/player/AudioPlayer.vue';
import AuthButton from './components/layout/AuthButton.vue';
import MoodGlowEffect from './components/effects/MoodGlowEffect.vue';
import { usePlayerStore } from './stores/playerStore';
import { useAuthStore } from './stores/authStore'; 
import { useUiStore } from './stores/uiStore';

const route = useRoute();
const uiStore = useUiStore();
const playerStore = usePlayerStore(); 
const authStore = useAuthStore();

const backgroundClass = computed(() => {
  switch (route.name) {
    case 'home':
      return 'home-background';
    case 'music':
      return 'music-background';
    default:
      return ''; 
  }
});

onMounted(() => {
  playerStore.ensureMoodsAvailable(); 
  authStore.checkUserSession(); 
});
</script>

<style>

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
  0%, 100% { opacity: 0; } 
  50% { opacity: 1; }      
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem; 
}

nav a {
  font-weight: 500;
  font-size: 1rem;
  color: #a0a0a0;
  background: none;
  border: none;
  padding: 0.25rem 0;
  margin: 0;
  width: auto;
  transition: color 0.2s ease;
}

nav a:hover {
  color: #ffffff;
  background: none;
}

nav a.router-link-exact-active {
  color: #ffffff;
  font-weight: 700;
  background: none; 
}

main {
  padding: 2rem;
  padding-bottom: 200px;
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
  min-height: 100vh;
  position: relative; 
  z-index: 1;
}

.background-layer {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: #111827;
  z-index: -1;
}

.background-layer::before,
.background-layer::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-size: cover;
  background-position: center center;
  z-index: 1;
  opacity: 0; 
  transition: opacity 1.5s ease-in-out, filter 1.5s ease-in-out; 
}
.home-background .background-layer::before {
  background-image: url('/fondoHome.jpg');
  opacity: 1;
  filter:brightness(0.7);
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
</style>