<template>
<div class="participant-view" ref="containerRef">
</div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';
import { type Participant, RoomEvent, Track, type TrackPublication } from 'livekit-client';

// <-- CAMBIO CLAVE: La prop ahora es el objeto 'Participant' completo.
const props = defineProps<{
participant: Participant;
muted?: boolean;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

const attachTrack = (publication: TrackPublication) => {
        console.log(`[ParticipantView] Intentando adjuntar track: ${publication.trackSid}`, publication);
  
if (!publication.track || !containerRef.value) return;
const element = publication.track.attach();
if (publication.kind === Track.Kind.Video) {
(element as HTMLVideoElement).muted = true;
(element as HTMLVideoElement).playsInline = true;
}
if (publication.kind === Track.Kind.Audio) {
(element as HTMLAudioElement).muted = !!props.muted;
}
containerRef.value.appendChild(element);
};

const detachTrack = (publication: TrackPublication) => {
    console.log(`[ParticipantView] Desadjuntando track: ${publication.trackSid}`);
    
publication.track?.detach().forEach(el => el.remove());
};

const setupParticipant = (p: Participant) => {
if (!p || !containerRef.value) return;

console.log(`[ParticipantView] Configurando participante: ${p.identity}`);
containerRef.value.innerHTML = '';

p.trackPublications.forEach(pub => {
if (pub.isSubscribed && pub.track) {
attachTrack(pub);
}
});

p.on(RoomEvent.TrackSubscribed, (track, publication) => {
      console.log(`[ParticipantView] 🔔 Evento: TrackSubscribed!`, publication);
       
attachTrack(publication);
});
p.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
detachTrack(publication);
});
p.on(RoomEvent.LocalTrackPublished, (publication) => {
attachTrack(publication);
});
p.on(RoomEvent.LocalTrackUnpublished, (publication) => {
detachTrack(publication);
});
};

const cleanupParticipant = (p: Participant) => {
if (!p) return;
console.log(`[ParticipantView] Limpiando participante: ${p.identity}`);
p.trackPublications.forEach(detachTrack);
p.removeAllListeners();
};

watch(() => props.muted, (isMuted) => {
if (!containerRef.value) return;
const audioElements = containerRef.value.querySelectorAll('audio');
audioElements.forEach(audio => {
audio.muted = !!isMuted;
});
});

// <-- CAMBIO CLAVE: El watcher ahora observa directamente la prop 'participant'.
watch(() => props.participant, (newParticipant, oldParticipant) => {
nextTick(() => {
if (oldParticipant) cleanupParticipant(oldParticipant);
if (newParticipant) setupParticipant(newParticipant);
});
}, { immediate: true });

onUnmounted(() => {
if (props.participant) {
cleanupParticipant(props.participant);
}
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
}
.participant-view :deep(video),
.participant-view :deep(audio) {
width: 100%;
height: 100%;
object-fit: cover;
position: absolute;
top: 0;
left: 0;
}
.participant-view :deep(audio) {
visibility: hidden;
}
</style>