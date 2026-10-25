import { ref, watch, type Ref } from 'vue'
import { Room, RoomEvent } from 'livekit-client'

const CAMERA_OVERLAY_POSITION_TOPIC = 'camera-overlay-position'
const CAMERA_OVERLAY_SIZE_TOPIC = 'camera-overlay-size'
const CAMERA_FULLSCREEN_TOGGLE_TOPIC = 'camera-fullscreen-toggle'
const CAMERA_OVERLAY_TOGGLE_TOPIC = 'camera-overlay-toggle'
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function useCameraOverlay(room: Ref<Room | null>) {
  const cameraOverlayPosition = ref({ x: 20, y: 20 })
  const cameraOverlaySize = ref({ width: 25 })
  const isCameraOverlayEnabled = ref(true)
  const isCameraFullScreen = ref(false)

  const _sendData = async (topic: string, data: object) => {
    if (!room.value?.localParticipant) return
    const payload = textEncoder.encode(JSON.stringify({ topic, data }))
    await room.value.localParticipant.publishData(payload, { reliable: true })
  }

  watch(room, (newRoom) => {
    if (newRoom) {
      newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        if (participant?.identity === import.meta.env.VITE_ADMIN_USER_ID) {
          const message = textDecoder.decode(payload)
          const { topic, data } = JSON.parse(message)
          switch (topic) {
            case CAMERA_OVERLAY_POSITION_TOPIC:
              cameraOverlayPosition.value = data
              break
            case CAMERA_OVERLAY_SIZE_TOPIC:
              cameraOverlaySize.value = data
              break
            case CAMERA_FULLSCREEN_TOGGLE_TOPIC:
              isCameraFullScreen.value = data.isFullScreen
              break
            case CAMERA_OVERLAY_TOGGLE_TOPIC:
              isCameraOverlayEnabled.value = data.enabled
              break
          }
        }
      })
    }
  })

  const toggleCameraOverlay = async (enabled: boolean) => {
    isCameraOverlayEnabled.value = enabled
    await _sendData(CAMERA_OVERLAY_TOGGLE_TOPIC, { enabled })
  }

  const toggleCameraFullScreen = async () => {
    const newFullScreenState = !isCameraFullScreen.value
    isCameraFullScreen.value = newFullScreenState
    await _sendData(CAMERA_FULLSCREEN_TOGGLE_TOPIC, {
      isFullScreen: newFullScreenState,
    })
  }

  const updateCameraOverlayPosition = async (pos: { x: number; y: number }) => {
    cameraOverlayPosition.value = pos
    await _sendData(CAMERA_OVERLAY_POSITION_TOPIC, pos)
  }

  const updateCameraOverlaySize = async (size: { width: number }) => {
    cameraOverlaySize.value = size
    await _sendData(CAMERA_OVERLAY_SIZE_TOPIC, size)
  }

  const setOverlayPosition = async (
    positionName: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  ) => {
    let newPosition
    switch (positionName) {
      case 'top-left':
        newPosition = { x: 5, y: 5 }
        break
      case 'top-right':
        newPosition = { x: 75, y: 5 }
        break
      case 'bottom-left':
        newPosition = { x: 5, y: 75 }
        break
      case 'bottom-right':
        newPosition = { x: 75, y: 75 }
        break
      default:
        return
    }
    await updateCameraOverlayPosition(newPosition)
  }

  const setOverlaySize = async (size: 'small' | 'medium' | 'large') => {
    let newSize
    switch (size) {
      case 'small':
        newSize = { width: 10 }
        break
      case 'medium':
        newSize = { width: 20 }
        break
      case 'large':
        newSize = { width: 35 }
        break
      default:
        return
    }
    await updateCameraOverlaySize(newSize)
  }

  return {
    cameraOverlayPosition,
    cameraOverlaySize,
    isCameraOverlayEnabled,
    isCameraFullScreen,
    toggleCameraOverlay,
    toggleCameraFullScreen,
    updateCameraOverlayPosition,
    updateCameraOverlaySize,
    setOverlayPosition,
    setOverlaySize,
  }
}
