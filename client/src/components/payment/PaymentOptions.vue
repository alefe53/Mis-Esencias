<template>
  <div class="payment-options-container">
    <h3 class="payment-title">Elige tu método de pago</h3>

    <div v-if="paymentError" class="error-message">{{ paymentError }}</div>

    <div class="buttons-wrapper" v-show="!mercadoPagoPreferenceId">
      <button
        @click="handleMercadoPago"
        :disabled="isProcessing"
        class="payment-button mp-button"
      >
        {{ isProcessing ? 'Cargando...' : 'Pagar con Mercado Pago' }}
      </button>

      <div
        v-if="!isProcessing"
        id="paypal-button-container"
        ref="paypalButtonContainer"
      ></div>
    </div>

    <MercadoPagoBrick
      v-if="mercadoPagoPreferenceId"
      :preference-id="mercadoPagoPreferenceId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '../../stores/subscriptionStore'
import { useMercadoPago } from '../../composables/useMercadoPago'
import { usePayPal } from '../../composables/usePayPal'
import MercadoPagoBrick from './MercadoPagoBrick.vue'

const props = defineProps<{
  selectedTierId: number
  durationMonths: number
}>()

const subscriptionStore = useSubscriptionStore()
const { paymentError } = storeToRefs(subscriptionStore)

const {
  isProcessing: isProcessingMP,
  mercadoPagoPreferenceId,
  handleMercadoPago,
} = useMercadoPago(props)

const { isProcessing: isProcessingPP, paypalButtonContainer } = usePayPal(props)

const isProcessing = computed(
  () => isProcessingMP.value || isProcessingPP.value,
)
</script>

<style scoped>
.payment-options-container {
  margin-top: 2rem;
  padding: 2rem;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 12px;
  border: 1px solid #444;
}
.payment-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #fca311;
}
.buttons-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.payment-button {
  width: 100%;
  max-width: 300px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mp-button {
  background-color: #009ee3;
  color: white;
}
.mp-button:hover {
  background-color: #00b1ff;
}
.mp-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
}
#paypal-button-container {
  width: 100%;
  max-width: 300px;
  min-height: 48px;
}
.error-message {
  text-align: center;
  margin: 1rem 0;
  color: #f87171;
}
</style>
