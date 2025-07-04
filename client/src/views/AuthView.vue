<template>
  <div class="auth-page-container">
    <div class="auth-form-wrapper">
      <h2>{{ isRegistering ? 'Crear una Cuenta' : 'Iniciar Sesión' }}</h2>
      <p class="subtitle">
        {{ isRegistering ? 'Ingresa tus datos para comenzar.' : 'Bienvenido de vuelta.' }}
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
          <input type="email" id="email" v-model="form.email" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="form.password" required autocomplete="current-password" />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ buttonText }}
        </button>
      </form>

      <div class="divider"></div>

      <!-- <button class="google-button" @click="handleGoogleLogin">
        Continuar con Google
      </button> -->

      <p class="toggle-form">
        {{ isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?' }}
        <a @click="toggleForm">{{ isRegistering ? 'Inicia sesión' : 'Regístrate' }}</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useAuthStore } from '../stores/authStore.ts';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const isRegistering = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
});

const buttonText = computed(() => {
  if (isLoading.value) return 'Cargando...';
  return isRegistering.value ? 'Registrarse' : 'Entrar';
});

const toggleForm = () => {
  isRegistering.value = !isRegistering.value;
  errorMessage.value = '';
  successMessage.value = '';
};

const handleSubmit = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    if (isRegistering.value) {
      await authStore.register(form);
      successMessage.value = '¡Registro exitoso! Ahora puedes iniciar sesión.';
      isRegistering.value = false; 
    } else {
      await authStore.login(form.email, form.password);
      router.push('/'); 
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Ocurrió un error. Inténtalo de nuevo.';
  } finally {
    isLoading.value = false;
  }
};
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
.submit-button, .google-button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.submit-button {
  background-color: #3b82f6;
  color: white;
  margin-top: 1rem;
}
.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}
.submit-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
.divider {
  height: 1px;
  background-color: #444;
  margin: 1.5rem 0;
}
.google-button {
  background-color: #fff;
  color: #333;
  border: 1px solid #ccc;
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
  cursor: pointer;
}
.error-message, .success-message {
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
</style>
