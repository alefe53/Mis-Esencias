<template>
  <div class="create-post-container">
    <h2>Crear Nueva Publicación</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="postType">Tipo de Publicación</label>
        <select id="postType" v-model="post.postType">
          <option value="text">Texto</option>
          <option value="poll">Encuesta</option>
        </select>
      </div>

      <div class="form-group">
        <label for="title">Título</label>
        <input
          type="text"
          id="title"
          v-model="post.title"
          placeholder="El título de tu post..."
        />
      </div>

      <div class="form-group">
        <label for="content">Contenido</label>
        <textarea
          id="content"
          v-model="post.content"
          rows="6"
          placeholder="Escribe algo..."
        ></textarea>
      </div>

      <div class="form-group">
        <label for="imageUrl">URL de la Imagen (Opcional)</label>
        <input
          type="text"
          id="imageUrl"
          v-model="post.imageUrl"
          placeholder="ej: posts/imagenes/mi-foto.jpg"
        />
        <small
          >Sube la imagen a Supabase Storage primero y pega la ruta aquí.</small
        >
      </div>

      <div v-if="post.postType === 'poll'" class="poll-section">
        <h3>Opciones de la Encuesta</h3>
        <div
          v-for="(_option, index) in post.pollOptions"
          :key="index"
          class="poll-option"
        >
          <input type="text" v-model="post.pollOptions[index]" />
          <button type="button" @click="removeOption(index)" class="remove-btn">
            Quitar
          </button>
        </div>
        <button type="button" @click="addOption" class="add-btn">
          Añadir Opción
        </button>
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Publicando...' : 'Publicar' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore'
import * as adminService from '../services/adminService'

const router = useRouter()
const uiStore = useUiStore()
const isLoading = ref(false)

const post = ref({
  title: '',
  content: '',
  imageUrl: '',
  postType: 'text',
  pollOptions: [''], 
})

const addOption = () => {
  post.value.pollOptions.push('')
}

const removeOption = (index: number) => {
  post.value.pollOptions.splice(index, 1)
}

const handleSubmit = async () => {
  isLoading.value = true
  try {
    const payload = {
      ...post.value,
      pollOptions:
        post.value.postType === 'poll'
          ? post.value.pollOptions.filter((opt) => opt.trim() !== '')
          : null,
    }

    await adminService.createPost(payload)

    uiStore.showToast({
      message: 'Publicación creada exitosamente',
      color: '#10B981',
    })
    router.push({ name: 'social-feed' }) 
  } catch (error) {
    console.error('Error al crear la publicación:', error)
    uiStore.showToast({
      message: 'No se pudo crear la publicación.',
      color: '#EF4444',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.create-post-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #262c35;
  border-radius: 12px;
}
.form-group {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
input,
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  background-color: #3a414b;
  border: 1px solid #555;
  border-radius: 8px;
  color: white;
}
.poll-section {
  margin-top: 1.5rem;
  border-top: 1px solid #39424e;
  padding-top: 1.5rem;
}
.poll-option {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.remove-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 5px;
}
.add-btn {
  background-color: #3b82f6;
}
button[type='submit'] {
  width: 100%;
  padding: 1rem;
  background-color: #10b981;
  font-size: 1.2rem;
}
@media (max-width: 768px) {
  .create-post-container {
    margin: 1rem;
    padding: 1.25rem;
    border-radius: 0;
  }
}
</style>
