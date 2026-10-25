<template>
  <div id="wallet_container"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  preferenceId: string
}>()

let brickInstance: any = null

const initializeBrick = async () => {
  if (typeof window.MercadoPago !== 'undefined') {
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY
    
    const mp = new window.MercadoPago(publicKey, {
      // Usamos la variable que acabamos de verificar
      locale: 'es-AR',
    })

    const bricksBuilder = mp.bricks()
    const settings = {
      initialization: {
        preferenceId: props.preferenceId,
        redirectMode: 'self',
      },
      customization: {
        texts: {
          valueProp: 'smart_option',
        },
      },
      callbacks: {
        onReady: () => {
          /* Brick listo */
        },
        onSubmit: () => {
          /* Click en pagar */
        },
        onError: (error: any) =>
          console.error('Error en Mercado Pago Brick:', error),
      },
    }
    brickInstance = await bricksBuilder.create(
      'wallet',
      'wallet_container',
      settings,
    )
  } else {
    console.warn('SDK de Mercado Pago no está listo, reintentando...')
    setTimeout(initializeBrick, 200)
  }
}

onMounted(() => {
  initializeBrick()
})

onBeforeUnmount(() => {
  if (brickInstance && typeof brickInstance.unmount === 'function') {
    brickInstance.unmount()
  }
})
</script>
