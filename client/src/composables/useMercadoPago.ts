import { ref } from 'vue'
import { useSubscriptionStore } from '../stores/subscriptionStore'

export function useMercadoPago(props: { selectedTierId: number; durationMonths: number }) {
  const subscriptionStore = useSubscriptionStore()
  const isProcessing = ref(false)
  const mercadoPagoPreferenceId = ref<string | null>(null)

  const handleMercadoPago = async () => {
    if (isProcessing.value) return
    isProcessing.value = true
    const response = await subscriptionStore.createMercadoPagoPreference(
      props.selectedTierId,
      props.durationMonths,
    )
    if (response?.preferenceId) {
      mercadoPagoPreferenceId.value = response.preferenceId
    } else {
      // Si la creación de la preferencia falla, dejamos de procesar.
      isProcessing.value = false
    }
  }

  return {
    isProcessing,
    mercadoPagoPreferenceId,
    handleMercadoPago,
  }
}