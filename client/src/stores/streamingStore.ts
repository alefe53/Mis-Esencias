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
const isCameraTogglePending = ref(false)

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
  const isIntentionalDisconnect = ref(false)

  const isCameraTogglePending = ref(false)
  const isCameraEnabled = ref(false)
  const isMicrophoneEnabled = ref(false)

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
    // Si es track local publicado, actualizamos los estados reactivos.
    if (participant.isLocal) {
      // screen share
      if (pub.source === Track.Source.ScreenShare) {
        isScreenSharing.value = true
        console.log('[store] LocalTrackPublished', {
          source: pub.source,
          participant: participant.identity,
        })
      }
      // cámara
      if (pub.source === Track.Source.Camera) {
        isCameraEnabled.value = true
        console.log('[store] LocalTrackPublished', {
          source: pub.source,
          participant: participant.identity,
        })
      }
      // micrófono (al publicar audio local)
      if (pub.track?.kind === 'audio') {
        isMicrophoneEnabled.value = true
      }
      _broadcastStreamState()
    } else if (participant.identity === import.meta.env.VITE_ADMIN_USER_ID) {
      // si administradores remotos publican screen share
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
        isCameraFullScreen.value = false
      }
      if (pub.source === Track.Source.Camera) {
        isCameraEnabled.value = false
      }
      if (pub.track?.kind === 'audio') {
        isMicrophoneEnabled.value = false
      }
      _broadcastStreamState()
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
          isCameraEnabled.value = !!newRoom.localParticipant?.isCameraEnabled
          isMicrophoneEnabled.value =
            !!newRoom.localParticipant?.isMicrophoneEnabled

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
  async function intentionallyDisconnect() {
    isIntentionalDisconnect.value = true
    await disconnect()
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
    isIntentionalDisconnect.value = false
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
      if (room.value.localParticipant?.permissions?.canPublish) {
        if (isStreamLive.value) {
          await endStream()
        }
      }
      await room.value.disconnect()
    } catch (error) {
      console.error('Error durante el proceso de desconexión:', error)
    } finally {
      _resetState()
      // isDisconnecting ya se resetea en _resetState, pero lo dejamos por claridad
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

  // streamingStore.ts - reemplazar toggleCamera
  const cameraToggleWaitTimeoutMs = 4000

  async function toggleCamera(enabled: boolean) {
    if (!room.value?.localParticipant) return
    const uiStore = useUiStore()

    // Si ya en el estado deseado, no hacemos nada
    if (isCameraEnabled.value === enabled) return

    // Marcamos pendiente para la UI si hace falta
    isCameraTogglePending.value = true

    // Preparar un listener temporal para capturar LocalTrackPublished de la cámara
    let settled = false
    const onLocalTrackPublished = (pub: any, participant: any) => {
      try {
        if (participant?.isLocal && pub?.source === Track.Source.Camera) {
          isCameraEnabled.value = true
          settled = true
        }
      } catch {}
    }
    // si hay evento local en room
    try {
      room.value.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished)
    } catch {}

    try {
      // Llamada al SDK
      await room.value.localParticipant.setCameraEnabled(enabled, {
        deviceId: activeCameraId.value || undefined,
      })

      // Esperamos que el evento LocalTrackPublished confirme el estado
      const start = Date.now()
      while (!settled && Date.now() - start < cameraToggleWaitTimeoutMs) {
        await new Promise((r) => setTimeout(r, 100))
      }

      // Si no se resolvió por evento, consultamos el estado final del SDK
      isCameraEnabled.value = !!room.value.localParticipant?.isCameraEnabled

      // Broadcast del estado por si queremos sincronizar overlays
      await _broadcastStreamState()
    } catch (error) {
      console.error('toggleCamera error:', error)
      uiStore.showToast({
        message: 'No se pudo cambiar el estado de la cámara.',
        color: '#ef4444',
      })
      // revertir si algo
      isCameraEnabled.value = !!room.value.localParticipant?.isCameraEnabled
    } finally {
      try {
        room.value.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished)
      } catch {}
      isCameraTogglePending.value = false
    }
  }

  async function toggleMicrophone(enabled: boolean) {
    if (room.value?.localParticipant) {
      await room.value.localParticipant.setMicrophoneEnabled(enabled)
    }
  }

  async function changeCamera(deviceId: string) {
    activeCameraId.value = deviceId

    if (room.value && room.value.localParticipant?.isCameraEnabled) {
      try {
        await room.value.switchActiveDevice('videoinput', deviceId)
      } catch (err) {
        console.error('Error al cambiar dispositivo de cámara:', err)
      }
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
    const uiStore = useUiStore()
    const isCurrentlySharing = room.value.localParticipant.isScreenShareEnabled

    try {
      if (isCurrentlySharing) {
        await room.value.localParticipant.setScreenShareEnabled(false)
        // dejar que el evento LocalTrackUnpublished sincronice isScreenSharing
      } else {
        const wasCameraEnabled = room.value.localParticipant.isCameraEnabled

        await room.value.localParticipant.setScreenShareEnabled(true, {
          audio: true,
        })

        // en algunos navegadores iniciar screenShare puede «apagar» la cámara;
        // reintentamos reactivar si antes estaba prendida.
        if (wasCameraEnabled) {
          // esperamos a que el SDK estabilice los tracks y luego reactivamos
          await new Promise((r) => setTimeout(r, 300))
          // reintentar hasta 3 veces si no se publicó la cámara
          let attempts = 0
          while (
            attempts < 3 &&
            room.value.localParticipant &&
            !room.value.localParticipant.isCameraEnabled
          ) {
            attempts++
            try {
              await room.value.localParticipant.setCameraEnabled(true, {
                deviceId: activeCameraId.value || undefined,
              })
              // esperar un ratito y comprobar
              await new Promise((r) => setTimeout(r, 200))
            } catch (err) {
              console.warn(
                'Reintento para activar cámara tras screen share falló',
                err,
              )
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Falló al cambiar el estado de compartir pantalla:', error)
      if (error.name === 'NotAllowedError') {
        uiStore.showToast({
          message: 'Permiso para compartir pantalla denegado.',
          color: '#f97316',
        })
        if (isScreenSharing.value) {
          isScreenSharing.value = false
          _broadcastStreamState()
        }
      } else {
        uiStore.showToast({
          message: 'No se pudo iniciar la compartición de pantalla.',
          color: '#ef4444',
        })
      }
    }
  }

  async function toggleCameraFullScreen() {
    if (!room.value?.localParticipant) return
    isCameraFullScreen.value = !isCameraFullScreen.value
    await _broadcastStreamState()
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
    isCameraEnabled,
    isMicrophoneEnabled,
    isIntentionalDisconnect,
    isCameraTogglePending,
    intentionallyDisconnect,
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
