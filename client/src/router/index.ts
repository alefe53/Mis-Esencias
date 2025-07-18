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

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { scrollable: true } 
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
  const isAdmin = authStore.user?.id === '132c560b-a6f7-46de-90fb-ccb90caad753'; 

  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'home' });
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'auth' });
  } else {
    next();
  }
});


export default router