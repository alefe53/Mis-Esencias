// RUTA: src/services/paymentService.js

import mercadopago from 'mercadopago';
const { MercadoPagoConfig, Preference, Payment, Webhook } = mercadopago;
import { config } from "../config/config.js";
import * as paymentRepository from "../repositories/paymentRepository.js";
import { createPayPalOrder, capturePayPalOrder as capturePayPalOrderApi, verifyPayPalWebhook } from '../utils/paypalApi.js';

const mpClient = new MercadoPagoConfig({ accessToken: config.mercadoPago.ACCESS_TOKEN });

class PaymentService {
    async createOrder({ user, tierId, provider, durationMonths }) {
        const tier = await paymentRepository.getTierById(tierId);
        if (!tier) {
            throw new Error("Nivel de suscripción no válido.");
        }

        const totalAmount = parseFloat((Number(tier.price) * durationMonths).toFixed(2));
        const itemName = `${tier.name} - ${durationMonths} mes(es)`;


        if (provider === "mercadopago") {
            const preference = new Preference(mpClient);

            const isSandbox = String(config.mercadoPago.ACCESS_TOKEN || '').startsWith('TEST-');

            const preferencePayload = {
                items: [{
                    id: String(tier.id),
                    title: itemName,
                    quantity: 1,
                    unit_price: totalAmount,
                    currency_id: 'USD'
                }],
                
                ...(!isSandbox && {
                    payer: {
                        email: user.email,
                        name: user.first_name,
                        surname: user.last_name
                    }
                }),

                back_urls: {
                    success: `${config.CORS_ORIGIN}/profile?payment=success`,
                    failure: `${config.CORS_ORIGIN}/profile?payment=failure`,
                    pending: `${config.CORS_ORIGIN}/profile?payment=pending`
                },
                
                notification_url: `${config.server.BASE_URL}/api/payments/webhooks/mercadopago`,
                
                external_reference: user.id,
                metadata: {
                    user_id: user.id,
                    subscription_tier_id: tierId,
                    duration_months: durationMonths
                }
            };

            try {
                const result = await preference.create({ body: preferencePayload });
                return { init_point: result.init_point, preferenceId: result.id };
            } catch (error) {
                console.error("Error al crear la preferencia de Mercado Pago:", error);
                if (error?.cause) {
                    console.error("Detalle del error de la API de MP:", JSON.stringify(error.cause, null, 2));
                }
                throw new Error("No se pudo generar el enlace de pago. Por favor, intente más tarde.");
            }
        }
        if (provider === "paypal") {
            const orderPayload = {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: { currency_code: 'USD', value: totalAmount.toString() },
                    description: itemName,
                    custom_id: JSON.stringify({ userId: user.id, tierId, durationMonths }),
                }],
            };
            try {
                const order = await createPayPalOrder(orderPayload);
                return { orderID: order.id };
            } catch (error) {
                 console.error("Error al crear la orden de PayPal:", error.message);
                throw new Error("No se pudo generar el enlace de pago de PayPal. Por favor, intente más tarde.");
            }
        }

        throw new Error("Proveedor de pago no soportado.");
    }

    async capturePaypalOrder(orderID) {
        const isAlreadyProcessed = await paymentRepository.findPaymentByProviderId(orderID);
        if (isAlreadyProcessed) {
            console.warn(`Intento de capturar un pago de PayPal ya procesado: ${orderID}`);
            return { success: true, message: "El pago ya fue procesado." };
        }

        const capture = await capturePayPalOrderApi(orderID);
        
        const purchaseUnit = capture.purchase_units[0];
        const customData = JSON.parse(purchaseUnit.custom_id);
        const captureData = purchaseUnit.payments.captures[0];

        if (captureData.status === 'COMPLETED') {
            await paymentRepository.processSuccessfulPayment({
                p_user_id: customData.userId,
                p_tier_id: customData.tierId,
                p_duration_months: customData.durationMonths,
                p_amount: Number(captureData.amount.value),
                p_currency: captureData.amount.currency_code,
                p_provider: "paypal",
                p_provider_payment_id: capture.id,
                p_status: "succeeded",
                p_metadata: customData,
            });
            return { success: true, details: capture };
        } else {
            throw new Error(`La captura del pago de PayPal no fue completada. Estado: ${captureData.status}`);
        }
    }

    async processMercadoPagoWebhook({ paymentInfo }) {

        if (paymentInfo.type === 'payment') {
            const paymentId = String(paymentInfo.data.id);
            
            const isAlreadyProcessed = await paymentRepository.findPaymentByProviderId(paymentId);
            if (isAlreadyProcessed) {
                return;
            }

            try {
                const payment = await new Payment(mpClient).get({ id: paymentId });
                if (payment.status === 'approved') {
                    console.log(`Pago ${paymentId} aprobado, actualizando suscripción.`);
                     await paymentRepository.processSuccessfulPayment({
                        p_user_id: payment.external_reference,
                        p_tier_id: parseInt(payment.metadata.subscription_tier_id, 10),
                        p_duration_months: parseInt(payment.metadata.duration_months, 10),
                        p_amount: payment.transaction_amount,
                        p_currency: payment.currency_id,
                        p_provider: "mercadopago",
                        p_provider_payment_id: String(payment.id),
                        p_status: "succeeded",
                        p_metadata: payment.metadata,
                    });
                } else {
                }
            } catch (error) {
            }
        }
    }

async processPaypalWebhook({ headers, webhookEvent }) {

        const isValid = await verifyPayPalWebhook({ headers, webhookEvent });
        if (!isValid) {
            console.error("Firma de Webhook de PayPal inválida. Se descarta el evento.");
            throw new Error("Firma de Webhook de PayPal inválida.");
        }

        if (webhookEvent.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
           const capture = webhookEvent.resource;
            const orderID = capture.links.find(link => link.rel === 'up').href.split('/').pop();

            const isAlreadyProcessed = await paymentRepository.findPaymentByProviderId(orderID);
            if (isAlreadyProcessed) {
                console.warn(`Webhook: Pago de PayPal ya procesado: ${orderID}. Omitiendo.`);
                return;
            }
            
          
        } else if (webhookEvent.event_type === 'CHECKOUT.ORDER.APPROVED') {
            
            console.log(`Webhook: Orden ${webhookEvent.resource.id} aprobada, esperando captura del frontend.`);

        } else {
            console.log(`Recibido evento de webhook de PayPal no manejado: ${webhookEvent.event_type}`);
        }
    }
}

export const paymentService = new PaymentService();