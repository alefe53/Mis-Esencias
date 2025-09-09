// RUTA: src/stores/streamingStore.ts
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
  // --- ESTADO CENTRALIZADO ---
  const room = shallowRef<Room | null>(null)
  let realtimeChannel: RealtimeChannel | null = null

  const isLive = ref(false)
  const isStreamLive = ref(false)
  const isConnecting = ref(false)
  const isPublishing = ref(false)
  const isDisconnecting = ref(false)
  const isRecording = ref(false)
  const isScreenSharing = ref(false) // <-- ÚNICA FUENTE DE VERDAD
  const egressId = ref<string | null>(null)

  const isCameraOverlayEnabled = ref(true)

  const localParticipant = shallowRef<LocalParticipant | null>(null)
  const remoteParticipants = shallowRef<Map<string, RemoteParticipant>>(
    new Map(),
  )
  const adminParticipant = shallowRef<Participant | null>(null)

  const participantCount = ref(0)
  const cameraOverlayPosition = ref({ x: 78, y: 78 }) // Posición inicial más común
  const cameraOverlaySize = ref({ width: 20 })
  const isCameraFullScreen = ref(false)

  const availableMics = ref<DeviceInfo[]>([])
  const availableCameras = ref<DeviceInfo[]>([])
  const activeMicId = ref<string>('')
  const activeCameraId = ref<string>('')

  function setLiveStatus(status: boolean) {
    console.log(`Cambiando estado isLive a: ${status} a través de una acción.`)
    isLive.value = status
  }

  // --- FUNCIONES INTERNAS (helpers) ---

  const _broadcastStreamState = async () => {
    if (!room.value?.localParticipant?.permissions?.canPublish) return
    const state = {
      isScreenSharing: isScreenSharing.value,
      isCameraFullScreen: isCameraFullScreen.value,
      cameraOverlayPosition: cameraOverlayPosition.value,
      cameraOverlaySize: cameraOverlaySize.value,
    }
    const payload = textEncoder.encode(
      JSON.stringify({ topic: STREAM_STATE_UPDATE_TOPIC, data: state }),
    )
    await room.value.localParticipant.publishData(payload, { reliable: true })
  }

  const _updateRoomState = () => {
    if (!room.value) return
    remoteParticipants.value = new Map(room.value.remoteParticipants)
    participantCount.value =
      room.value.remoteParticipants.size + (room.value.localParticipant ? 1 : 0)

    let streamer: Participant | undefined
    if (room.value.localParticipant?.permissions?.canPublish) {
      streamer = room.value.localParticipant
    } else {
      const remotePArray = Array.from(room.value.remoteParticipants.values())
      streamer = remotePArray.find(
        (p) => p.identity === import.meta.env.VITE_ADMIN_USER_ID,
      )
    }

    if (streamer) {
      if (adminParticipant.value?.sid !== streamer.sid) {
        adminParticipant.value = streamer
      }
    } else {
      if (adminParticipant.value) {
        adminParticipant.value = null
      }
    }
  }

  // ✨ CORRECCIÓN CLAVE: Los listeners ahora actualizan el estado central del store
  const _onTrackPublished = (
    pub: TrackPublication,
    participant: Participant,
  ) => {
    if (participant.isLocal) {
      if (pub.source === Track.Source.ScreenShare) {
        isScreenSharing.value = true
      }
      _broadcastStreamState() // Sincroniza con espectadores cada vez que algo se publica
    } else if (participant.identity === import.meta.env.VITE_ADMIN_USER_ID) {
      if (pub.source === Track.Source.ScreenShare) {
        isScreenSharing.value = true
      }
    }
  }

  const _onTrackUnpublished = (
    pub: TrackPublication,
    participant: Participant,
  ) => {
    if (participant.isLocal) {
      if (pub.source === Track.Source.ScreenShare) {
        isScreenSharing.value = false
        isCameraFullScreen.value = false // Resetea al dejar de compartir
      }
      _broadcastStreamState() // Sincroniza con espectadores
    } else if (participant.identity === import.meta.env.VITE_ADMIN_USER_ID) {
      if (pub.source === Track.Source.ScreenShare) {
        isScreenSharing.value = false
        isCameraFullScreen.value = false
      }
    }
  }

  const _setupRoomListeners = (newRoom: Room) => {
    newRoom
      .on(RoomEvent.ParticipantConnected, (p) => {
        nextTick(_updateRoomState)
        if (newRoom.localParticipant.permissions?.canPublish) {
          if (p.identity !== import.meta.env.VITE_ADMIN_USER_ID) {
            setTimeout(() => {
              _broadcastStreamState()
            }, 500)
          }
        }
      })
      .on(RoomEvent.ParticipantDisconnected, () => nextTick(_updateRoomState))
      .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) {
          isConnecting.value = false
          localParticipant.value = newRoom.localParticipant
          if (newRoom.localParticipant.permissions?.canPublish) {
            fetchMediaDevices()
            newRoom.on(RoomEvent.MediaDevicesChanged, fetchMediaDevices)
          }
          nextTick(_updateRoomState)
        } else if (state === ConnectionState.Disconnected) {
          _resetState()
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
          const message = textDecoder.decode(payload)
          const { topic, data } = JSON.parse(message)

          if (topic === STREAM_STATE_UPDATE_TOPIC) {
            isScreenSharing.value = data.isScreenSharing
            isCameraFullScreen.value = data.isCameraFullScreen
            cameraOverlayPosition.value = data.cameraOverlayPosition
            cameraOverlaySize.value = data.cameraOverlaySize
          }
        }
      })
  }

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
    isCameraFullScreen.value = false
    cameraOverlayPosition.value = { x: 78, y: 78 }
    cameraOverlaySize.value = { width: 20 }
  }

  // --- ACCIONES (Lógica principal) ---

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

  async function toggleCameraOverlay(enabled: boolean) {
    if (!room.value?.localParticipant) return
    isCameraOverlayEnabled.value = enabled
    await _broadcastStreamState() 
  }
  
  async function startPublishing() {
    if (!room.value || !room.value.localParticipant || isPublishing.value)
      return
    const uiStore = useUiStore()
    try {
      await room.value.localParticipant.setCameraEnabled(true, {
        deviceId: activeCameraId.value,
      })
      await room.value.localParticipant.setMicrophoneEnabled(true, {
        deviceId: activeMicId.value,
      })
      isPublishing.value = true
      isCameraOverlayEnabled.value = true
      await _broadcastStreamState()
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
    if (!room.value || !room.value.localParticipant || !isPublishing.value)
      return
    const uiStore = useUiStore()
    try {
      if (isScreenSharing.value) {
        await room.value.localParticipant.setScreenShareEnabled(false)
      }
      await room.value.localParticipant.setCameraEnabled(false)
      await room.value.localParticipant.setMicrophoneEnabled(false)
      isPublishing.value = false
      _broadcastStreamState()
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
    isConnecting.value = true
    const uiStore = useUiStore()
    try {
      const response = await api.get('/streaming/token?viewer=true')
      const token = response.data.token
      if (!token) throw new Error('No se pudo obtener el token de espectador')

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      room.value = newRoom

      _setupRoomListeners(room.value)
      await room.value.connect(import.meta.env.VITE_LIVEKIT_URL, token)
    } catch (error) {
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
    if (!room.value || isDisconnecting.value) return

    isDisconnecting.value = true

    try {
      const isAdminStream = room.value.localParticipant?.permissions?.canPublish

      if (isAdminStream) {
        if (isRecording.value) {
          await stopRecording()
        }
        if (isStreamLive.value) {
          await endStream()
        }
      }

      await room.value.disconnect()
    } catch (error) {
      console.error('Error durante el proceso de desconexión:', error)
    } finally {
      _resetState()
      isDisconnecting.value = false
    }
  }

  function listenToStreamStatus() {
    if (realtimeChannel) return

    realtimeChannel = supabase
      .channel('public-events')
      .on('broadcast', { event: 'stream-status-change' }, ({ payload }) => {
        isLive.value = payload.isLive
        if (
          !payload.isLive &&
          room.value &&
          !room.value.localParticipant?.permissions?.canPublish
        ) {
          disconnect()
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          checkInitialStreamStatus()
        }
      })
  }

  async function checkInitialStreamStatus() {
    try {
      const response = await api.get('/streaming/status')
      if (response.data.success) {
        isLive.value = response.data.data.is_live
        isStreamLive.value = response.data.data.is_live
      }
    } catch (error) {
      console.error('No se pudo verificar el estado inicial del stream:', error)
    }
  }

  function unsubscribeFromStreamStatus() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  async function toggleCamera(enabled: boolean) {
        if (!room.value?.localParticipant) return;
        
        try {
            await room.value.localParticipant.setCameraEnabled(enabled);
        } catch (error) {
            console.error("Error al cambiar el estado de la cámara:", error);
            const uiStore = useUiStore();
            uiStore.showToast({
                message: 'No se pudo cambiar el estado de la cámara.',
                color: '#ef4444',
            });
        }
    }

  async function toggleMicrophone(enabled: boolean) {
    if (room.value?.localParticipant) {
      await room.value.localParticipant.setMicrophoneEnabled(enabled)
    }
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
        if (!room.value?.localParticipant) return;
        const uiStore = useUiStore();
        const isCurrentlySharing = room.value.localParticipant.isScreenShareEnabled;

        try {
            if (isCurrentlySharing) {
                await room.value.localParticipant.setScreenShareEnabled(false);
            } else {
                const wasCameraEnabled = room.value.localParticipant.isCameraEnabled;

                await room.value.localParticipant.setScreenShareEnabled(true, {
                    audio: true, 
                });
                if (wasCameraEnabled && !room.value.localParticipant.isCameraEnabled) {
                    console.log('La compartición de pantalla desactivó la cámara. Reactivándola...');
                    await nextTick(); // 
                    await room.value.localParticipant.setCameraEnabled(true);
                }
            }
        } catch (error: any) {
            console.error('Falló al cambiar el estado de compartir pantalla:', error);
            if (error.name === 'NotAllowedError') {
                uiStore.showToast({
                    message: 'Permiso para compartir pantalla denegado.',
                    color: '#f97316',
                });
                if (isScreenSharing.value) {
                  isScreenSharing.value = false;
                  _broadcastStreamState();
                }
            } else {
                uiStore.showToast({
                    message: 'No se pudo iniciar la compartición de pantalla.',
                    color: '#ef4444',
                });
            }
        }
    }

  async function toggleCameraFullScreen() {
    if (!room.value?.localParticipant) return
    isCameraFullScreen.value = !isCameraFullScreen.value
    await _broadcastStreamState() // Notifica a todos del cambio
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
    isCameraOverlayEnabled,
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
    toggleCameraOverlay,
  }
})
