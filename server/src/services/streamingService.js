import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
} from 'livekit-server-sdk'
import { config } from '../config/config.js'

const roomService = new RoomServiceClient(
  config.livekit.URL,
  config.livekit.API_KEY,
  config.livekit.API_SECRET,
)
const egressClient = new EgressClient(
  config.livekit.URL,
  config.livekit.API_KEY,
  config.livekit.API_SECRET,
)
const ROOM_NAME = 'comunidad-fenicia-live'

export const generateToken = async (
  participantIdentity,
  participantName,
  isAdmin = false,
) => {
  if (!config.livekit.API_KEY || !config.livekit.API_SECRET) {
    console.error(
      '[STREAMING ERROR] API Key o API Secret de LiveKit no están definidas en el backend.',
    )
    return
  }

  const at = new AccessToken(
    config.livekit.API_KEY,
    config.livekit.API_SECRET,
    {
      identity: participantIdentity,
      name: participantName,
    },
  )

  at.addGrant({
    room: ROOM_NAME,
    roomJoin: true,
    canPublish: isAdmin,
    canSubscribe: true,
    canPublishData: true,
  })

  const jwtToken = await at.toJwt()

  return jwtToken
}

export const startRecording = async () => {
  console.log('--- Iniciando Proceso de Grabación (Backend) ---')

  if (!process.env.SUPABASE_S3_ACCESS_KEY) {
    console.error(
      '¡ERROR FATAL! Las variables de S3 no están definidas. Revisa tu archivo .env',
    )
    throw new Error('Configuración del servidor incompleta para la grabación.')
  }

  const s3Config = {
    accessKey: process.env.SUPABASE_S3_ACCESS_KEY,
    secret: process.env.SUPABASE_S3_SECRET_KEY,
    region: process.env.SUPABASE_S3_REGION,
    bucket: 'live-streaming',
    endpoint: `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/s3`,
    forcePathStyle: true,
  }

  // Estructura final y correcta de la solicitud
  const request = {
    roomName: ROOM_NAME,
    output: {
      file: {
        filepath: `recordings/${ROOM_NAME}-${Date.now()}.mp4`,
        s3: s3Config,
      },
    },
  }

  console.log('Objeto de solicitud final enviado a LiveKit:', {
    ...request,
    output: {
      ...request.output,
      file: {
        ...request.output.file,
        s3: { ...request.output.file.s3, secret: '***SECRETO OCULTO***' },
      },
    },
  })

  try {
    console.log('Enviando solicitud a EgressClient...')
    // La llamada ahora solo toma UN argumento: el objeto de solicitud completo
    const egressInfo = await egressClient.startRoomCompositeEgress(request)

    console.log('¡Solicitud a EgressClient exitosa!', egressInfo)
    return egressInfo
  } catch (error) {
    console.error('ERROR CRÍTICO AL INICIAR EGRESS DE LIVEKIT:', error)
    throw new Error(
      'LiveKit falló al intentar iniciar la grabación. El formato de la solicitud es incorrecto o las credenciales son inválidas.',
    )
  }
}

export const stopRecording = async (egressId) => {
  const egressInfo = await egressClient.stopEgress(egressId)
  return egressInfo
}

export const getRoomParticipants = async () => {
  const participants = await roomService.listParticipants(ROOM_NAME)
  return participants
}