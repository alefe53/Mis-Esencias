//routers/paymentRouter.js
import express from "express";
import { Router } from "express";
import { paymentController } from "../controllers/paymentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const paymentRouter = Router();

paymentRouter.post(
    "/create-order",
    requireAuth,
    paymentController.createOrder,
);

paymentRouter.post(
    "/capture-paypal-order",
    requireAuth,
    paymentController.capturePaypalOrder,
);

paymentRouter.post(
    "/webhooks/mercadopago",
    express.json({ type: 'application/json' }),
    paymentController.handleMercadoPagoWebhook,
);

paymentRouter.post(
    "/webhooks/paypal",
    express.json({ type: 'application/json' }),
    paymentController.handlePaypalWebhook,
);

export default paymentRouter;