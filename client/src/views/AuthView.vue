<template>
  <div class="auth-page-container">
    <div class="auth-form-wrapper">
      <h2>{{ isRegistering ? 'Crear una Cuenta' : 'Iniciar Sesión' }}</h2>
      <p class="subtitle">
        {{
          isRegistering
            ? 'Ingresa tus datos para comenzar.'
            : 'Entrá si te da, sino anda payá.'
        }}
      </p>

      <form @submit.prevent="handleSubmit">
        <div v-if="isRegistering" class="form-group">
          <label for="firstName">Nombre</label>
          <input type="text" id="firstName" v-model="form.firstName" required />
        </div>
        <div v-if="isRegistering" class="form-group">
          <label for="lastName">Apellido</label>
          <input type="text" id="lastName" v-model="form.lastName" required />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            autocomplete="current-password"
          />
          <p v-if="isRegistering" class="password-hint">
            No pierdas la contraseña, se guarda encriptada en la base de datos.
            Solo vos sabés cual es.
          </p>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">
          {{ successMessage }}
        </p>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ buttonText }}
        </button>
      </form>

      <div class="divider"></div>

      <button
        class="google-button"
        @click="handleGoogleLogin"
        :disabled="isLoading"
      >
        <svg
          version="1.1"
          xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
          width="18px"
          height="18px"
          viewBox="0 0 48 48"
        >
          <g>
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </g>
        </svg>
        <span>Continuar con Google</span>
      </button>

      <p class="toggle-form">
        {{
          isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'
        }}
        <a @click="toggleForm">{{
          isRegistering ? 'Inicia sesión' : 'Regístrate gratis'
        }}</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'

const authStore = useAuthStore()
const router = useRouter()

const isRegistering = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
})

const buttonText = computed(() => {
  if (isLoading.value) return 'Cargando...'
  return isRegistering.value ? 'Registrarse' : 'Entrar'
})

const toggleForm = () => {
  isRegistering.value = !isRegistering.value
  errorMessage.value = ''
  successMessage.value = ''
}

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isRegistering.value) {
      await authStore.register(form)
      successMessage.value = '¡Registro exitoso! Ahora puedes iniciar sesión.'
      isRegistering.value = false
    } else {
      await authStore.login(form.email, form.password)
      router.push('/')
    }
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.message || 'Ocurrió un error. Inténtalo de nuevo.'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth',
      queryParams: {
        prompt: 'select_account',
      },
    },
  })
  if (error) {
    errorMessage.value = 'No se pudo iniciar el proceso con Google.'
    isLoading.value = false
  }
}

onMounted(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        authListener?.subscription.unsubscribe()
        isLoading.value = true
        try {
          await authStore.loginWithGoogle(session.access_token)
        } catch (error: any) {
          errorMessage.value =
            error.message || 'Error al procesar el login de Google.'
        } finally {
          isLoading.value = false
        }
      }
    },
  )
})
</script>

<style scoped>
.auth-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
  color: white;
}
.auth-form-wrapper {
  width: 100%;
  max-width: 450px;
  background-color: #1f1f1f;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #333;
}
h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 0.5rem;
}
.subtitle {
  text-align: center;
  color: #aaa;
  margin-top: 0;
  margin-bottom: 2rem;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #ccc;
}
.form-group input {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid #555;
  background-color: #333;
  color: white;
  font-size: 1rem;
}
.submit-button,
.google-button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  margin-top: 1rem;
  font-weight: bold;
}
.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}
.submit-button:disabled,
.google-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
}
.divider {
  height: 1px;
  background-color: #444;
  margin: 1.5rem 0;
}

.google-button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  color: #444;
  border: 1px solid #ccc;
  font-weight: 500;
}
.google-button:hover:not(:disabled) {
  background-color: #f7f7f7;
}
.google-button > span {
  line-height: 1;
}

.toggle-form {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: #aaa;
}
.toggle-form a {
  color: #3b82f6;
  font-weight: bold;
}
.error-message,
.success-message {
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
}
.error-message {
  color: #f87171;
  background-color: rgba(239, 68, 68, 0.1);
}
.success-message {
  color: #4ade80;
  background-color: rgba(34, 197, 94, 0.1);
}
.password-hint {
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 0.5rem;
  margin-bottom: 0;
}
</style>
