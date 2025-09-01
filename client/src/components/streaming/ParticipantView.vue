<template>
  <div class="participant-view" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { TrackEvent, type TrackPublication, type Track } from 'livekit-client'; // <-- Añade 'Track' a los imports

const props = defineProps<{
  publication: TrackPublication | null,
  isLocal: boolean
}>();

const containerRef = ref<HTMLDivElement | null>(null);

// Función para mostrar el video/audio en el DOM
// La hacemos más simple: ahora recibe el track directamente
const attach = (track: Track) => {
  if (!containerRef.value) return;

  detach(); // Limpiamos cualquier elemento anterior

  const element = track.attach();

  if (track.source === 'camera' && props.isLocal) {
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

// ✨ LÓGICA CORREGIDA ✨
// Ahora, el manejador del evento recibe el 'track' como argumento
const handleSubscribed = (track: Track) => {
  attach(track);
};

watch(() => props.publication, (newPub, oldPub) => {
  if (oldPub) {
    // Limpiamos el listener del track anterior para evitar fugas de memoria
    oldPub.off(TrackEvent.Subscribed, handleSubscribed);
    detach();
  }

  if (newPub) {
    // Si el track ya está listo y suscrito, lo mostramos
    if (newPub.track) {
      attach(newPub.track);
    } else {
      // Si no, esperamos a que el evento 'Subscribed' nos avise
      // El evento nos pasará el objeto 'track' directamente
      newPub.on(TrackEvent.Subscribed, handleSubscribed);
    }
  }
}, { immediate: true });

onUnmounted(() => {
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