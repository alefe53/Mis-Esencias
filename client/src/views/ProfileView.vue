// src/views/ProfileView.vue
<template>
  <div class="profile-page-container">
    <div class="profile-form-wrapper">
      <h2>Mi Perfil</h2>
      <p class="subtitle">Actualiza tu información personal.</p>

      <form v-if="user" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" :value="user.email" disabled />
          <small>El email no se puede cambiar.</small>
        </div>

        <div class="form-group">
          <label for="firstName">Nombre</label>
          <input type="text" id="firstName" v-model="form.firstName" required />
        </div>

        <div class="form-group">
          <label for="lastName">Apellido</label>
          <input type="text" id="lastName" v-model="form.lastName" required />
        </div>
        
        <div class="form-group">
          <label for="birthDate">Fecha de Nacimiento</label>
          <input type="date" id="birthDate" v-model="form.birthDate" />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  birthDate: '',
});

// Cuando el componente se monta, llenamos el formulario con los datos del usuario.
onMounted(() => {
  if (user.value) {
    form.firstName = user.value.first_name || '';
    form.lastName = user.value.last_name || '';
    // El formato de fecha para el input type="date" debe ser YYYY-MM-DD
    if (user.value.birth_date) {
        form.birthDate = user.value.birth_date.split('T')[0];
    }
  }
});

const handleSubmit = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await authStore.updateUserProfile(form);
    successMessage.value = '¡Perfil actualizado exitosamente!';
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'No se pudo actualizar el perfil.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Reutilizamos y adaptamos los estilos de AuthView para consistencia */
.profile-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
  color: white;
}
.profile-form-wrapper {
  width: 100%;
  max-width: 500px;
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
.form-group input:disabled {
  background-color: #2a2a2a;
  cursor: not-allowed;
  opacity: 0.7;
}
.form-group small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #888;
}
.submit-button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  background-color: #22c55e; 
  color: white;
  margin-top: 1rem;
  transition: background-color 0.2s;
}
.submit-button:hover:not(:disabled) {
  background-color: #16a34a;
}
.submit-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
.error-message, .success-message {
  font-size: 0.9rem;
  text-align: center;
  margin-top: 1rem;
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