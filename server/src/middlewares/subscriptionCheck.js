// RUTA: src/middlewares/subscriptionCheck.js

/**
 * Middleware Factory para verificar el nivel de suscripción del usuario.
 * Se usa después de `requireAuth`, por lo que asume que `req.user` existe.
 *
 * @param {number} requiredTier - El nivel mínimo de suscripción requerido para acceder a la ruta.
 * @returns Un middleware de Express.
 */
export const requireSubscription = (requiredTier) => {
    return (req, res, next) => {
        if (req.user.subscription_tier_id < requiredTier) {
            return res.status(403).json({
                success: false,
                message: "Acceso denegado. Se requiere un nivel de suscripción superior."
            });
        }

        next();
    };
};