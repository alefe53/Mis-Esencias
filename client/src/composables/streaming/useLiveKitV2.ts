// RUTA: src/composables/streaming/useLiveKitV2.ts

import { shallowRef } from 'vue';
import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client';
import type { StreamState } from './useStreamStateV2';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const STREAM_STATE_TOPIC = 'stream_state_v2';

/**
 * Composable para encapsular toda la lógica de interacción con LiveKit.
 */
export function useLiveKitV2(state: StreamState) {
  const room = shallowRef<Room | null>(null);
  
  // Función para transmitir el estado a los espectadores
  const broadcastState = async () => {
    if (room.value && room.value.localParticipant.permissions?.canPublishData) {
      const payload = textEncoder.encode(JSON.stringify(state));
      
      // --- CORRECCIÓN AQUÍ ---
      // La versión actual del SDK espera las opciones en un solo objeto.
      await room.value.localParticipant.publishData(payload, {
        reliable: true, // Reemplaza DataPacket_Kind.RELIABLE
        topic: STREAM_STATE_TOPIC,
      });
    }
  };

  // Lógica de conexión
  const connect = async (token: string) => {
    const newRoom = new Room({ adaptiveStream: true, dynacast: true });

    newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
      // Lógica para que los espectadores reciban el estado (lo usaremos en LiveStreamPlayerV2)
      if (participant?.identity === import.meta.env.VITE_ADMIN_USER_ID) {
        try {
          const receivedState = JSON.parse(textDecoder.decode(payload));
          Object.assign(state, receivedState);
        } catch (e) { console.error(e); }
      }
    });

    await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, token);
    room.value = newRoom;
    return newRoom;
  };

  // Lógica de desconexión
  const disconnect = async () => {
    await room.value?.disconnect();
    room.value = null;
  };

  return {
    room,
    connect,
    disconnect,
    broadcastState,
  };
}