<template>
  <div class="home-guest-container">
    <div class="header-container">
      <WelcomeBanner />
      <SubscriptionButton mode="corner-float" />
    </div>

    <section class="intro-section fade-in-item" ref="introSection">
      <p class="philosophy">
        ¡Hola! Soy ADF. Fusioné mis pasiones por la <strong>música</strong> y la
        <strong>programación</strong> para dar vida a este espacio. Acá no solo
        comparto mi música —historias sonoras—, sino que también construimos una
        <strong>comunidad</strong> para charlar, comentar y conectar. ¡Aguante
        Argentina! ¡Bobo!
      </p>
    </section>

    <section class="photo-gallery fade-in-item" ref="photoGallery">
      <div v-for="image in personalPhotos" :key="image.src" class="photo-card">
        <img :src="image.src" :alt="image.alt" />
      </div>
    </section>

    <section
      class="subscriptions-section fade-in-item"
      ref="subscriptionsSection"
    >
      <h2 class="section-title">Únete a la Comunidad</h2>
      <div class="table-container" v-if="!isLoading">
        <table>
          <thead>
            <tr>
              <th>Beneficios</th>
              <th
                v-for="tier in subscriptionTiersWithInclusiveFeatures"
                :key="tier.id"
              >
                {{ tier.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(feature, index) in allFeatures" :key="index">
              <td>{{ feature }}</td>
              <td
                v-for="tier in subscriptionTiersWithInclusiveFeatures"
                :key="tier.id"
              >
                <span v-if="tierHasFeature(tier, feature)" class="checkmark"
                  >✓</span
                >
                <span v-else class="cross">-</span>
              </td>
            </tr>
            <tr class="price-row">
              <td>Precio</td>
              <td
                v-for="tier in subscriptionTiersWithInclusiveFeatures"
                :key="tier.id"
              >
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
import SubscriptionButton from '../components/common/SubscriptionButton.vue'
import { useFadeInAnimation } from '../composables/useFadeInAnimation'

const introSection = ref(null)
const photoGallery = ref(null)
const subscriptionsSection = ref(null)

useFadeInAnimation([introSection, photoGallery, subscriptionsSection])

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
      // MODIFICADO: Se ordenan los planes por precio para asegurar la herencia correcta
      const sortedTiers = response.data.data.sort(
        (a: SubscriptionTier, b: SubscriptionTier) => a.price - b.price,
      )
      subscriptionTiers.value = sortedTiers
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
    // Se excluye el feature "Todo lo del plan anterior" de la lista de filas
    const filteredFeatures = tier.features?.items.filter(
      (f) => !f.toLowerCase().includes('todo lo del plan anterior'),
    )
    filteredFeatures?.forEach((feature) => {
      featuresSet.add(feature)
    })
  })
  return Array.from(featuresSet)
})

// MODIFICADO: Nueva propiedad computada para procesar los planes
const subscriptionTiersWithInclusiveFeatures = computed(() => {
  const processedTiers: (SubscriptionTier & {
    inclusiveFeatures: Set<string>
  })[] = []
  const accumulatedFeatures = new Set<string>()

  for (const tier of subscriptionTiers.value) {
    // Añade los beneficios propios del plan actual al set acumulado
    tier.features?.items.forEach((feature) => {
      accumulatedFeatures.add(feature)
    })

    // Crea un nuevo objeto para el plan con una copia del set acumulado
    processedTiers.push({
      ...tier,
      inclusiveFeatures: new Set(accumulatedFeatures),
    })
  }

  return processedTiers
})

// MODIFICADO: La función ahora usa el set de beneficios inclusivos
const tierHasFeature = (
  tier: SubscriptionTier & { inclusiveFeatures: Set<string> },
  feature: string,
): boolean => {
  return tier.inclusiveFeatures.has(feature)
}
</script>

<style scoped>
.fade-in-item {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.home-guest-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem 4rem 2rem;
  color: #e0e0e0;
  text-align: center;
}

.header-container {
  position: sticky;
  top: 0;
  z-index: 1020;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.header-container > :first-child {
  grid-column: 2;
}
.header-container > :last-child {
  grid-column: 3;
  justify-self: end;
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
  color: #4ade80;
  font-size: 1.5rem;
  font-weight: bold;
}
/* MODIFICADO: Estilo para el guión en celdas vacías */
.cross {
  color: #6b7280;
  font-weight: bold;
  font-size: 1.5rem;
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

@media (max-width: 768px) {
  .home-guest-container {
    padding: 0 1rem 3rem 1rem;
  }

  .header-container {
    display: flex;
    flex-direction: column;
    position: static;
  }

  .intro-section {
    margin-bottom: 3rem;
  }

  .philosophy {
    font-size: 1.1rem;
    padding: 1.5rem;
  }

  .photo-gallery {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .photo-card {
    width: 100%;
    max-width: 350px;
    height: 300px;
  }

  .photo-card:hover {
    transform: translateY(-5px) scale(1.02);
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  /* MODIFICADO: Habilitamos el scroll horizontal como última opción */
  .table-container {
    overflow-x: auto;
    padding: 0.5rem;
  }

  /* MODIFICADO: Estilos para hacer la tabla mucho más compacta */
  table {
    min-width: 500px; /* Ancho mínimo para que no se deforme demasiado */
  }

  th,
  td {
    padding: 0.7rem 0.3rem; /* Menos padding */
    font-size: 0.7rem; /* Letra más pequeña */
    white-space: normal; /* Permite que el texto se divida en varias líneas */
  }

  th {
    font-size: 0.75rem; /* Encabezados un poco más grandes */
  }

  td:first-child {
    max-width: 110px; /* Ancho máximo para la primera columna */
    font-weight: 600;
    word-break: break-word; /* Rompe palabras largas si es necesario */
  }

  .checkmark,
  .cross {
    font-size: 1rem; /* Iconos más pequeños */
  }

  .price-row {
    font-size: 0.9rem;
  }

  .price {
    font-size: 1rem;
  }

  .period {
    font-size: 0.7rem;
  }
}
</style>
