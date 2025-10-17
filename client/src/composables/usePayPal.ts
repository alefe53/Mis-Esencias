// RUTA: src/composables/usePayPal.ts
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { storeToRefs } from 'pinia'

export function usePayPal(props: {
  selectedTierId: number
  durationMonths: number
}) {
  const subscriptionStore = useSubscriptionStore()
  const { paymentError } = storeToRefs(subscriptionStore)
  const router = useRouter()

  const isProcessing = ref(false)
  const paypalButtonContainer = ref<HTMLElement | null>(null)

  const initializePayPalButton = () => {
    if (!paypalButtonContainer.value || typeof window.paypal === 'undefined') {
      setTimeout(initializePayPalButton, 200)
      return
    }
    console.log('[PayPal Button] Inicializando...');

    window.paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        },
        createOrder: () => {
          console.log('[PayPal Button] Llamando a createOrder en el backend...');
          return subscriptionStore
            .createPayPalOrder(props.selectedTierId, props.durationMonths)
            .then((orderID) => {
              if (orderID) {
                console.log(`[PayPal Button] Orden creada con ID: ${orderID}`);
                return orderID
              }
              console.error('[PayPal Button] Error: El backend no devolvió un orderID válido.');
              throw new Error('El store no devolvió un orderID válido.')
            })
            .catch((err) => {
              console.error('[PayPal Button] Error en createOrder (catch):', err);
              paymentError.value = 'No se pudo iniciar el pago con PayPal.'
              console.error('Error al crear la orden de PayPal:', err)
              throw err
            })
        },
        onApprove: (data: any, actions: any) => {
          console.log('[PayPal Button] onApprove DISPARADO. Data:', data);
          isProcessing.value = true
          console.log('[PayPal Button] Intentando actions.order.capture()...');
          return actions.order.capture().then(async (details: any) => {
            console.log('[PayPal Button] Capture EXITOSO. Details:', details);
              console.log('[PayPal Button] Llamando al backend /capture-paypal-order...');
            const { success } = await subscriptionStore.capturePayPalPayment(
              details.id,
            )
            console.log(`[PayPal Button] Respuesta del backend /capture: success=${success}`);
            isProcessing.value = false
            if (success) {
              router.push('/profile')
            } else {
                 console.error('[PayPal Button] El backend /capture indicó un fallo.');
            }
          })
        },
        onCancel: () => {
          isProcessing.value = false
          paymentError.value = 'El pago fue cancelado.'
        },
        onError: (err: any) => {
          isProcessing.value = false
          console.error('Error del SDK de PayPal:', err)
          paymentError.value =
            'Ocurrió un error con PayPal. Por favor, intenta de nuevo.'
        },
      })
      .render(paypalButtonContainer.value)
  }

  onMounted(() => {
    initializePayPalButton()
  })

  return {
    isProcessing,
    paypalButtonContainer,
  }
}
