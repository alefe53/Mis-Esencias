import { defineStore } from 'pinia'
import { ref, shallowRef, nextTick, computed } from 'vue'
import {
Room,
RoomEvent,
RemoteParticipant,
LocalParticipant,
ConnectionState,
type TrackPublication,
Participant,
Track,
} from 'livekit-client'
import api from '../services/api'
import { supabase } from '../services/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { DeviceInfo } from '../types'
import { useUiStore } from './uiStore'

const STREAM_STATE_UPDATE_TOPIC = 'stream-state-update'
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const useStreamingStore = defineStore('streaming', () => {
const room = shallowRef<Room | null>(null)
let realtimeChannel: RealtimeChannel | null = null

const isLive = ref(false)
const isStreamLive = ref(false)
const isConnecting = ref(false)
const isPublishing = ref(false)
const isDisconnecting = ref(false)
const isRecording = ref(false)
const isScreenSharing = ref(false)
const egressId = ref<string | null>(null)

const localParticipant = shallowRef<LocalParticipant | null>(null)
const remoteParticipants = shallowRef<Map<string, RemoteParticipant>>(new Map())
const adminParticipant = shallowRef<Participant | null>(null)

const participantCount = ref(0)
const cameraOverlayPosition = ref({ x: 20, y: 20 })
const cameraOverlaySize = ref({ width: 25 })
const isCameraOverlayEnabled = ref(true)
const isCameraFullScreen = ref(false)

const availableMics = ref<DeviceInfo[]>([])
const availableCameras = ref<DeviceInfo[]>([])
const activeMicId = ref<string>('')
const activeCameraId = ref<string>('')

const localScreenSharePublication = computed(() => {
if (!localParticipant.value) return null
return localParticipant.value.getTrackPublication(Track.Source.ScreenShare)
})
 function setLiveStatus(status: boolean) {
    console.log(`Cambiando estado isLive a: ${status} a través de una acción.`);
    isLive.value = status;
  }

const _broadcastStreamState = async () => {
if (!room.value?.localParticipant?.permissions?.canPublish) return
const state = {
isScreenSharing: isScreenSharing.value,
isCameraFullScreen: isCameraFullScreen.value,
cameraOverlayPosition: cameraOverlayPosition.value,
cameraOverlaySize: cameraOverlaySize.value,
}
const payload = textEncoder.encode(
JSON.stringify({
topic: STREAM_STATE_UPDATE_TOPIC,
data: state,
}),
)
await room.value.localParticipant.publishData(payload, { reliable: true })
}

const _updateRoomState = () => {
if (!room.value) return
remoteParticipants.value = new Map(room.value.remoteParticipants)
participantCount.value =
room.value.remoteParticipants.size + (room.value.localParticipant ? 1 : 0)
  console.log(`[STREAM DEBUG] 5. Actualizando estado. Participantes remotos: ${room.value.remoteParticipants.size}`); // <--- AÑADIR ESTE LOG

let streamer: Participant | undefined

if (room.value.localParticipant?.permissions?.canPublish) {
streamer = room.value.localParticipant
} else {
const remotePArray = Array.from(room.value.remoteParticipants.values())
    const adminId = import.meta.env.VITE_ADMIN_USER_ID;
console.log(`[STREAMING STORE] Buscando admin con ID: ${adminId}`);
   
streamer = remotePArray.find(
(p) => p.identity === import.meta.env.VITE_ADMIN_USER_ID,
)
console.log(`[STREAMING STORE] Admin encontrado:`, streamer ? streamer.identity : 'NO ENCONTRADO');


}
  console.log('[STREAM DEBUG] . Streamer encontrado:', streamer ? streamer.identity : 'Nadie'); // <--- AÑADIR ESTE LOG


if (streamer) {
if (adminParticipant.value?.sid !== streamer.sid) {
      console.log(`[STREAMING STORE] ¡Asignando nuevo admin participant! SID: ${streamer.sid}`);
 
adminParticipant.value = streamer
}
} else {
if (adminParticipant.value) {
     console.log(`[STREAMING STORE] El admin se ha ido, limpiando participant.`);
  
adminParticipant.value = null
}
}
}

const _onTrackPublished = (pub: TrackPublication, participant: Participant) => {
if (
participant.isLocal ||
participant.identity === import.meta.env.VITE_ADMIN_USER_ID
) {
if (pub.source === Track.Source.ScreenShare) {
isScreenSharing.value = true
}
_broadcastStreamState()
}
adminParticipant.value = participant
}

const _onTrackUnpublished = (pub: TrackPublication, participant: Participant) => {
if (
participant.isLocal ||
participant.identity === import.meta.env.VITE_ADMIN_USER_ID
) {
if (pub.source === Track.Source.ScreenShare) {
isScreenSharing.value = false
isCameraFullScreen.value = false
}
_broadcastStreamState()
}
adminParticipant.value = participant
}

const _setupRoomListeners = (newRoom: Room) => {
  newRoom
    .on(RoomEvent.ParticipantConnected, (p) => {
      nextTick(_updateRoomState);
      if (newRoom.localParticipant.permissions?.canPublish) {
        if (p.identity !== import.meta.env.VITE_ADMIN_USER_ID) {
          setTimeout(() => {
            _broadcastStreamState();
          }, 500);
        }
      }
    })
    .on(RoomEvent.ParticipantDisconnected, () => nextTick(_updateRoomState))
    .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      console.log('[STREAM DEBUG] Estado de conexión de LiveKit cambió a:', state);
      if (state === ConnectionState.Connected) {
        isConnecting.value = false;
        localParticipant.value = newRoom.localParticipant;
        if (newRoom.localParticipant.permissions?.canPublish) {
          fetchMediaDevices();
          newRoom.on(RoomEvent.MediaDevicesChanged, fetchMediaDevices);
        }
        nextTick(_updateRoomState);
      } else if (state === ConnectionState.Disconnected) {
        _resetState();
      }
    })
    .on(RoomEvent.TrackSubscribed, () => nextTick(_updateRoomState))
    .on(RoomEvent.TrackUnsubscribed, () => nextTick(_updateRoomState))
    .on(RoomEvent.LocalTrackPublished, _onTrackPublished)
    .on(RoomEvent.LocalTrackUnpublished, _onTrackUnpublished)
    .on(RoomEvent.TrackPublished, _onTrackPublished)
    .on(RoomEvent.TrackUnpublished, _onTrackUnpublished)
    .on(RoomEvent.DataReceived, (payload, participant) => {
      if (participant?.identity === import.meta.env.VITE_ADMIN_USER_ID) {
        const message = textDecoder.decode(payload);
        const { topic, data } = JSON.parse(message);

        if (topic === STREAM_STATE_UPDATE_TOPIC) {
          isScreenSharing.value = data.isScreenSharing;
          isCameraFullScreen.value = data.isCameraFullScreen;
          cameraOverlayPosition.value = data.cameraOverlayPosition;
          cameraOverlaySize.value = data.cameraOverlaySize;
        }
      }
    });
};

const _resetState = () => {
room.value = null
localParticipant.value = null
remoteParticipants.value = new Map()
adminParticipant.value = null
participantCount.value = 0
isLive.value = false
isStreamLive.value = false
isRecording.value = false
isScreenSharing.value = false
egressId.value = null
isConnecting.value = false
isPublishing.value = false
isDisconnecting.value = false
isCameraOverlayEnabled.value = true
isCameraFullScreen.value = false
cameraOverlayPosition.value = { x: 20, y: 20 }
cameraOverlaySize.value = { width: 25 }
}

async function fetchMediaDevices() {
try {
const devices = await Room.getLocalDevices('audioinput', true)
availableMics.value = devices.map((d: MediaDeviceInfo) => ({
id: d.deviceId,
label: d.label || `Micrófono ${availableMics.value.length + 1}`,
}))
const videoDevices = await Room.getLocalDevices('videoinput', true)
availableCameras.value = videoDevices.map((d: MediaDeviceInfo) => ({
id: d.deviceId,
label: d.label || `Cámara ${availableCameras.value.length + 1}`,
}))

if (!activeMicId.value && availableMics.value.length > 0) {
activeMicId.value = availableMics.value[0].id
}
if (!activeCameraId.value && availableCameras.value.length > 0) {
activeCameraId.value = availableCameras.value[0].id
}
} catch (error) {
console.error('Error al obtener dispositivos de medios:', error)
}
}

async function connectWithoutPublishing() {
if (isConnecting.value || room.value) return
isConnecting.value = true
const uiStore = useUiStore()
try {
await fetchMediaDevices()
const response = await api.get('/streaming/token')
const token = response.data.token
if (!token) throw new Error('No se pudo obtener el token de admin')

const newRoom = new Room({
adaptiveStream: true,
dynacast: true,
publishDefaults: { videoCodec: 'vp8' },
})
room.value = newRoom

_setupRoomListeners(room.value)

await room.value.connect(import.meta.env.VITE_LIVEKIT_URL, token, {
autoSubscribe: true,
})
} catch (error) {
console.error('Falló el proceso de conexión:', error)
uiStore.showToast({
message: 'Error al iniciar el stream.',
color: '#ef4444',
})
_resetState()
} finally {
isConnecting.value = false
}
}

async function startPublishing() {
if (!room.value || !room.value.localParticipant || isPublishing.value) return
const uiStore = useUiStore()
try {
await room.value.localParticipant.setCameraEnabled(true, {
deviceId: activeCameraId.value,
})
await room.value.localParticipant.setMicrophoneEnabled(true, {
deviceId: activeMicId.value,
})
isPublishing.value = true
} catch (error) {
console.error('Falló al publicar el stream:', error)
uiStore.showToast({
message: 'Error al empezar a transmitir.',
color: '#ef4444',
})
isPublishing.value = false
}
}

async function stopPublishing() {
if (!room.value || !room.value.localParticipant || !isPublishing.value) return
const uiStore = useUiStore()
try {
if (isScreenSharing.value) {
await room.value.localParticipant.setScreenShareEnabled(false)
isScreenSharing.value = false
}
await room.value.localParticipant.setCameraEnabled(false)
await room.value.localParticipant.setMicrophoneEnabled(false)
isPublishing.value = false
} catch (error) {
console.error('Falló al detener la publicación:', error)
uiStore.showToast({
message: 'Error al detener la transmisión.',
color: '#ef4444',
})
}
}

async function goLive() {
const uiStore = useUiStore()
try {
await api.post('/streaming/start')
isStreamLive.value = true
isLive.value = true
_broadcastStreamState()
} catch (error) {
console.error('Falló al iniciar el stream público:', error)
uiStore.showToast({
message: 'Error al iniciar la transmisión pública.',
color: '#ef4444',
})
}
}

async function endStream() {
const uiStore = useUiStore()
try {
await api.post('/streaming/stop')
isStreamLive.value = false
isLive.value = false
_broadcastStreamState()
} catch (error) {
console.error('Falló al detener el stream público:', error)
uiStore.showToast({
message: 'Error al detener la transmisión pública.',
color: '#ef4444',
})
}
}

async function connectToView() {
if (isConnecting.value || room.value) return
  console.log('[STREAM DEBUG] 1. Iniciando conexión como espectador...'); // <--- AÑADIR ESTE LOG
 
isConnecting.value = true
const uiStore = useUiStore()
try {
const response = await api.get('/streaming/token?viewer=true')
const token = response.data.token
    console.log('[STREAM DEBUG] 2. Token de espectador recibido.'); // <--- AÑADIR ESTE LOG
 
if (!token) throw new Error('No se pudo obtener el token de espectador')

const newRoom = new Room({
adaptiveStream: true,
dynacast: true,
})
room.value = newRoom

_setupRoomListeners(room.value)
    console.log('[STREAM DEBUG] 3. Conectando a la sala de LiveKit...'); // <--- AÑADIR ESTE LOG
 
await room.value.connect(import.meta.env.VITE_LIVEKIT_URL, token)
} catch (error) {
       console.error('[STREAM DEBUG] ERROR FATAL en connectToView:', error); // <--- AÑADIR ESTE LOG
   
console.error('Falló la conexión como espectador:', error)
uiStore.showToast({
message: 'No se pudo conectar al stream.',
color: '#ef4444',
})
_resetState()
} finally {
isConnecting.value = false
}
}

async function disconnect() {
  if (!room.value || isDisconnecting.value) return;

  console.log('[STREAMING STORE] Iniciando proceso de desconexión...');
  isDisconnecting.value = true;
  
  try {
    const isAdminStream = room.value.localParticipant?.permissions?.canPublish;
    
    if (isAdminStream) {
      if (isRecording.value) {
        console.log('[STREAMING STORE] Deteniendo grabación como parte de la desconexión...');
        await stopRecording();
      }
      if (isStreamLive.value) {
        console.log('[STREAMING STORE] Deteniendo stream EN VIVO como parte de la desconexión...');
        await endStream();
      }
    }
    
    await room.value.disconnect();
    console.log('[STREAMING STORE] Desconexión de la sala de LiveKit completada.');

  } catch (error) {
    console.error('Error durante el proceso de desconexión:', error);
  } finally {
    console.log('[STREAMING STORE] Reseteando estado local de la tienda.');
    _resetState();
    isDisconnecting.value = false; 
  }
}

function listenToStreamStatus() {
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel('public-events')
    .on('broadcast', { event: 'stream-status-change' }, ({ payload }) => {
      console.log('[REALTIME] Recibido evento de broadcast:', payload);
      isLive.value = payload.isLive;
      if (!payload.isLive && room.value && !room.value.localParticipant?.permissions?.canPublish) {
        disconnect();
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[REALTIME] Suscripción exitosa. Verificando estado inicial del stream...');
        checkInitialStreamStatus();
      }
    });
}

async function checkInitialStreamStatus() {
try {
const response = await api.get('/streaming/status')
if (response.data.success) {
isLive.value = response.data.data.is_live
isStreamLive.value = response.data.data.is_live
}
} catch (error) {
console.error(
'No se pudo verificar el estado inicial del stream:',
error,
)
}
}

function unsubscribeFromStreamStatus() {
    if (realtimeChannel) {
      console.log('[REALTIME] Desuscribiendo del canal de eventos.');
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

async function toggleCamera(enabled: boolean) {
if (room.value?.localParticipant)
await room.value.localParticipant.setCameraEnabled(enabled)
}

async function toggleMicrophone(enabled: boolean) {
if (room.value?.localParticipant)
await room.value.localParticipant.setMicrophoneEnabled(enabled)
}

async function changeCamera(deviceId: string) {
if (room.value && room.value.localParticipant?.isCameraEnabled) {
await room.value.switchActiveDevice('videoinput', deviceId)
activeCameraId.value = deviceId
}
}

async function changeMicrophone(deviceId: string) {
if (room.value && room.value.localParticipant?.isMicrophoneEnabled) {
await room.value.switchActiveDevice('audioinput', deviceId)
activeMicId.value = deviceId
}
}

async function startRecording() {
const uiStore = useUiStore()
try {
const { data } = await api.post('/streaming/record/start', {
title: 'Nuevo Stream',
description: 'Grabación en vivo',
})
egressId.value = data.egressId
isRecording.value = true
uiStore.showToast({ message: 'Grabación iniciada.', color: '#10b981' })
} catch (error) {
console.error('Error al iniciar grabación:', error)
uiStore.showToast({
message: 'Error al iniciar la grabación.',
color: '#ef4444',
})
}
}

async function stopRecording() {
if (!egressId.value) return
const uiStore = useUiStore()
try {
await api.post('/streaming/record/stop', { egressId: egressId.value })
egressId.value = null
isRecording.value = false
uiStore.showToast({ message: 'Grabación detenida.', color: '#6b7280' })
} catch (error) {
console.error('Error al detener grabación:', error)
uiStore.showToast({
message: 'Error al detener la grabación.',
color: '#ef4444',
})
}
}

async function toggleScreenShare() {
if (!room.value?.localParticipant) return

if (isScreenSharing.value) {
await room.value.localParticipant.setScreenShareEnabled(false)
isScreenSharing.value = false
isCameraFullScreen.value = false
_broadcastStreamState()
return
}

try {
await room.value.localParticipant.setScreenShareEnabled(true, {
audio: true,
})
isScreenSharing.value = true
_broadcastStreamState()
} catch (error) {
console.error('Falló al intentar compartir pantalla:', error)
const uiStore = useUiStore()
uiStore.showToast({
message: 'No se pudo iniciar la compartición de pantalla.',
color: '#ef4444',
})
isScreenSharing.value = false
_broadcastStreamState()
}
}

async function toggleCameraFullScreen() {
if (!room.value?.localParticipant) return
isCameraFullScreen.value = !isCameraFullScreen.value
_broadcastStreamState()
}

async function updateCameraOverlayPosition(pos: { x: number; y: number }) {
if (!room.value?.localParticipant) return
cameraOverlayPosition.value = pos
_broadcastStreamState()
}

async function updateCameraOverlaySize(size: { width: number }) {
if (!room.value?.localParticipant) return
cameraOverlaySize.value = size
_broadcastStreamState()
}

async function setOverlayPosition(
positionName: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
) {
let newPosition
const width = cameraOverlaySize.value.width
const height = (width * 9) / 16
switch (positionName) {
case 'top-left':
newPosition = { x: 2, y: 3 }
break
case 'top-right':
newPosition = { x: 98 - width, y: 3 }
break
case 'bottom-left':
newPosition = { x: 2, y: 97 - height }
break
case 'bottom-right':
newPosition = { x: 98 - width, y: 97 - height }
break
default:
return
}
await updateCameraOverlayPosition(newPosition)
}

async function setOverlaySize(size: 'small' | 'medium' | 'large') {
let newSize
switch (size) {
case 'small':
newSize = { width: 20 }
break
case 'medium':
newSize = { width: 25 }
break
case 'large':
newSize = { width: 30 }
break
default:
return
}
await updateCameraOverlaySize(newSize)
}

return {
isLive,
isStreamLive,
isConnecting,
isPublishing,
isDisconnecting,
isRecording,
isScreenSharing,
isCameraOverlayEnabled,
isCameraFullScreen,
room,
localParticipant,
remoteParticipants,
participantCount,
availableMics,
availableCameras,
activeMicId,
activeCameraId,
adminParticipant,
cameraOverlayPosition,
cameraOverlaySize,
localScreenSharePublication,
connectWithoutPublishing,
startPublishing,
stopPublishing,
goLive,
endStream,
connectToView,
disconnect,
listenToStreamStatus,
toggleCamera,
toggleMicrophone,
changeCamera,
changeMicrophone,
startRecording,
stopRecording,
checkInitialStreamStatus,
toggleScreenShare,
toggleCameraFullScreen,
updateCameraOverlayPosition,
updateCameraOverlaySize,
setOverlayPosition,
setOverlaySize,
setLiveStatus,
unsubscribeFromStreamStatus,
}
})