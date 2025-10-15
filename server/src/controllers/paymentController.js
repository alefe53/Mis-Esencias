//src/controllers/paymentController.js
import { paymentService } from "../services/paymentService.js";

class PaymentController {
    async createOrder(req, res, next) {
        try {
            const { tierId, provider, durationMonths } = req.body;
            if (!tierId || !provider || !durationMonths) {
                return res.status(400).json({ success: false, message: "Faltan datos requeridos." });
            }
            const user = req.user;

            const order = await paymentService.createOrder({
                user,
                tierId,
                provider,
                durationMonths,
            });

            res.status(200).json({ success: true, data: order });
        } catch (error) {
            console.error("ERROR COMPLETO DE MERCADO PAGO:", JSON.stringify(error, null, 2));

            next(error);
        }
    }

    async capturePaypalOrder(req, res, next) {
        try {
            const { orderID } = req.body;
            if (!orderID) {
                 return res.status(400).json({ success: false, message: "Falta el orderID." });
            }
            const response = await paymentService.capturePaypalOrder(orderID);
            res.status(200).json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    }

    async handleMercadoPagoWebhook(req, res, next) {
        try {
            const paymentInfo = req.body;
            const signature = req.headers['x-signature'];
            const requestId = req.headers['x-request-id'];

            await paymentService.processMercadoPagoWebhook({ paymentInfo, signature, requestId });
            
            res.status(200).send("ok");
        } catch (error) {
            next(error);
        }
    }

    async handlePaypalWebhook(req, res, next) {
        try {
            const webhookEvent = req.body;
            const headers = req.headers;
            await paymentService.processPaypalWebhook({ headers, webhookEvent });
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }
}

export const paymentController = new PaymentController();