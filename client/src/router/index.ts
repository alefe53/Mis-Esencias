//src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import ProfileView from '../views/ProfileView.vue'
import TransitionView from '../views/TransitionView.vue' 
import MusicView from '../views/MusicView.vue' 
import TrabajosView from '../views/TrabajosView.vue'
import InfoView from '../views/InfoView.vue'
import AdminMenuView from '../views/AdminMenuView.vue'
import AdminChatDashboard from '../views/AdminDashboardView.vue'
import AdminUserListView from '../views/AdminUserListView.vue'
import SocialFeedView from '../views/SocialFeedView.vue' 

const routes = [
  {
    path: '/',
    name: 'home', 
    component: HomeView,
    meta: { scrollable: true } 
  },
  {
    path: '/feed', 
    name: 'social-feed',
    component: SocialFeedView, 
    meta: { requiresAuth: true, scrollable: true }
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
    meta: { scrollable: true } 
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true, scrollable: true }
    
  },
  {
    path: '/music-intro',
    name: 'music-intro',
    component: TransitionView,
    meta: { scrollable: false } 
  },
  {
    path: '/music',
    name: 'music',
    component: MusicView,
    meta: { scrollable: false } 
  },
  {
    path: '/musica-propia', 
    name: 'my-music',
    component: () => import('../views/MyMusicView.vue'),
    meta: { scrollable: false }  
  },
  { 
    path: '/musica-con-ale', 
    name: 'music-with-me',
    component: () => import('../views/MusicWithMeView.vue') ,
    meta: { scrollable: false } 
  },
  {
    path: '/trabajos',
    name: 'trabajos',
    component: TrabajosView,
    meta: { scrollable: true } 
  },
  {
    path: '/trabajos/:id',
    name: 'project-details',
    component: () => import('../views/ProjectDetailView.vue'),
    meta: { scrollable: true } 
  },
  {
    path: '/info',
    name: 'info',
    component: InfoView,
    meta: { scrollable: true } 
  },
  {
    path: '/admin',
    component: AdminMenuView, 
    meta: { requiresAuth: true, requiresAdmin: true, scrollable: true },
    children: [
      {
        path: '', 
        redirect: '/admin/chats'
      },
      {
        path: 'chats',
        name: 'admin-chats',
        component: AdminChatDashboard
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUserListView
      },
      {
        path: 'crear-publicacion', 
        name: 'admin-create-post',
        component: () => import('../views/AdminCreatePostView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // Lógica de redirección del Home
  if (to.name === 'home' && isAuthenticated) {
    return next({ name: 'social-feed' });
  } 
  if (to.name === 'social-feed' && !isAuthenticated) {
    return next({ name: 'home' });
  }

  // Lógica de seguridad para rutas protegidas
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'home' });
  }
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'auth' });
  }

  return next();
});


export default router