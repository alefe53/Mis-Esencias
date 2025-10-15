//src/repositories/paymentRepository.js
import { supabase } from "../config/supabase.js";

export const getTierById = async (tierId) => {
    const { data, error } = await supabase
        .rpc("get_tier_by_id", { p_tier_id: tierId })
        .single();

    if (error) {
        console.error("Error en RPC (get_tier_by_id):", error.message);
        return null;
    }
    return data;
};

export const findPaymentByProviderId = async (providerPaymentId) => {
    const { data, error } = await supabase
        .rpc("find_payment_by_provider_id", { p_provider_payment_id: providerPaymentId })
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error en RPC (find_payment_by_provider_id):", error.message);
    }
    return data;
};

export const processSuccessfulPayment = async (payload) => {
    const { error } = await supabase.rpc("handle_successful_payment", payload);

    if (error) {
        console.error("Error en RPC (handle_successful_payment):", error.message);
        throw new Error("La transacción no pudo ser procesada en la base de datos.");
    }
};