<template>
  <div id="app-container">
    <MoodGlowEffect />

    <header class="floating-nav-bar">
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="#">Música</router-link>
        <router-link to="#">Trabajos</router-link>
        <router-link to="#">Info</router-link>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
    
    <div class="auth-widget">
      <AuthButton />
    </div>

    <footer>
      <AudioPlayer />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import AudioPlayer from './components/player/AudioPlayer.vue';
import AuthButton from './components/layout/AuthButton.vue';
import MoodGlowEffect from './components/effects/MoodGlowEffect.vue';
import { usePlayerStore } from './stores/playerStore';
import { useAuthStore } from './stores/authStore'; 

const playerStore = usePlayerStore(); 
const authStore = useAuthStore();

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

#app-container {
  min-height: 100vh;
  position: relative; 
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
</style>
