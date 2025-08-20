<template>
  <div class="subscription-page-container">
    <h1 class="page-title">Únete a la Comunidad Fenicia</h1>
    <p class="page-subtitle">
      Apoya el proyecto y obtén acceso a contenido exclusivo, charlas y más.
    </p>

    <div v-if="isLoadingTiers" class="loading-placeholder">
      Cargando planes...
    </div>

    <div v-else class="content-wrapper">
      <div v-if="!isMobile" class="table-container">
        <table>
          <thead>
            <tr>
              <th>Beneficios</th>
              <th
                v-for="tier in sortedTiers"
                :key="tier.id"
                :class="{ 'highlighted-header': tier.id === selectedTierId }"
              >
                {{ tier.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(feature, index) in allFeatures" :key="index">
              <td>{{ feature }}</td>
              <td
                v-for="tier in sortedTiers"
                :key="tier.id"
                :class="{ 'highlighted-cell': tier.id === selectedTierId }"
              >
                <span v-if="tierHasFeature(tier, feature)" class="checkmark"
                  >✓</span
                >
                <span v-else class="cross"></span>
              </td>
            </tr>
            <tr class="price-row">
              <td>Precio (USD)</td>
              <td
                v-for="tier in sortedTiers"
                :key="tier.id"
                :class="{ 'highlighted-cell': tier.id === selectedTierId }"
              >
                <span class="price">${{ tier.price.toFixed(2) }}</span>
                <span class="period" v-if="tier.price > 0">/mes</span>
              </td>
            </tr>
            <tr class="selection-row">
              <td></td>
              <td
                v-for="tier in sortedTiers"
                :key="tier.id"
                :class="{ 'highlighted-cell': tier.id === selectedTierId }"
              >
                <button
                  @click="selectTier(tier.id)"
                  :class="{ selected: tier.id === selectedTierId }"
                >
                  {{
                    tier.id === selectedTierId ? 'Seleccionado' : 'Seleccionar'
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="tiers-mobile-container">
        <div
          v-for="tier in sortedTiers"
          :key="tier.id"
          class="tier-card-mobile"
          :class="{ 'highlighted-card': tier.id === selectedTierId }"
          @click="selectTier(tier.id)"
        >
          <div class="card-header-mobile">
            <h2>{{ tier.name }}</h2>
            <div class="price-mobile">
              <span class="price">${{ tier.price.toFixed(2) }}</span>
              <span class="period" v-if="tier.price > 0">/mes</span>
            </div>
          </div>
          <ul class="features-list-mobile">
            <li v-for="(feature, index) in allFeatures" :key="index">
              <span
                class="check-or-cross"
                :class="tierHasFeature(tier, feature) ? 'yes' : 'no'"
              >
                {{ tierHasFeature(tier, feature) ? '✓' : '—' }}
              </span>
              {{ feature }}
            </li>
          </ul>
          <button
            class="select-btn-mobile"
            :class="{ selected: tier.id === selectedTierId }"
          >
            {{ tier.id === selectedTierId ? 'Seleccionado' : 'Seleccionar' }}
          </button>
        </div>
      </div>

      <transition name="fade">
        <div v-if="selectedTierId" class="duration-and-payment-section">
          <div class="duration-selector">
            <h4>Elige la duración</h4>
            <div class="duration-options">
              <button
                v-for="duration in durations"
                :key="duration.months"
                @click="selectedDuration = duration.months"
                :class="{ selected: selectedDuration === duration.months }"
              >
                {{ duration.label }}
              </button>
            </div>
            <div v-if="totalPrice > 0" class="total-price">
              Total: ${{ totalPrice.toFixed(2) }} USD
            </div>
          </div>

          <PaymentOptions
            v-if="selectedDuration"
            :selected-tier-id="selectedTierId"
            :duration-months="selectedDuration"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import type { SubscriptionTier } from '../types'
import PaymentOptions from '../components/payment/PaymentOptions.vue'

const subscriptionStore = useSubscriptionStore()
const { sortedTiers, isLoading: isLoadingTiers } =
  storeToRefs(subscriptionStore)

const selectedTierId = ref<number | null>(null)
const selectedDuration = ref<number | null>(null)

const durations = [
  { months: 1, label: '1 Mes' },
  { months: 3, label: '3 Meses' },
  { months: 6, label: '6 Meses' },
]
const isMobile = ref(window.innerWidth <= 768)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  subscriptionStore.fetchSubscriptionTiers()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const allFeatures = computed(() => {
  const featuresSet = new Set<string>()
  sortedTiers.value.forEach((tier) => {
    tier.features?.items.forEach((feature) => {
      featuresSet.add(feature)
    })
  })
  return Array.from(featuresSet)
})

const tierHasFeature = (tier: SubscriptionTier, feature: string): boolean => {
  return tier.features?.items.includes(feature) ?? false
}

const selectTier = (tierId: number) => {
  selectedTierId.value = tierId
  selectedDuration.value = null
  const selectedTier = sortedTiers.value.find((t) => t.id === tierId)
  if (selectedTier && selectedTier.price === 0) {
    selectedDuration.value = 12
  }
}

const totalPrice = computed(() => {
  if (!selectedTierId.value || !selectedDuration.value) return 0
  const tier = sortedTiers.value.find((t) => t.id === selectedTierId.value)
  if (!tier) return 0
  return tier.price * selectedDuration.value
})
</script>

<style scoped>
.subscription-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2rem 5rem 2rem;
  color: #e0e0e0;
}
.page-title {
  font-family: 'Uncial Antiqua', serif;
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}
.page-subtitle {
  text-align: center;
  font-size: 1.1rem;
  color: #ccc;
  margin-bottom: 3rem;
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
  padding: 1.2rem 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.3s ease;
}
th {
  font-size: 1.2rem;
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
.highlighted-header {
  background-color: rgba(252, 163, 17, 0.1);
}
.highlighted-cell {
  background-color: rgba(255, 255, 255, 0.05);
}
.checkmark {
  color: #4ade80;
  font-size: 1.5rem;
  font-weight: bold;
}
.price-row {
  font-size: 1.3rem;
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
.selection-row button {
  padding: 8px 16px;
  border: 1px solid #666;
  background-color: transparent;
  color: #ccc;
  border-radius: 20px;
  transition: all 0.2s ease;
}
.selection-row button:hover {
  background-color: #555;
  border-color: #888;
  color: white;
}
.selection-row button.selected {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  font-weight: bold;
}
.duration-and-payment-section {
  margin-top: 3rem;
}
.duration-selector {
  text-align: center;
  margin-bottom: 2rem;
}
.duration-selector h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.duration-options {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.duration-options button {
  padding: 10px 20px;
  border: 1px solid #666;
  background-color: #333;
  color: #ccc;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.duration-options button:hover {
  background-color: #555;
}
.duration-options button.selected {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}
.total-price {
  margin-top: 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 768px) {
  .subscription-page-container {
    padding: 1rem 1rem 4rem 1rem;
  }
  .page-title {
    font-size: 2.2rem;
  }
  .page-subtitle {
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  /* --- Estilos para las Tarjetas en Móvil --- */
  .tiers-mobile-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .tier-card-mobile {
    background-color: rgba(20, 20, 20, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
  }
  .tier-card-mobile.highlighted-card {
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }
  .card-header-mobile {
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
  .card-header-mobile h2 {
    font-size: 1.5rem;
    color: #fca311;
    margin: 0 0 0.5rem;
  }
  .price-mobile {
    font-size: 1.3rem;
    font-weight: bold;
  }
  .features-list-mobile {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
  }
  .features-list-mobile li {
    padding: 0.5rem 0;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .check-or-cross {
    font-weight: bold;
    font-size: 1.2rem;
  }
  .check-or-cross.yes {
    color: #4ade80;
  }
  .check-or-cross.no {
    color: #666;
  }
  .select-btn-mobile {
    width: 100%;
    padding: 12px;
    border: 1px solid #666;
    background-color: transparent;
    color: #ccc;
    border-radius: 20px;
    transition: all 0.2s ease;
    font-weight: bold;
  }
  .select-btn-mobile.selected {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .duration-options {
    flex-wrap: wrap;
  }
}
</style>
