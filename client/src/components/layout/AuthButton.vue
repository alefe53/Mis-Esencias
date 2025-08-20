<template>
  <div class="auth-container" ref="containerRef">
    <transition name="bubble-fade">
      <GreetingWidget
        v-if="isAuthenticated && user?.first_name"
        :name="user.first_name"
      />
    </transition>

    <transition name="toast-fade">
      <div
        v-if="
          !isAuthenticated &&
          !uiStore.loginToastDismissed &&
          route.name === 'home'
        "
        class="login-toast"
      >
        ¡Entrá para más!
      </div>
    </transition>

    <div
      class="spinning-arrows"
      :class="{ 'hide-animation': shouldHideAnimation }"
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path
            id="arrow-path"
            d="M 50,5 A 45,45 0 1 1 25,12"
            fill="none"
            stroke="white"
            stroke-width="4"
            stroke-linecap="round"
          />
          <polygon id="arrow-head" points="25,5 25,19 33,12" fill="white" />
        </defs>
        <use href="#arrow-path" />
        <use href="#arrow-head" />
        <use href="#arrow-path" transform="rotate(120, 50, 50)" />
        <use href="#arrow-head" transform="rotate(120, 50, 50)" />
        <use href="#arrow-path" transform="rotate(240, 50, 50)" />
        <use href="#arrow-head" transform="rotate(240, 50, 50)" />
      </svg>
    </div>

    <button
      class="auth-button"
      :class="{ 'user-avatar': isAuthenticated }"
      @click="handleAuthButtonClick"
    >
      <template v-if="isAuthenticated && user">
        <img
          v-if="user.avatar_url"
          :src="fullAvatarUrl"
          alt="Avatar"
          class="avatar-image"
        />
        <span v-else class="user-initial">
          {{
            user.first_name ? user.first_name.charAt(0) : user.email.charAt(0)
          }}
        </span>
      </template>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </button>

    <transition name="fade-down">
      <ul v-if="isMenuOpen" class="dropdown-menu">
        <li @click="goToProfile">Perfil</li>
        <li v-if="isAdmin" @click="goToAdminDashboard" class="admin-link">
          Panel de Admin
        </li>
        <li @click="handleLogout">Cerrar Sesión</li>
      </ul>
    </transition>
  </div>
</template>

<script setup lang="ts">
import GreetingWidget from './GreetingWidget.vue'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { useRouter, useRoute } from 'vue-router'
import { useClickOutside } from '../../composables/useClickOutside'

const authStore = useAuthStore()
const uiStore = useUiStore()
const { isAuthenticated, user, isAdmin } = storeToRefs(authStore)
const router = useRouter()
const route = useRoute()

const isMenuOpen = ref(false)
const containerRef = ref<HTMLElement>()

useClickOutside(containerRef, () => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false
  }
})

const shouldHideAnimation = computed(() => {
  return isAuthenticated.value || route.name === 'auth'
})

const fullAvatarUrl = computed(() => {
  const avatar = user.value?.avatar_url
  if (!avatar) return ''

  if (avatar.startsWith('http')) {
    return avatar
  }

  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets-publicos/${avatar}`
})

const handleAuthButtonClick = () => {
  if (isAuthenticated.value) {
    isMenuOpen.value = !isMenuOpen.value
  } else {
    uiStore.dismissLoginToast()
    router.push('/auth')
  }
}

const handleLogout = () => {
  authStore.logout()
  isMenuOpen.value = false
  router.push('/')
}

const goToProfile = () => {
  router.push('/profile')
  isMenuOpen.value = false
}

const goToAdminDashboard = () => {
  router.push('/admin')
  isMenuOpen.value = false
}
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.auth-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
}

.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.login-toast {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(calc(-50% - 0px));
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  background-color: #bee3f8;
  color: #2a4365;
  z-index: 10;
  pointer-events: none;
}

.login-toast::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent #bee3f8 transparent;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.spinning-arrows {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  animation: spin 4s linear infinite;
  transition: opacity 0.4s ease;
}

.spinning-arrows svg {
  opacity: 0.8;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7));
}

.spinning-arrows.hide-animation {
  animation: none;
  opacity: 0;
}

.auth-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 0;
  border: 2px solid #555;
  background-color: #2a2a2a;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.auth-button:hover {
  background-color: #3a3a3a;
  border-color: #777;
  transform: scale(1.05);
}

.auth-button.user-avatar {
  background-color: #333;
  border-color: #3b82f6;
}

.auth-button.user-avatar:hover {
  border-color: #60a5fa;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-initial {
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% - 10px);
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
  border-radius: 6px;
  transition: all 0.2s;
}

.dropdown-menu li:hover {
  background-color: #3b82f6;
  color: white;
}

.dropdown-menu li.admin-link {
  color: #60a5fa;
}

.dropdown-menu li.admin-link:hover {
  color: white;
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: all 0.2s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .auth-container {
    width: 60px;
    height: 60px;
    margin-top: 2rem;
  }

  .auth-button {
    width: 46px;
    height: 46px;
    border-width: 1.5px;
  }

  .user-initial {
    font-size: 1.2rem;
  }

  .dropdown-menu {
    top: calc(100% - 12px);
    min-width: 140px;
  }

  .login-toast {
    font-size: 0.6rem;
    padding: 5px 12px;
  }
}
</style>
