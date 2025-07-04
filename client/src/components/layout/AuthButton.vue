<template>
  <div class="auth-container">

    <div v-if="isAuthenticated && user" class="user-menu">
      <button @click="toggleMenu" class="auth-button user-avatar">
        {{ user.first_name ? user.first_name.charAt(0) : user.email.charAt(0) }}
      </button>
      <transition name="fade-down">
        <ul v-if="isMenuOpen" class="dropdown-menu">
          <li @click="goToProfile">Perfil</li>
          <li @click="handleLogout">Cerrar Sesión</li>
        </ul>
      </transition>
    </div>

    <router-link v-else to="/auth">
      <button class="auth-button login">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </button>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const { isAuthenticated, user } = storeToRefs(authStore);
const router = useRouter();

const isMenuOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  isMenuOpen.value = false;
  router.push('/');
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const goToProfile = () => {
  router.push('/profile');
  isMenuOpen.value = false;
};
</script>

<style scoped>
.auth-container {
  position: relative;
}

.auth-button {

  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 0; 
  border: 2px solid #555;
  background-color: #2a2a2a;
  color: white;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
  
  transition: all 0.2s ease;
}

.auth-button:hover {
  background-color: #3a3a3a;
  border-color: #777;
  transform: scale(1.05);
}

.user-avatar {
  background-color: #3b82f6;
  font-size: 1.5rem;
  font-weight: bold;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background-color: rgba(30, 30, 30, 0.95);
  border: 1px solid #555;
  border-radius: 8px;
  list-style: none;
  padding: 8px;
  margin: 0;
  min-width: 150px;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.dropdown-menu li {
  padding: 8px 12px;
  color: #eee;
  cursor: pointer;
  border-radius: 6px;
}

.dropdown-menu li:hover {
  background-color: #3b82f6;
  color: white;
}

.fade-down-enter-active, .fade-down-leave-active {
  transition: all 0.2s ease;
}

.fade-down-enter-from, .fade-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
