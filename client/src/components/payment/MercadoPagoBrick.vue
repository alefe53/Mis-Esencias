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
    
    // --- INICIO DE CÓDIGO DE DEPURACIÓN ---
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    
    console.log('🧱 [MercadoPagoBrick] Intentando inicializar con Public Key:', publicKey);

    if (!publicKey || !publicKey.startsWith('TEST-')) {
      console.error('🔥🔥🔥 ¡ERROR CRÍTICO! La Public Key que está usando el código NO es de prueba. Valor actual:', publicKey);
      // Lanzamos una alerta para que sea imposible de ignorar
      alert(`ERROR DE CONFIGURACIÓN: La Public Key de Mercado Pago no es de prueba. El valor que se está usando es: ${publicKey}`);
    } else {
      console.log('✅ [MercadoPagoBrick] La Public Key es de prueba. Correcto.');
    }
    // --- FIN DE CÓDIGO DE DEPURACIÓN ---

    const mp = new window.MercadoPago(publicKey, { // Usamos la variable que acabamos de verificar
      locale: 'es-AR',
    });
    
    const bricksBuilder = mp.bricks();
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
        onReady: () => { /* Brick listo */ },
        onSubmit: () => { /* Click en pagar */ },
        onError: (error: any) =>
          console.error('Error en Mercado Pago Brick:', error),
      },
    };
    brickInstance = await bricksBuilder.create(
      'wallet',
      'wallet_container',
      settings,
    );
  } else {
    console.warn('SDK de Mercado Pago no está listo, reintentando...');
    setTimeout(initializeBrick, 200);
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
