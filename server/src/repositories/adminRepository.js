//src/repositories/adminRepository.js
import { createScopedClient } from "../utils/supabaseUtils.js";

export const getAllUsersFromDB = async (authToken) => {
    const supabaseScoped = createScopedClient(authToken);
    const { data, error } = await supabaseScoped.rpc("admin_get_all_users");
    if (error) {
        console.error("Error en RPC (admin_get_all_users):", error);
        throw new Error("No se pudo obtener la lista de usuarios.");
    }
    return data;
};

export const toggleUserMuteInDB = async (authToken, userId, isMuted) => {
    const supabaseScoped = createScopedClient(authToken);
    const { error } = await supabaseScoped.rpc("admin_toggle_user_mute", {
        p_user_id: userId,
        p_is_muted: isMuted,
    });
    if (error) {
        console.error("Error en RPC (admin_toggle_user_mute):", error);
        throw new Error("No se pudo cambiar el estado de muteo del usuario.");
    }
};

export const deleteGlobalMessageInDB = async (authToken, messageId) => {
    const supabaseScoped = createScopedClient(authToken);
    const { error } = await supabaseScoped.rpc("admin_delete_global_message", {
        p_message_id: messageId,
    });
    if (error) {
        console.error("Error en RPC (admin_delete_global_message):", error);
        throw new Error("No se pudo borrar el mensaje.");
    }
};

export const pinGlobalMessageInDB = async (authToken, messageId, unpin) => {
    const supabaseScoped = createScopedClient(authToken);
    const { error } = await supabaseScoped.rpc("admin_pin_global_message", {
        p_message_id: messageId,
        p_unpin: unpin,
    });
    if (error) {
        console.error("Error en RPC (admin_pin_global_message):", error);
        throw new Error("No se pudo fijar/desfijar el mensaje.");
    }
};

export const updatePostInDB = async (authToken, postId, title, content) => {
    const supabaseScoped = createScopedClient(authToken);
    const { data, error } = await supabaseScoped.rpc("admin_update_post", {
        p_post_id: postId,
        p_title: title,
        p_content: content,
    });
    if (error) {
        console.error("Error en RPC (admin_update_post):", error);
        throw new Error("No se pudo actualizar la publicación.");
    }
    return data;
};

export const updateCommentInDB = async (authToken, commentId, content) => {
    const supabaseScoped = createScopedClient(authToken);
    const { data, error } = await supabaseScoped.rpc("admin_update_comment", {
        p_comment_id: commentId,
        p_content: content,
    });
    if (error) {
        console.error("Error en RPC (admin_update_comment):", error);
        throw new Error("No se pudo actualizar el comentario.");
    }
    return data;
};