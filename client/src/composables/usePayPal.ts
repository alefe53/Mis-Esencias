import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { storeToRefs } from 'pinia'

export function usePayPal(props: { selectedTierId: number; durationMonths: number }) {
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

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
      },
      createOrder: () => {
        // ¡LA CLAVE ESTÁ AQUÍ! No cambiamos ningún estado.
        // Solo llamamos al store y devolvemos la promesa resultante.
        // El SDK de PayPal manejará la UI de carga en el botón.
        return subscriptionStore.createPayPalOrder(
          props.selectedTierId,
          props.durationMonths
        ).then(orderID => {
          if (orderID) {
            return orderID;
          }
          throw new Error('El store no devolvió un orderID válido.');
        }).catch(err => {
          // Si hay un error, lo mostramos y lo propagamos para que el SDK lo sepa.
          paymentError.value = 'No se pudo iniciar el pago con PayPal.';
          console.error('Error al crear la orden de PayPal:', err);
          throw err;
        });
      },
      onApprove: (data: any, actions: any) => {
        // Ahora sí, ponemos el estado de carga para el proceso de captura.
        isProcessing.value = true;
        return actions.order.capture().then(async (details: any) => {
          const { success } = await subscriptionStore.capturePayPalPayment(details.id);
          isProcessing.value = false;
          if (success) {
            router.push('/profile');
          }
        });
      },
      onCancel: () => {
        isProcessing.value = false;
        paymentError.value = "El pago fue cancelado.";
      },
      onError: (err: any) => {
        isProcessing.value = false;
        console.error("Error del SDK de PayPal:", err);
        paymentError.value = "Ocurrió un error con PayPal. Por favor, intenta de nuevo.";
      },
    }).render(paypalButtonContainer.value);
  }

  onMounted(() => {
    initializePayPalButton()
  })

  return {
    isProcessing,
    paypalButtonContainer,
  }
}