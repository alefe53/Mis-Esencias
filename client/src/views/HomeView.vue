<template>
  <div class="home-guest-container">
    <WelcomeBanner />

    <section class="intro-section">
      <p class="philosophy">
        ¡Hola! Soy ADF. Fusioné mis pasiones por la <strong>música</strong> y la
        <strong>programación</strong> para dar vida a este espacio. Aquí no solo
        comparto mi música —una búsqueda de narrativas sonoras con un groove
        marcado—, sino que también construimos una
        <strong>comunidad</strong> para charlar, comentar y conectar. ¡Aguante
        Argentina! ¡Viva América Latina!
      </p>
    </section>

    <section class="photo-gallery">
      <div v-for="image in personalPhotos" :key="image.src" class="photo-card">
        <img :src="image.src" :alt="image.alt" />
      </div>
    </section>

    <section class="subscriptions-section">
      <h2 class="section-title">Únete a la Comunidad</h2>
      <div class="table-container" v-if="!isLoading">
        <table>
          <thead>
            <tr>
              <th>Beneficios</th>
              <th v-for="tier in subscriptionTiers" :key="tier.id">
                {{ tier.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(feature, index) in allFeatures" :key="index">
              <td>{{ feature }}</td>
              <td v-for="tier in subscriptionTiers" :key="tier.id">
                <span v-if="tierHasFeature(tier, feature)" class="checkmark"
                  >✓</span
                >
                <span v-else class="cross"></span>
              </td>
            </tr>
            <tr class="price-row">
              <td>Precio</td>
              <td v-for="tier in subscriptionTiers" :key="tier.id">
                <span class="price">${{ tier.price.toFixed(2) }}</span>
                <span class="period" v-if="tier.price > 0">/mes</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="loading-placeholder">Cargando planes...</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import WelcomeBanner from '../components/common/WelcomeBanner.vue'
import apiPublic from '../services/apiPublic'
import type { SubscriptionTier } from '../types'

const supabasePublicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets-publicos/mis-imagenes/homepage/`
const personalPhotos = ref([
  {
    src: `${supabasePublicUrl}ale-ledc.jpg`,
    alt: 'Grabando guitarras en Ledc',
  },
  {
    src: `${supabasePublicUrl}ale-ischigualasto.jpg`,
    alt: 'Ischigualasto San Juan',
  },
  {
    src: `${supabasePublicUrl}ale-mo-boliche.jpg`,
    alt: 'La presentación de LADLR - Media Octava',
  },
])

const subscriptionTiers = ref<SubscriptionTier[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await apiPublic.get('/public/subscriptions')
    if (response.data.success) {
      subscriptionTiers.value = response.data.data
    }
  } catch (error) {
    console.error('Error al cargar los niveles de suscripción:', error)
  } finally {
    isLoading.value = false
  }
})

const allFeatures = computed(() => {
  const featuresSet = new Set<string>()
  subscriptionTiers.value.forEach((tier) => {
    tier.features?.items.forEach((feature) => {
      featuresSet.add(feature)
    })
  })
  return Array.from(featuresSet)
})

const tierHasFeature = (tier: SubscriptionTier, feature: string): boolean => {
  return tier.features?.items.includes(feature) ?? false
}
</script>

<style scoped>
.home-guest-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem 4rem 2rem;
  color: #e0e0e0;
  text-align: center;
}

.intro-section {
  padding-top: 1rem;
  margin-bottom: 4rem;
}

.philosophy {
  font-family: 'Roboto Slab', serif;
  font-size: 1.2rem;
  line-height: 1.7;
  max-width: 800px;
  margin: 0 auto;
  color: #c5c5c5;
  text-shadow: 0px 0px 8px black;
  background-color: rgba(0, 48, 69, 0.45);
  padding: 2rem;
  border-radius: 15px;
}

.philosophy strong {
  color: #fca311;
}

.photo-gallery {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 5rem;
  flex-wrap: wrap;
}
.photo-card {
  width: 300px;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.photo-card:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.7);
}
.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.subscriptions-section {
  padding-top: 0rem;
}
.section-title {
  font-family: 'Uncial Antiqua', serif;
  font-size: 2.5rem;
  margin-bottom: 2.5rem;
}
.table-container {
  background-color: rgba(20, 20, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Montserrat', sans-serif;
}
th,
td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
th {
  font-size: 1.1rem;
  color: #fca311;
}
td:first-child {
  text-align: left;
  font-weight: 500;
  color: #d1d5db;
}
tbody tr:last-child td {
  border-bottom: none;
}
.checkmark {
  color: #4ade80; /* Verde */
  font-size: 1.5rem;
  font-weight: bold;
}
.price-row {
  font-size: 1.2rem;
  font-weight: bold;
}
.price {
  color: #ffffff;
}
.period {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-left: 4px;
}
</style>
