<template>
  <div class="participant-view" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { TrackEvent, type TrackPublication, type RemoteTrack } from 'livekit-client';

const props = defineProps<{
  publication: TrackPublication | null
}>();

const containerRef = ref<HTMLDivElement | null>(null);

const attach = (pub: TrackPublication) => {
  if (!pub.track || !containerRef.value) {
    return;
  }
  
  detach();

  const element = pub.track.attach();
  
  if (pub.source === 'camera') {
    element.classList.add('mirrored');
  }

  containerRef.value.appendChild(element);
};

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
  if (oldPub) {
    oldPub.off(TrackEvent.Subscribed, handleSubscribed);
    detach();
  }

  if (newPub) {
    if (newPub.track) {
      attach(newPub);
    } else {
      // ✅ LA CORRECCIÓN ESTÁ AQUÍ
      // El evento 'Subscribed' nos notifica, y entonces llamamos a nuestra
      // función 'handleSubscribed' que tiene acceso a la publicación completa.
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
.participant-view :deep(video),
.participant-view :deep(audio) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
}
.participant-view :deep(video.mirrored) {
  transform: scaleX(-1);
}
.participant-view :deep(audio) {
  visibility: hidden;
}
</style>