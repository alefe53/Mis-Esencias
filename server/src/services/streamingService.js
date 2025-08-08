import { AccessToken, RoomServiceClient, EgressClient } from 'livekit-server-sdk';
import { config } from '../config/config.js';

const roomService = new RoomServiceClient(config.livekit.URL, config.livekit.API_KEY, config.livekit.API_SECRET);
const egressClient = new EgressClient(config.livekit.URL, config.livekit.API_KEY, config.livekit.API_SECRET);
const ROOM_NAME = 'comunidad-fenicia-live';

export const generateToken = async (participantIdentity, participantName, isAdmin = false) => {
    if (!config.livekit.API_KEY || !config.livekit.API_SECRET) {
        console.error("[STREAMING ERROR] API Key o API Secret de LiveKit no están definidas en el backend.");
        return;
    }

    const at = new AccessToken(config.livekit.API_KEY, config.livekit.API_SECRET, {
        identity: participantIdentity,
        name: participantName,
    });

    at.addGrant({
        room: ROOM_NAME,
        roomJoin: true,
        canPublish: isAdmin,
        canSubscribe: true,
        canPublishData: true,
    });

    const jwtToken = await at.toJwt();
    
    return jwtToken;
};

export const startRecording = async () => {
    const s3_output = {
        accessKey: process.env.SUPABASE_S3_ACCESS_KEY,
        secret: process.env.SUPABASE_S3_SECRET_KEY,
        region: process.env.SUPABASE_S3_REGION,
        bucket: 'live-streaming',
        endpoint: `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/s3`,
    };

    try {
        const egressInfo = await egressClient.startRoomCompositeEgress(ROOM_NAME, {
            file: { filepath: `recordings/${ROOM_NAME}-${Date.now()}.mp4` },
        }, { s3: s3_output });

        return egressInfo;
    } catch (error) {
        console.error("ERROR CRÍTICO AL INICIAR EGRESS DE LIVEKIT:", error);
        throw new Error("LiveKit falló al intentar iniciar la grabación. Revisa las credenciales de S3 y las políticas del bucket.");
    }
};

export const stopRecording = async (egressId) => {
    const egressInfo = await egressClient.stopEgress(egressId);
    return egressInfo;
};

export const getRoomParticipants = async () => {
    const participants = await roomService.listParticipants(ROOM_NAME);
    return participants;
};