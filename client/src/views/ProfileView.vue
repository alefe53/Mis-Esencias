<template>
  <div class="profile-page-container">
    <div class="profile-form-wrapper">
      <h2>Mi Perfil</h2>
      <p class="subtitle">Actualiza tu información personal y tu avatar.</p>

      <form v-if="user" @submit.prevent="handleSubmit">
        <div class="form-group avatar-section">
         <img :src="avatarPreview || ''" alt="Avatar del usuario" class="profile-avatar" @click="triggerFileInput" />
    
          <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;" />
          <button type="button" class="change-avatar-btn" @click="triggerFileInput">Cambiar foto</button>
        </div>

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
import { ref, reactive, onMounted, computed } from 'vue';
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

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);

const fullAvatarUrl = computed(() => {
    if (!user.value?.avatar_url) return ''; 
    if (user.value.avatar_url.startsWith('http')) {
        return user.value.avatar_url;
    }
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets-publicos/${user.value.avatar_url}`;
});


onMounted(() => {
  if (user.value) {
    form.firstName = user.value.first_name || '';
    form.lastName = user.value.last_name || '';
    if (user.value.birth_date) {
        form.birthDate = user.value.birth_date.split('T')[0];
    }
    avatarPreview.value = fullAvatarUrl.value;
  }
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (file.size > 5 * 1024 * 1024) { 
        errorMessage.value = "La imagen es demasiado grande. Máximo 5MB.";
        return;
    }
    selectedFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  if (!form.birthDate) {
    errorMessage.value = "Debes completar la fecha de nacimiento para actualizar tu perfil.";
    return;
  }

  if (form.firstName.length > 20) {
    errorMessage.value = "El nombre no puede tener más de 20 caracteres.";
    return;
  }

  const birthYear = new Date(form.birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  if (birthYear < currentYear - 110) {
    errorMessage.value = "El año de nacimiento no es válido.";
    return;
  }

  isLoading.value = true;

  try {
    if (selectedFile.value) {
      await authStore.updateUserAvatar(selectedFile.value);
      successMessage.value = '¡Avatar actualizado! ';
      selectedFile.value = null; 
    }

    await authStore.updateUserProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate
    });

    successMessage.value += '¡Perfil actualizado exitosamente!';

  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'No se pudo actualizar el perfil.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
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
.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
}
.profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #444;
    cursor: pointer;
    transition: filter 0.2s;
}
.profile-avatar:hover {
    filter: brightness(0.8);
}
.change-avatar-btn {
    margin-top: 1rem;
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 0.9rem;
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