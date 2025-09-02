// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// Crear la instancia de Pinia
const pinia = createPinia()
const app = createApp(App)

// Usar los plugins
app.use(pinia)
app.use(router)

app.mount('#app')
