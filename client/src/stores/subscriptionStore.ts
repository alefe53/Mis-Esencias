import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SubscriptionTier } from '../types'
import apiPublic from '../services/apiPublic'
import * as paymentService from '../services/paymentService'
import { useAuthStore } from './authStore'
import { useUiStore } from './uiStore'

export const useSubscriptionStore = defineStore('subscription', () => {
  const tiers = ref<SubscriptionTier[]>([])
  const isLoading = ref(false)
  const paymentError = ref<string | null>(null)

  const sortedTiers = computed(() =>
    tiers.value.sort((a, b) => a.price - b.price),
  )

  async function fetchSubscriptionTiers() {
    if (tiers.value.length > 0) return
    isLoading.value = true
    try {
      const response = await apiPublic.get('/public/subscriptions')
      if (response.data.success) {
        tiers.value = response.data.data
      }
    } catch (error) {
      console.error('Error fetching subscription tiers:', error)
      paymentError.value = 'No se pudieron cargar los planes de suscripción.'
    } finally {
      isLoading.value = false
    }
  }

  async function createMercadoPagoPreference(
    tierId: number,
    durationMonths: number,
  ) {
    paymentError.value = null
    try {
      const response = await paymentService.createPaymentOrder({
        tierId,
        durationMonths,
        provider: 'mercadopago',
      })
      return response
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Error al crear la preferencia de Mercado Pago.'
      paymentError.value = message
      console.error('Error detallado:', error.response?.data || error)
      return null
    }
  }

  async function createPayPalOrder(tierId: number, durationMonths: number) {
    paymentError.value = null
    try {
      const response = await paymentService.createPaymentOrder({
        tierId,
        durationMonths,
        provider: 'paypal',
      })
      return response.orderID
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Error al crear la orden de PayPal.'
      paymentError.value = message
      console.error('Error detallado:', error.response?.data || error)
      return null
    }
  }

  async function capturePayPalPayment(orderID: string) {
    const authStore = useAuthStore()
    const uiStore = useUiStore()
    isLoading.value = true
    paymentError.value = null
    try {
      await paymentService.capturePayPalOrder(orderID)
      await authStore.fetchUserProfile()
      uiStore.showToast({
        message: '¡Gracias por tu apoyo! Tu suscripción está activa.',
        color: '#4ade80',
      })
      return { success: true }
    } catch (error: any) {
      paymentError.value =
        'No se pudo completar el pago. Por favor, intenta de nuevo.'
      console.error(error)
      uiStore.showToast({
        message: paymentError.value,
        color: '#ef4444',
      })
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  return {
    tiers,
    isLoading,
    paymentError,
    sortedTiers,
    fetchSubscriptionTiers,
    createMercadoPagoPreference,
    createPayPalOrder,
    capturePayPalPayment,
  }
})
