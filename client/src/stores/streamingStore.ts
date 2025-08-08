import { defineStore } from 'pinia';
import { ref, shallowRef, nextTick } from 'vue';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, ConnectionState, type TrackPublication, Participant, createLocalVideoTrack } from 'livekit-client';
import api from '../services/api';
import { supabase } from '../services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DeviceInfo } from '../types';
import { useUiStore } from './uiStore';

export const useStreamingStore = defineStore('streaming', () => {
const room = shallowRef<Room | null>(null);
let realtimeChannel: RealtimeChannel | null = null;
const isLive = ref(false);
const isConnecting = ref(false);
const isPublishing = ref(false);
const isDisconnecting = ref(false);
const isRecording = ref(false);
const egressId = ref<string | null>(null);
const localParticipant = shallowRef<LocalParticipant | null>(null);
const remoteParticipants = shallowRef<Map<string, RemoteParticipant>>(new Map());
const adminParticipant = shallowRef<Participant | null>(null);
const participantCount = ref(0);
const availableMics = ref<DeviceInfo[]>([]);
const availableCameras = ref<DeviceInfo[]>([]);
const activeMicId = ref<string>('');
const activeCameraId = ref<string>('');

const _updateRoomState = () => {
    if (!room.value) return;

    // Actualizamos la lista de participantes para la UI
    remoteParticipants.value = new Map(room.value.remoteParticipants);
    participantCount.value = room.value.remoteParticipants.size + (room.value.localParticipant ? 1 : 0);
    
    // --- LÓGICA MEJORADA PARA ENCONTRAR AL STREAMER ---
    let streamer: Participant | undefined;

    // Primero, verificamos si el participante local es el streamer (el que puede publicar)
    if (room.value.localParticipant.permissions?.canPublish) {
        streamer = room.value.localParticipant;
        console.log(`[Store] Streamer identificado como LOCAL: ${streamer.identity}`);
    } else {
        // Si somos espectadores, buscamos en los participantes remotos
        const remotePArray = Array.from(room.value.remoteParticipants.values());

        // La forma más robusta: encontrar al participante que tiene un track de video publicado.
        streamer = remotePArray.find(p => p.videoTrackPublications.size > 0);

        if (streamer) {
            console.log(`[Store] Streamer remoto encontrado (tiene video): ${streamer.identity}`);
        } else {
            // Fallback si aún no se detecta el track de video (menos probable pero seguro)
            console.warn("[Store] No se encontró streamer por track de video. Intentando por permisos...");
            streamer = remotePArray.find(p => p.permissions?.canPublish);
            if (streamer) {
                console.log(`[Store] Streamer encontrado por permisos (fallback): ${streamer.identity}`);
            }
        }
    }

    if (streamer) {
        // Solo actualizamos si el streamer encontrado es diferente al que ya teníamos
        if (adminParticipant.value?.sid !== streamer.sid) {
            console.log(`[Store] Asignando nuevo adminParticipant: ${streamer.identity} (SID: ${streamer.sid})`);
            adminParticipant.value = streamer;
        }
    } else {
        // Si no se encuentra streamer, lo limpiamos para que la UI muestre "Esperando..."
        if (adminParticipant.value) {
           console.warn("[Store] El streamer se ha ido o no se encuentra. Limpiando adminParticipant.");
           adminParticipant.value = null;
        }
    }
};

const _setupRoomListeners = (newRoom: Room) => {
newRoom
.on(RoomEvent.ParticipantConnected, () => nextTick(_updateRoomState))
.on(RoomEvent.ParticipantDisconnected, () => nextTick(_updateRoomState))
.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
console.log(`[Store] Estado de conexión cambiado a: ${state}`);
if (state === ConnectionState.Connected) {
isConnecting.value = false;
localParticipant.value = newRoom.localParticipant;
fetchMediaDevices(); // Obtener dispositivos una vez conectado
nextTick(_updateRoomState);
} else if (state === ConnectionState.Disconnected) {
console.log("[Store] Desconectado. Limpiando todo el estado.");
_resetState();
}
})
// Estos eventos también son importantes para actualizar el estado si un track se añade/quita
.on(RoomEvent.TrackSubscribed, () => nextTick(_updateRoomState))
.on(RoomEvent.TrackUnsubscribed, () => nextTick(_updateRoomState))
.on(RoomEvent.LocalTrackPublished, () => nextTick(_updateRoomState))
.on(RoomEvent.LocalTrackUnpublished, () => nextTick(_updateRoomState))
.on(RoomEvent.MediaDevicesChanged, fetchMediaDevices);
};
const _resetState = () => {
console.log("[Store] Reseteando todo el estado del store de streaming.");
room.value = null;
localParticipant.value = null;
remoteParticipants.value = new Map();
adminParticipant.value = null;
participantCount.value = 0;
isRecording.value = false;
egressId.value = null;
isConnecting.value = false;
isPublishing.value = false;
isDisconnecting.value = false;
};
async function fetchMediaDevices() {
try {
console.log("[Store] Obteniendo dispositivos de medios...");
const devices = await Room.getLocalDevices('audioinput', true);
availableMics.value = devices.map((d: MediaDeviceInfo) => ({ id: d.deviceId, label: d.label || `Micrófono ${availableMics.value.length + 1}` }));
const videoDevices = await Room.getLocalDevices('videoinput', true);
availableCameras.value = videoDevices.map((d: MediaDeviceInfo) => ({ id: d.deviceId, label: d.label || `Cámara ${availableCameras.value.length + 1}` }));

// Actualizamos los IDs activos si no están ya seteados
if (!activeMicId.value && availableMics.value.length > 0) {
activeMicId.value = availableMics.value[0].id;
}
if (!activeCameraId.value && availableCameras.value.length > 0) {
activeCameraId.value = availableCameras.value[0].id;
}
console.log("[Store] Dispositivos encontrados:", { mics: availableMics.value.length, cameras: availableCameras.value.length });
} catch (error) {
console.error("[Store] Error al obtener dispositivos de medios:", error);
}
}

async function connectAndPublish() {
    if (isConnecting.value || room.value) return;
    isConnecting.value = true;
    isPublishing.value = true;
    const uiStore = useUiStore();
    try {
        await fetchMediaDevices();
        const response = await api.get('/streaming/token');
        const token = response.data.token;
        if (!token) throw new Error("No se pudo obtener el token de admin");

        // --- LÓGICA CORREGIDA ---
        // 1. Crea la instancia y ASÍGNALA INMEDIATAMENTE al estado reactivo.
        const newRoom = new Room({ adaptiveStream: true, dynacast: true, publishDefaults: { videoCodec: 'vp8' } });
        room.value = newRoom;

        // 2. Configura los listeners en la instancia ya asignada.
        _setupRoomListeners(room.value);

        // 3. Conecta.
        console.log("[Store] Conectando a la sala de LiveKit...");
        await room.value.connect(import.meta.env.VITE_LIVEKIT_URL, token);
        console.log("[Store] ¡Conectado exitosamente! Publicando tracks...");

        await room.value.localParticipant.setCameraEnabled(true, { deviceId: activeCameraId.value });
        await room.value.localParticipant.setMicrophoneEnabled(true, { deviceId: activeMicId.value });
        
        console.log("[Store] Tracks publicados.");
        await api.post('/streaming/start');
        isLive.value = true;
    } catch (error) {
        console.error("[Store] Falló el proceso de conectar y publicar:", error);
        uiStore.showToast({ message: 'Error al iniciar la transmisión.', color: '#ef4444' });
        _resetState();
    } finally {
        isConnecting.value = false;
        isPublishing.value = false;
    }
}

async function connectToView() {
    if (isConnecting.value || room.value) return;
    isConnecting.value = true;
    const uiStore = useUiStore();
    try {
        const response = await api.get('/streaming/token?viewer=true');
        const token = response.data.token;
        if (!token) throw new Error("No se pudo obtener el token de espectador");

        // --- LÓGICA CORREGIDA ---
        // 1. Crea la instancia y ASÍGNALA INMEDIATAMENTE.
        const newRoom = new Room();
        room.value = newRoom;

        // 2. Configura los listeners en la instancia ya asignada.
        _setupRoomListeners(room.value);
        
        // 3. Conecta.
        console.log("[Store] Conectando a la sala como espectador...");
        await room.value.connect(import.meta.env.VITE_LIVEKIT_URL, token);
        console.log("[Store] ¡Conectado como espectador!");

    } catch (error) {
        console.error("[Store] Falló la conexión como espectador:", error);
        uiStore.showToast({ message: 'No se pudo conectar al stream.', color: '#ef4444' });
        _resetState();
    } finally {
        isConnecting.value = false;
    }
}
async function disconnect() {
if (!room.value || isDisconnecting.value) return;
isDisconnecting.value = true;
console.log("[Store] Iniciando desconexión...");
try {
const isAdminStream = room.value.localParticipant.permissions?.canPublish;
if (isAdminStream) {
console.log("[Store] Es el admin, deteniendo grabación (si existe) y notificando al backend.");
if (isRecording.value) await stopRecording();
await api.post('/streaming/stop');
isLive.value = false; // El admin forza el estado a 'false'
}
await room.value.disconnect();
console.log("[Store] Desconexión de la sala de LiveKit completada.");
} catch (error) {
console.error("[Store] Error durante la desconexión:", error);
} finally {
_resetState();
}
}
function listenToStreamStatus() {
if (realtimeChannel) return;
console.log("[Store] Suscribiendo al canal de eventos de Supabase 'public-events'");
realtimeChannel = supabase
.channel('public-events')
.on('broadcast', { event: 'stream-status-change' }, ({ payload }) => {
console.log(`[Store] Evento Realtime recibido: stream-status-change, isLive: ${payload.isLive}`);
isLive.value = payload.isLive;
// Si el stream termina y somos espectadores, nos desconectamos
if (!payload.isLive && room.value && !room.value.localParticipant.permissions?.canPublish) {
console.log("[Store] El stream ha terminado, desconectando al espectador...");
disconnect();
}
})
.subscribe((status) => {
console.log(`[Store] Estado de suscripción a Realtime: ${status}`);
if (status === 'SUBSCRIBED') {
checkInitialStreamStatus();
}
});
}
async function checkInitialStreamStatus() {
try {
console.log("[Store] Verificando estado inicial del stream...");
const response = await api.get('/streaming/status');
if (response.data.success) {
isLive.value = response.data.data.is_live;
console.log(`[Store] Estado inicial es: ${isLive.value ? 'EN VIVO' : 'APAGADO'}`);
}
} catch (error) {
console.error("[Store] No se pudo verificar el estado inicial del stream:", error);
}
}
async function toggleCamera(enabled: boolean) {
if (room.value?.localParticipant) await room.value.localParticipant.setCameraEnabled(enabled);
}
async function toggleMicrophone(enabled: boolean) {
if (room.value?.localParticipant) await room.value.localParticipant.setMicrophoneEnabled(enabled);
}
async function changeCamera(deviceId: string) {
if (room.value && room.value.localParticipant.isCameraEnabled) {
await room.value.switchActiveDevice('videoinput', deviceId);
activeCameraId.value = deviceId;
}
}
async function changeMicrophone(deviceId: string) {
if (room.value && room.value.localParticipant.isMicrophoneEnabled) {
await room.value.switchActiveDevice('audioinput', deviceId);
activeMicId.value = deviceId;
}
}
async function startRecording() {
const uiStore = useUiStore();
try {
const { data } = await api.post('/streaming/record/start', { title: 'Nuevo Stream', description: 'Grabación en vivo' });
egressId.value = data.egressId;
isRecording.value = true;
uiStore.showToast({ message: 'Grabación iniciada.', color: '#10b981' });
} catch (error) {
console.error("Error al iniciar grabación:", error);
uiStore.showToast({ message: 'Error al iniciar la grabación.', color: '#ef4444' });
}
}
async function stopRecording() {
if (!egressId.value) return;
const uiStore = useUiStore();
try {
await api.post('/streaming/record/stop', { egressId: egressId.value });
egressId.value = null;
isRecording.value = false;
uiStore.showToast({ message: 'Grabación detenida.', color: '#6b7280' });
} catch (error) {
console.error("Error al detener grabación:", error);
uiStore.showToast({ message: 'Error al detener la grabación.', color: '#ef4444' });
}
}
return {
isLive, isConnecting, isPublishing, isRecording, room, localParticipant, remoteParticipants,
participantCount, availableMics, availableCameras, activeMicId, activeCameraId,
adminParticipant,
connectAndPublish, connectToView, disconnect, listenToStreamStatus,
toggleCamera, toggleMicrophone, changeCamera, changeMicrophone,
startRecording, stopRecording, checkInitialStreamStatus
};
});