//src/controllers/streamingController.js
import { generateToken, startRecording, stopRecording, getRoomParticipants } from '../services/streamingService.js';
import * as streamingRepository from '../repositories/streamingRepository.js';
import { broadcastRealtimeEvent } from '../utils/supabaseUtils.js';

export const getStreamingToken = async (req, res, next) => {
    try {
        const { user } = req;
        const isAdmin = user?.id === process.env.ADMIN_USER_ID;
        const isViewerRequest = req.query.viewer === 'true';

        let participantIdentity = user?.id || `guest_${Date.now()}`;
        let participantName = user ? `${user.first_name} ${user.last_name}` : 'Invitado';

        if (isAdmin && isViewerRequest) {
            participantIdentity = `${user.id}_viewer`;
            participantName = `${participantName} (View)`;
        }

        const token = await generateToken(participantIdentity, participantName, isAdmin && !isViewerRequest);
        
        if (!token) {
            console.error("[Controller Error] generateToken devolvió un valor nulo o indefinido.");
            return res.status(500).json({ success: false, message: 'Error interno al generar el token.' });
        }
        
        res.status(200).json({ success: true, token: token });

    } catch (error) {
        console.error("[Controller Error] Ocurrió una excepción en getStreamingToken:", error);
        next(error);
    }
};

export const startStream = async (req, res, next) => {
    try {
        await streamingRepository.setStreamStatusInDB(true);
        await broadcastRealtimeEvent('public-events', 'stream-status-change', { isLive: true });
        res.status(200).json({ success: true, message: 'Stream iniciado.' });
    } catch (error) {
        next(error);
    }
};

export const stopStream = async (req, res, next) => {
    try {
        await streamingRepository.setStreamStatusInDB(false);
        await broadcastRealtimeEvent('public-events', 'stream-status-change', { isLive: false });
        res.status(200).json({ success: true, message: 'Stream detenido.' });
    } catch (error) {
        next(error);
    }
};

export const getStreamStatus = async (req, res, next) => {
    try {
        const status = await streamingRepository.getStreamStatusFromDB();
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        next(error);
    }
};

export const handleStartRecording = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const authToken = req.headers.authorization.split(" ")[1];

        const egressInfo = await startRecording();

        if (!egressInfo || !egressInfo.egressId) {
            throw new Error("La información de Egress de LiveKit no se recibió correctamente.");
        }

        await streamingRepository.createSessionInDB(authToken, title, description, egressInfo.egressId);

        res.status(200).json({ success: true, egressId: egressInfo.egressId });
    } catch (error) {
        next(error);
    }
};

export const handleStopRecording = async (req, res, next) => {
    try {
        const { egressId } = req.body;
        const authToken = req.headers.authorization.split(" ")[1];

        const egressInfo = await stopRecording(egressId);

        if (egressInfo.status === 'EGRESS_COMPLETE' && egressInfo.file) {
             const duration = Math.round((egressInfo.endedAt - egressInfo.startedAt) / 1000);
             const storagePath = egressInfo.file.location;
             await streamingRepository.endSessionInDB(authToken, egressId, storagePath, duration);
        }

        res.status(200).json({ success: true, message: 'Grabación detenida exitosamente.' });
    } catch (error) {
        next(error);
    }
};

export const getParticipantCount = async (req, res, next) => {
    try {
        const participants = await getRoomParticipants();
        res.status(200).json({ success: true, count: participants.length });
    } catch (error) {
        next(error);
    }
};