<template>
  <div class="create-release-container">
    <div class="header-section">
      <h1>Cargar Nuevo Lanzamiento</h1>
      <p class="subtitle">Administrador de Catálogo Musical</p>
    </div>

    <div v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="release-form">
      
      <section class="form-section">
        <h3>💿 Información Principal</h3>
        
        <div class="row">
          <div class="form-group half">
            <label>Tipo de Lanzamiento</label>
            <select v-model="form.type" required class="form-input">
              <option value="solo">Solista (Solo)</option>
              <option value="band">Banda (Band)</option>
              <option value="work">Trabajo Ingeniería (Work)</option>
            </select>
          </div>

          <div class="form-group half">
             <label>Año</label>
             <input type="number" v-model="form.release_year" required placeholder="2025" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label>Título del Álbum / Single</label>
          <input type="text" v-model="form.release_title" required placeholder="Ej: Dark Side of the Moon" class="form-input" />
        </div>

        <div class="form-group">
          <label>Descripción General</label>
          <textarea v-model="form.release_description" rows="3" class="form-input"></textarea>
        </div>

        <div class="row">
            <div class="form-group half">
                <label>URL Carátula (Cover Art)</label>
                <input type="text" v-model="form.cover_art_url" placeholder="assets-publicos/covers/..." class="form-input" />
                <small class="hint">Ruta relativa en Supabase Storage</small>
            </div>
            <div class="form-group half">
                <label>Video Destacado (YouTube URL)</label>
                <input type="text" v-model="form.featured_video_url" placeholder="ID o URL" class="form-input" />
            </div>
        </div>
      </section>

      <section class="form-section highlight-section">
        <h3 v-if="form.type === 'solo'">👤 Datos del Artista</h3>
        <h3 v-else-if="form.type === 'band'">🎸 Datos de la Banda</h3>
        <h3 v-else>🎛️ Datos del Cliente</h3>

        <div v-if="form.type === 'solo'">
            <div class="form-group">
                <label>Nombre del Artista</label>
                <input type="text" v-model="form.artist_name" class="form-input" />
            </div>
             <div class="form-group">
                <label>Tags del Artista (Separados por coma)</label>
                <input type="text" v-model="rawSoloTags" placeholder="rock, indie, argentina" class="form-input" />
            </div>
        </div>

        <div v-if="form.type === 'band'">
            <div class="band-mode-switch">
                <label class="switch-label">
                    <input type="radio" :value="true" v-model="isExistingBand">
                    <span>Seleccionar Banda Existente</span>
                </label>
                <label class="switch-label">
                    <input type="radio" :value="false" v-model="isExistingBand">
                    <span>Crear Nueva Banda</span>
                </label>
            </div>

            <div v-if="isExistingBand" class="form-group">
                <label>Seleccionar Banda</label>
                <select v-model="selectedBandId" class="form-input" @change="handleBandSelection">
                    <option :value="null" disabled>-- Elige una banda --</option>
                    <option v-for="band in bandsList" :key="band.id" :value="band.id">
                        {{ band.name }}
                    </option>
                </select>
                <p class="info-text" v-if="form.band_name">
                    Banda seleccionada para asociar: <strong>{{ form.band_name }}</strong>
                </p>
            </div>

            <div v-if="!isExistingBand">
                 <div class="form-group">
                    <label>Nombre de la Banda (Nuevo)</label>
                    <input type="text" v-model="form.band_name" class="form-input" />
                </div>
                 <div class="form-group">
                    <label>Descripción de la Banda</label>
                    <input type="text" v-model="form.band_description" class="form-input" />
                </div>
                 <div class="form-group">
                    <label>Imagen Banda URL</label>
                    <input type="text" v-model="form.band_image_url" class="form-input" placeholder="bandas-con-ale/..." />
                </div>
            </div>
        </div>

        <div v-if="form.type === 'work'">
             <div class="form-group">
                <label>Nombre Cliente / Banda</label>
                <input type="text" v-model="form.client_name" class="form-input" />
            </div>
             <div class="form-group">
                <label>Descripción del Proyecto</label>
                <input type="text" v-model="form.project_description" class="form-input" />
            </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-header-row">
            <h3>🎵 Lista de Canciones</h3>
            <button type="button" @click="addTrack" class="btn-add small">+ Agregar Track</button>
        </div>

        <div v-if="form.tracks.length === 0" class="empty-state">
            No hay canciones agregadas aún.
        </div>

        <div v-for="(track, index) in form.tracks" :key="index" class="track-card">
            <div class="track-header">
                <h4>Track #{{ index + 1 }}</h4>
                <button type="button" @click="removeTrack(index)" class="btn-remove-icon" title="Quitar Track">✕</button>
            </div>

            <div class="row">
                <div class="form-group grow">
                    <label>Título</label>
                    <input type="text" v-model="track.title" required class="form-input" />
                </div>
                <div class="form-group shrink">
                    <label>Duración (seg)</label>
                    <input type="number" v-model="track.duration_seconds" style="width: 80px" class="form-input" />
                </div>
                <div class="form-group shrink">
                    <label>Tier (1=Free)</label>
                    <input type="number" v-model="track.tier_id" style="width: 80px" class="form-input" />
                </div>
            </div>

            <div class="form-group">
                <label>Moods / Estados de Ánimo</label>
                <div class="mood-selector">
                    <button 
                        v-for="mood in filteredMoods" 
                        :key="mood.id"
                        type="button"
                        class="mood-chip"
                        :class="{ active: track.mood_ids.includes(mood.id) }"
                        @click="toggleMood(index, mood.id)"
                        :title="mood.description || ''"
                    >
                        {{ mood.name }}
                    </button>
                </div>
            </div>

            <div class="nested-row">
                <div class="half-col">
                    <div class="sub-header">
                        <label>Créditos</label>
                        <button type="button" @click="addContributor(index)" class="btn-text-blue">+ Agregar</button>
                    </div>
                    <div v-for="(contrib, cIndex) in track.contributors" :key="cIndex" class="mini-row">
                        <input type="text" v-model="contrib.name" placeholder="Nombre" class="form-input small" />
                        <input type="text" v-model="contrib.role" placeholder="Rol" class="form-input small" />
                        <button type="button" @click="removeContributor(index, cIndex)" class="btn-text-red">x</button>
                    </div>
                </div>

                <div class="half-col">
                    <div class="sub-header">
                        <label>Links</label>
                        <button type="button" @click="addLink(index)" class="btn-text-blue">+ Agregar</button>
                    </div>
                    <div v-for="(link, lIndex) in track.links" :key="lIndex" class="mini-row">
                        <select v-model="link.platform" class="form-input small">
                            <option value="spotify">Spotify</option>
                            <option value="youtube">YouTube</option>
                            <option value="apple">Apple</option>
                        </select>
                        <input type="text" v-model="link.url" placeholder="URL" class="form-input small grow" />
                        <button type="button" @click="removeLink(index, lIndex)" class="btn-text-red">x</button>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-header-row">
            <h3>🖼️ Galería de Imágenes</h3>
            <button type="button" @click="addGalleryImage" class="btn-add small">+ Imagen</button>
        </div>
        <div v-for="(img, gIndex) in form.gallery_images" :key="gIndex" class="gallery-row">
            <input type="text" v-model="img.url" placeholder="Ruta (ej: assets-publicos/img1.jpg)" class="form-input grow" />
            <input type="text" v-model="img.description" placeholder="Descripción" class="form-input grow" />
            <button type="button" @click="removeGalleryImage(gIndex)" class="btn-remove-icon">✕</button>
        </div>
      </section>

      <div class="actions">
        <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="isLoading" class="loader-spinner"></span>
            {{ isLoading ? 'Subiendo...' : '🚀 PUBLICAR LANZAMIENTO' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import axios from 'axios'

interface Contributor {
    name: string;
    role: string;
    tags: string[];
}
interface TrackLink {
    platform: string;
    url: string;
}
interface TrackForm {
    title: string;
    description: string;
    track_number: number;
    duration_seconds: number;
    tier_id: number;
    mood_ids: number[];
    contributors: Contributor[];
    links: TrackLink[];
}
interface GalleryImg {
    url: string;
    description: string;
    alt_text: string;
}

const uiStore = useUiStore()
const authStore = useAuthStore()
const router = useRouter()

const isLoading = ref(false)
const errorMessage = ref('')

const moodsList = ref<any[]>([])
const bandsList = ref<any[]>([])

const isExistingBand = ref(true)
const selectedBandId = ref<number | null>(null)

const filteredMoods = computed(() => {
    return moodsList.value.filter(m => m.id !== 5)
})

const form = ref({
    type: 'solo',
    release_title: '',
    release_description: '',
    cover_art_url: '',
    release_year: new Date().getFullYear(),
    featured_video_url: '',
    
    artist_name: '', 
    artist_tags: [] as string[],
    
    band_name: '',
    band_description: '',
    band_image_url: '',
    
    client_name: '',
    project_description: '',
    project_cover_url: '',

    members: [],
    
    tracks: [] as TrackForm[],
    gallery_images: [] as GalleryImg[]
})

const rawSoloTags = computed({
    get: () => form.value.artist_tags.join(', '),
    set: (val) => { 
        form.value.artist_tags = val.split(',').map(t => t.trim()).filter(t => t !== '') 
    }
})

const handleBandSelection = () => {
    const band = bandsList.value.find(b => b.id === selectedBandId.value)
    if (band) {
        form.value.band_name = band.name
    }
}

watch(isExistingBand, (val) => {
    if (!val) {
        selectedBandId.value = null
        form.value.band_name = ''
        form.value.band_description = ''
        form.value.band_image_url = ''
    }
})

const addTrack = () => {
    form.value.tracks.push({
        title: '',
        description: '',
        track_number: form.value.tracks.length + 1,
        duration_seconds: 180,
        tier_id: 1,
        mood_ids: [],
        contributors: [],
        links: []
    })
}

const removeTrack = (index: number) => {
    form.value.tracks.splice(index, 1)
}

const toggleMood = (trackIndex: number, moodId: number) => {
    const track = form.value.tracks[trackIndex]
    const idx = track.mood_ids.indexOf(moodId)
    if (idx > -1) {
        track.mood_ids.splice(idx, 1)
    } else {
        track.mood_ids.push(moodId)
    }
}

const addContributor = (trackIndex: number) => {
    form.value.tracks[trackIndex].contributors.push({ name: '', role: '', tags: [] })
}

const removeContributor = (tIndex: number, cIndex: number) => {
    form.value.tracks[tIndex].contributors.splice(cIndex, 1)
}

const addLink = (trackIndex: number) => {
    form.value.tracks[trackIndex].links.push({ platform: 'spotify', url: '' })
}

const removeLink = (tIndex: number, lIndex: number) => {
    form.value.tracks[tIndex].links.splice(lIndex, 1)
}

const addGalleryImage = () => {
    form.value.gallery_images.push({ url: '', description: '', alt_text: 'Gallery image' })
}

const removeGalleryImage = (index: number) => {
    form.value.gallery_images.splice(index, 1)
}

const fetchData = async () => {
    try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://mis-esencias-backend.onrender.com/api'
        
        const [moodsRes, bandsRes] = await Promise.all([
            axios.get(`${API_BASE}/moods`),
            axios.get(`${API_BASE}/bands`)
        ])

        if(moodsRes.data.success) moodsList.value = moodsRes.data.data
        if(bandsRes.data.success) bandsList.value = bandsRes.data.data

    } catch (error) {
        console.error("Error fetching data:", error)
        uiStore.showToast({ message: 'Error cargando listas', color: '#EF4444' })
    }
}

const handleSubmit = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
        const token = authStore.token || localStorage.getItem('token')
        if (!token) throw new Error("No autenticado")

        const API_BASE = import.meta.env.VITE_API_URL || 'https://mis-esencias-backend.onrender.com/api'
        
        await axios.post(`${API_BASE}/releases`, form.value, {
            headers: { Authorization: `Bearer ${token}` }
        })

        uiStore.showToast({ message: '✨ Lanzamiento creado exitosamente!', color: '#10B981' })
        router.push('/musica-propia') 

    } catch (error: any) {
        console.error(error)
        errorMessage.value = error.response?.data?.message || error.message
        uiStore.showToast({ message: 'Error al crear release', color: '#EF4444' })
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchData()
    if(form.value.tracks.length === 0) addTrack()
})
</script>

<style scoped>
.create-release-container {
    max-width: 900px; margin: 2rem auto; padding: 2rem;
    background-color: #1f2937; border-radius: 12px; color: #f3f4f6;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
.header-section { text-align: center; margin-bottom: 2rem; border-bottom: 1px solid #374151; padding-bottom: 1rem; }
.header-section h1 { margin: 0; color: #60a5fa; }
.subtitle { color: #9ca3af; margin-top: 0.5rem; }
.form-section { background-color: #262c35; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #374151; }
.highlight-section { border-left: 4px solid #8b5cf6; background-color: #2e3540; }
.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #4b5563; padding-bottom: 0.5rem; }
h3 { margin: 0; color: #e5e7eb; }
.row { display: flex; gap: 1rem; margin-bottom: 1rem; }
.nested-row { display: flex; gap: 2rem; margin-top: 1rem; border-top: 1px dashed #4b5563; padding-top: 1rem; }
.mini-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
.half, .half-col { width: 50%; }
.grow { flex-grow: 1; }
.shrink { flex-shrink: 0; }
.form-group { margin-bottom: 1rem; }
label { display: block; margin-bottom: 0.4rem; font-size: 0.9rem; color: #9ca3af; font-weight: 600; }
.hint { display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.2rem; }
.info-text { font-size: 0.9rem; color: #10b981; margin-top: 0.5rem; }
.form-input { width: 100%; padding: 0.7rem; background-color: #111827; border: 1px solid #4b5563; border-radius: 6px; color: white; font-size: 0.95rem; }
.form-input:focus { border-color: #3b82f6; outline: none; }
.form-input.small { padding: 0.4rem; font-size: 0.85rem; }
.band-mode-switch { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; background: #111827; padding: 1rem; border-radius: 8px; }
.switch-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #d1d5db; }
.track-card { background-color: #1a202c; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #374151; }
.track-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.track-header h4 { margin: 0; color: #10b981; }
.mood-selector { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mood-chip { padding: 0.3rem 0.8rem; border-radius: 20px; background: #374151; color: #d1d5db; border: 1px solid transparent; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
.mood-chip:hover { background: #4b5563; }
.mood-chip.active { background-color: #3b82f6; color: white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
.btn-add { background-color: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-add.small { padding: 0.4rem 0.8rem; font-size: 0.9rem; }
.btn-remove-icon { background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; }
.btn-text-blue { background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
.btn-text-red { background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold; }
.btn-submit { width: 100%; padding: 1rem; background-color: #10b981; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.error-banner { background-color: #7f1d1d; color: #fecaca; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; text-align: center; border: 1px solid #ef4444; }
.gallery-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
.sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
@media (max-width: 768px) { .row, .nested-row { flex-direction: column; gap: 0.5rem; } .half, .half-col { width: 100%; } .nested-row { padding-top: 0; border: none; } }
</style>