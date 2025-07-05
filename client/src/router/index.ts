//src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import ProfileView from '../views/ProfileView.vue'
import TransitionView from '../views/TransitionView.vue' 
import MusicView from '../views/MusicView.vue' 

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/music-intro',
    name: 'music-intro',
    component: TransitionView
  },
  {
    path: '/music',
    name: 'music',
    component: MusicView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.user) {
      authStore.checkUserSession();
  }

  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'auth' });
  } else {
    next();
  }
});


export default router