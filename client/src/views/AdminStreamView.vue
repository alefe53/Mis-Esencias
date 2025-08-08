<template>
<div class="admin-stream-layout">
<div class="stream-panel-full">
<div class="video-container" ref="videoContainerRef">
<div v-if="!room" class="placeholder">
<video ref="previewVideoRef" autoplay muted playsinline class="preview-video"></video>
<div class="placeholder-content">
<p v-if="isCheckingPermissions">Verificando permisos...</p>
<p v-else-if="permissionError">{{ permissionError }}</p>
<p v-else-if="!localVideoTrack">Cámara lista para la vista previa.</p>

<button @click="handleStartStreamClick" :disabled="isConnecting || !localVideoTrack || !!permissionError">
{{ isConnecting ? 'Conectando...' : '▶️ Iniciar Transmisión' }}
</button>
</div>
</div>
<ParticipantView v-if="localParticipant && room" :participant="localParticipant" :muted="true" />
</div>

<div class="controls-section" v-if="room">
<div class="device-controls">
<button @click="toggleCamera(!localParticipant?.isCameraEnabled)" :disabled="!room" :class="{ 'is-off': !localParticipant?.isCameraEnabled }">
{{ localParticipant?.isCameraEnabled ? '📷 Apagar' : '📷 Encender' }}
</button>
<button @click="toggleMicrophone(!localParticipant?.isMicrophoneEnabled)" :disabled="!room" :class="{ 'is-off': !localParticipant?.isMicrophoneEnabled }">
{{ localParticipant?.isMicrophoneEnabled ? '🎤 Silenciar' : '🎤 Activar' }}
</button>
<button @click="toggleRecording" :class="{ 'is-recording': isRecording }" :disabled="!room">
{{ isRecording ? '⏹️ Detener Grabación' : '⏺️ Iniciar Grabación' }}
</button>
</div>
<div class="device-selectors">
<div class="device-selector">
<label for="cam-select">Cámara:</label>
<select id="cam-select" :value="activeCameraId" @change="onCameraChange" :disabled="!localVideoTrack && !room">
<option v-for="cam in availableCameras" :key="cam.id" :value="cam.id">{{ cam.label }}</option>
</select>
</div>
<div class="device-selector">
<label for="mic-select">Micrófono:</label>
<select id="mic-select" :value="activeMicId" @change="onMicChange" :disabled="!localVideoTrack && !room">
<option v-for="mic in availableMics" :key="mic.id" :value="mic.id">{{ mic.label }}</option>
</select>
</div>
</div>
<div class="stream-actions">
<div class="info">
<p>👀 Espectadores: {{ participantCount }}</p>
</div>
<button @click="disconnect" class="stop-stream-btn">⏹️ Detener Transmisión</button>
</div>
</div>
</div>
</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamingStore } from '../stores/streamingStore';
import ParticipantView from '../components/streaming/ParticipantView.vue';
import { createLocalVideoTrack, type LocalVideoTrack, Room } from 'livekit-client';

const streamingStore = useStreamingStore();
const {
room, isConnecting, isRecording, localParticipant, participantCount,
availableCameras, availableMics, activeCameraId, activeMicId
} = storeToRefs(streamingStore);

const {
connectAndPublish,
disconnect, toggleCamera, toggleMicrophone,
startRecording, stopRecording, changeCamera, changeMicrophone
} = streamingStore;

const videoContainerRef = ref<HTMLDivElement | null>(null);
const previewVideoRef = ref<HTMLVideoElement | null>(null);
const localVideoTrack = ref<LocalVideoTrack | null>(null);

const permissionError = ref<string>('');
const isCheckingPermissions = ref(true);

let chatPopupWindow: Window | null = null;

const enablePreview = async () => {
if (localVideoTrack.value) {
localVideoTrack.value.stop();
}
permissionError.value = '';
isCheckingPermissions.value = true;

try {
await Room.getLocalDevices('videoinput', true);
await Room.getLocalDevices('audioinput', true);
localVideoTrack.value = await createLocalVideoTrack({
resolution: { width: 1280, height: 720, frameRate: 30 },
});
if (previewVideoRef.value) {
localVideoTrack.value.attach(previewVideoRef.value);
}
console.log("Vista previa de la cámara activada exitosamente.");
} catch (error: any) {
console.error("LiveKit | Error detallado al obtener la cámara:", error);
if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
permissionError.value = 'Permiso para acceder a la cámara denegado. Revísalo en la configuración de tu navegador.';
} else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
permissionError.value = 'No se encontró ninguna cámara conectada.';
} else {
permissionError.value = 'Ocurrió un error desconocido al acceder a la cámara.';
}
} finally {
isCheckingPermissions.value = false;
}
};

const disablePreview = () => {
if (localVideoTrack.value) {
localVideoTrack.value.stop();
localVideoTrack.value.detach();
localVideoTrack.value = null;
}
};

const handleStartStreamClick = async () => {
if (!localVideoTrack.value) {
alert("La cámara no está lista. Por favor, concede los permisos.");
return;
}
disablePreview();
await connectAndPublish();
};

const onCameraChange = (event: Event) => {
const deviceId = (event.target as HTMLSelectElement).value;
if (room.value) {
changeCamera(deviceId);
} else {
enablePreview();
}
};

const onMicChange = (event: Event) => {
const deviceId = (event.target as HTMLSelectElement).value;
if (room.value) {
changeMicrophone(deviceId);
}
};

const toggleRecording = () => {
if (isRecording.value) {
stopRecording();
} else {
startRecording();
}
};

const openChatPopup = () => {
if (chatPopupWindow === null || chatPopupWindow.closed) {
const width = 400;
const height = 700;
const left = window.screen.width - width - 50;
const top = 100;
const windowFeatures = `width=${width},height=${height},left=${left},top=${top},popup=true`;
chatPopupWindow = window.open('/chat-popup', 'chatWindow', windowFeatures);
} else {
chatPopupWindow.focus();
}
};

const closeChatPopup = () => {
if (chatPopupWindow && !chatPopupWindow.closed) {
chatPopupWindow.close();
}
chatPopupWindow = null;
};

onMounted(() => {
if (!room.value) {
enablePreview();
}
openChatPopup();
});

onUnmounted(() => {
disablePreview();
closeChatPopup();
if (room.value) {
disconnect();
}
});
</script>

<style scoped>
.admin-stream-layout {
padding: 1rem;
height: calc(100vh - 150px);
}
.stream-panel-full {
display: flex;
flex-direction: column;
background-color: #1f2937;
border-radius: 8px;
padding: 1rem;
gap: 1rem;
height: 100%;
}
.video-container {
flex-grow: 1;
background-color: black;
border-radius: 6px;
display: flex;
justify-content: center;
align-items: center;
position: relative;
overflow: hidden;
min-height: 0;
}
.placeholder {
width: 100%;
height: 100%;
display: flex;
justify-content: center;
align-items: center;
text-align: center;
}
.placeholder-content {
position: relative;
z-index: 2;
background-color: rgba(0, 0, 0, 0.5);
padding: 1rem 2rem;
border-radius: 8px;
color: white;
}
.preview-video {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
object-fit: cover;
z-index: 1;
transform: scaleX(-1);
}
.placeholder button {
font-size: 1.2rem;
padding: 0.8rem 1.5rem;
margin-top: 1rem;
}
.placeholder p {
font-weight: 500;
}
.placeholder button:disabled {
background-color: #4b5563;
cursor: not-allowed;
opacity: 0.7;
}
.controls-section {
display: flex;
justify-content: space-between;
align-items: center;
flex-wrap: wrap;
gap: 1rem;
padding-top: 1rem;
border-top: 1px solid #374151;
}
.device-controls,
.device-selectors,
.stream-actions {
display: flex;
gap: 0.75rem;
align-items: center;
}
.controls-section button {
background-color: #374151;
transition: background-color 0.2s;
}
.controls-section button:hover {
background-color: #4b5563;
}
.controls-section button.is-off {
background-color: #991b1b;
}
.controls-section button.is-recording {
background-color: #ef4444;
color: white;
}
.stop-stream-btn {
background-color: #b91c1c;
font-weight: bold;
}
.stop-stream-btn:hover {
background-color: #991b1b;
}
.device-selector {
display: flex;
align-items: center;
gap: 0.5rem;
}
.device-selector label {
font-size: 0.9rem;
}
.device-selector select {
background-color: #4b5563;
border: 1px solid #6b7280;
padding: 0.5rem;
border-radius: 4px;
}
.info {
font-weight: 500;
}
</style>