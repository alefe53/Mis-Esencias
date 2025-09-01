<template>
  <div class="participant-view" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { TrackEvent, type TrackPublication } from 'livekit-client';

// La clave es la nueva prop "isLocal" y el manejo del evento "Subscribed".
const props = defineProps<{
  publication: TrackPublication | null,
  isLocal: boolean
}>();

const containerRef = ref<HTMLDivElement | null>(null);

// Función para mostrar el video/audio en el DOM
const attach = (pub: TrackPublication) => {
  if (!pub.track || !containerRef.value) {
    return;
  }
  
  detach(); // Limpiamos cualquier elemento anterior

  const element = pub.track.attach();
  
  // Usamos la nueva prop para decidir si espejar el video
  if (pub.source === 'camera' && props.isLocal) {
    element.classList.add('mirrored');
  }

  containerRef.value.appendChild(element);
};

// Función para limpiar el DOM
const detach = () => {
  if (containerRef.value) {
    containerRef.value.innerHTML = '';
  }
};

// Creamos una función manejadora para poder añadirla y quitarla del listener
const handleSubscribed = () => {
  if (props.publication) {
    attach(props.publication);
  }
};

watch(() => props.publication, (newPub, oldPub) => {
  // Limpiamos listeners del track anterior
  if (oldPub) {
    oldPub.off(TrackEvent.Subscribed, handleSubscribed);
    detach();
  }

  if (newPub) {
    // Si el track ya está listo (porque ya estábamos suscritos), lo mostramos
    if (newPub.isSubscribed && newPub.track) {
      attach(newPub);
    } else {
      // Si no, esperamos a que el evento 'Subscribed' nos avise
      newPub.on(TrackEvent.Subscribed, handleSubscribed);
    }
  }
}, { immediate: true });


onUnmounted(() => {
  // Aseguramos la limpieza al destruir el componente
  if (props.publication) {
    props.publication.off(TrackEvent.Subscribed, handleSubscribed);
  }
  detach();
});
</script>

<style scoped>
.participant-view {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* :deep() permite aplicar estilos a los elementos hijos creados dinámicamente */
.participant-view :deep(video),
.participant-view :deep(audio) {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 'contain' evita que el video se corte */
  position: absolute;
  top: 0;
  left: 0;
}
.participant-view :deep(video.mirrored) {
  transform: scaleX(-1);
}
.participant-view :deep(audio) {
  /* El audio no necesita ser visible */
  visibility: hidden;
}
</style>