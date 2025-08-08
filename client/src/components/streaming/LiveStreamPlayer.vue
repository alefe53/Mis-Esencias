<template>
<div class="livestream-player-container">
<div class="stream-header">
<div class="live-indicator">
<span class="live-dot"></span>
EN VIVO
</div>
<div class="viewer-count">
<span class="icon">👀</span>
<span>{{ participantCount }}</span>
</div>
</div>
<div class="video-grid">
<div v-if="room && adminParticipant" class="video-wrapper">
<ParticipantView :participant="adminParticipant" :muted="!userHasUnmuted" />
<div v-if="!userHasUnmuted" class="unmute-overlay" @click="unmutePlayer">
<span class="unmute-icon">🔇</span>
<span class="unmute-text">Toca para activar el sonido</span>
</div>
</div>
<div v-else-if="room && !adminParticipant" class="stream-placeholder">
<p>Esperando la señal del streamer...</p>
</div>
<div v-else-if="isConnecting" class="stream-placeholder">
<p>Conectando al stream...</p>
</div>
<div v-else class="stream-placeholder cta" @click="handleWatchClick">
<div class="play-icon">▶</div>
<p>Ver la transmisión en vivo</p>
</div>
</div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamingStore } from '../../stores/streamingStore';
import ParticipantView from './ParticipantView.vue';

const streamingStore = useStreamingStore();
const { participantCount, adminParticipant, room, isConnecting } = storeToRefs(streamingStore);
const { connectToView } = streamingStore;

const userHasUnmuted = ref(false);

const handleWatchClick = () => {
if (isConnecting.value) return;
connectToView();
};

const unmutePlayer = () => {
userHasUnmuted.value = true;
// Forzar la reproducción de todos los elementos de audio por si el navegador se pone estricto.
if (room.value) {
room.value.remoteParticipants.forEach(p => {
p.audioTrackPublications.forEach(pub => {
pub.track?.attachedElements.forEach(el => {
(el as HTMLAudioElement).play().catch(e => console.warn("Play() falló tras el unmute, esto es a veces normal:", e));
});
});
});
}
};
</script>

<style scoped>
.livestream-player-container {
border: 1px solid #ef4444;
box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
border-radius: 12px;
margin-bottom: 2.5rem;
background-color: #111827;
overflow: hidden;
}
.stream-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 0.5rem 1rem;
background-color: rgba(239, 68, 68, 0.2);
}
.live-indicator {
display: flex;
align-items: center;
gap: 0.5rem;
font-weight: bold;
color: #f87171;
text-transform: uppercase;
font-size: 0.9rem;
}
.live-dot {
width: 10px;
height: 10px;
background-color: #ef4444;
border-radius: 50%;
animation: pulse 1.5s infinite;
}
.viewer-count {
display: flex;
align-items: center;
gap: 0.5rem;
color: #fca5a5;
}
.video-grid {
padding: 0;
aspect-ratio: 16 / 9;
display: flex;
justify-content: center;
align-items: center;
position: relative;
}
.video-wrapper {
width: 100%;
height: 100%;
position: relative;
}
.stream-placeholder {
color: #9ca3af;
font-style: italic;
}
.stream-placeholder.cta {
cursor: pointer;
display: flex;
flex-direction: column;
align-items: center;
gap: 1rem;
font-size: 1.2rem;
transition: transform 0.2s ease;
}
.stream-placeholder.cta:hover {
transform: scale(1.05);
color: #fff;
}
.play-icon {
font-size: 3rem;
line-height: 1;
}
.unmute-overlay {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.6);
color: white;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
cursor: pointer;
z-index: 10;
opacity: 0;
transition: opacity 0.3s ease;
}
.video-wrapper:hover .unmute-overlay {
opacity: 1;
}
.unmute-icon {
font-size: 2.5rem;
}
.unmute-text {
margin-top: 0.5rem;
font-weight: bold;
}
@keyframes pulse {
0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>