// src/utils/paypalApi.js
import axios from 'axios';
import { config } from '../config/config.js';

const base = config.paypal.MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const getAccessToken = async () => {

    // --- INICIO DE CÓDIGO DE DEPURACIÓN ---
    console.log("===== INICIANDO DEPURACIÓN DE PAYPAL =====");
    console.log(`[PAYPAL_DEBUG] Modo (config.paypal.MODE): ${config.paypal.MODE}`);
    console.log(`[PAYPAL_DEBUG] URL Base (base): ${base}`);
    console.log(`[PAYPAL_DEBUG] Client ID (config.paypal.CLIENT_ID): ${config.paypal.CLIENT_ID}`);
    
    // No mostramos el secreto completo por seguridad, solo verificamos si existe
    const secret = config.paypal.CLIENT_SECRET;
    if (secret) {
        console.log(`[PAYPAL_DEBUG] Client Secret: SÍ existe. Longitud: ${secret.length}`);
        console.log(`[PAYPAL_DEBUG] Primeros 5 chars del Secret: ${secret.substring(0, 5)}...`);
    } else {
        console.log("[PAYPAL_DEBUG] Client Secret: ¡¡¡NO EXISTE O ES NULO!!!");
    }
    // --- FIN DE CÓDIGO DE DEPURACIÓN ---

    const auth = Buffer.from(`${config.paypal.CLIENT_ID}:${config.paypal.CLIENT_SECRET}`).toString('base64');
    
    try {
        const response = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`,
            },
        });
        console.log("[PAYPAL_DEBUG] ¡Token de acceso obtenido con éxito!");
        console.log("=========================================");
        return response.data.access_token;
    } catch (error) {
        console.error("[PAYPAL_DEBUG] ¡Falló la obtención del token!");
        console.error("Error obteniendo token de PayPal:", error.response?.data || error.message);
        console.log("=========================================");
        throw new Error("No se pudo autenticar con PayPal.");
    }
};

export const createPayPalOrder = async (orderPayload) => {
    const accessToken = await getAccessToken();
    try {
        const response = await axios.post(`${base}/v2/checkout/orders`, orderPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creando orden en PayPal:", error.response?.data || error.message);
        throw new Error("No se pudo crear la orden de PayPal.");
    }
};

export const capturePayPalOrder = async (orderId) => {
    const accessToken = await getAccessToken();
    try {
        const response = await axios.post(`${base}/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error capturando orden de PayPal:", error.response?.data || error.message);
        throw new Error("No se pudo capturar el pago de PayPal.");
    }
};

export const verifyPayPalWebhook = async ({ headers, webhookEvent }) => {
     const accessToken = await getAccessToken();
    try {
        const response = await axios.post(`${base}/v1/notifications/verify-webhook-signature`, {
            auth_algo: headers['paypal-auth-algo'],
            cert_url: headers['paypal-cert-url'],
            transmission_id: headers['paypal-transmission-id'],
            transmission_sig: headers['paypal-transmission-sig'],
            transmission_time: headers['paypal-transmission-time'],
            webhook_id: config.paypal.WEBHOOK_ID,
            webhook_event: webhookEvent
        }, {
             headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data.verification_status === 'SUCCESS';
    } catch (error) {
        console.error("Error verificando webhook de PayPal:", error.response?.data || error.message);
        return false;
    }
};