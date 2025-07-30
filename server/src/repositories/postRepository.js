// RUTA: src/repositories/postRepository.js
import { createScopedClient } from "../utils/supabaseUtils.js";
import { supabase as supabaseAdmin } from "../config/supabase.js"; 


const getFeedFromDB = async (authToken, userId, page, limit) => {

    const { data, error } = await supabaseAdmin.rpc("get_social_feed", {
        p_user_id: userId,
        p_page_number: page,
        p_page_size: limit,
    });

    if (error) {
        console.error("Error en RPC (get_social_feed):", error);
        throw new Error("No se pudo obtener el feed de publicaciones.");
    }
    return data;
};

const toggleLikeInDB = async (authToken, postId) => {
    const scopedSupabase = createScopedClient(authToken);

    const { data, error } = await scopedSupabase.rpc("toggle_post_like", {
        p_post_id: postId,
    });

    if (error) {
        console.error("Error en RPC (toggle_post_like):", error);
        throw new Error("No se pudo procesar el 'Me Gusta'.");
    }
    return data;
};


const addCommentToDB = async (authToken, userId, postId, content, imageUrl, parentId) => {
    const scopedSupabase = createScopedClient(authToken);

    const { data, error } = await scopedSupabase.rpc("add_post_comment", {
        p_post_id: postId,
        p_author_id: userId, 
        p_content: content,
        p_image_url: imageUrl,
        p_parent_comment_id: parentId,
    });

    if (error) {
        console.error("Error en RPC (add_post_comment):", error);
        throw new Error("No se pudo agregar el comentario.");
    }
    return data;
};

const deletePostFromDB = async (authToken, postId) => {
    const scopedSupabase = createScopedClient(authToken);
    const { error } = await scopedSupabase.rpc("admin_delete_post", { p_post_id: postId });
    if (error) {
        console.error("Error en RPC (admin_delete_post):", error);
        throw new Error("No se pudo borrar el post.");
    }
};

const deleteCommentFromDB = async (authToken, commentId) => {
    const scopedSupabase = createScopedClient(authToken);
    const { error } = await scopedSupabase.rpc("admin_delete_comment", { p_comment_id: commentId });
    if (error) {
        console.error("Error en RPC (admin_delete_comment):", error);
        throw new Error("No se pudo borrar el comentario.");
    }
};


const createPostInDB = async (authToken, postData) => {
    const scopedSupabase = createScopedClient(authToken);

    const { data, error } = await scopedSupabase.rpc("create_post_as_admin", {
        p_title: postData.title,
        p_content: postData.content,
        p_image_url: postData.imageUrl,
        p_post_type: postData.postType,
        p_poll_options: postData.pollOptions, 
    });

    if (error) {
        console.error("Error en RPC (create_post_as_admin):", error);
        throw new Error("No se pudo crear la publicación.");
    }
    return data;
};

const castVoteInDB = async (authToken, postId, optionId) => {
  const scopedSupabase = createScopedClient(authToken);
  const { data, error } = await scopedSupabase.rpc("cast_poll_vote", {
    p_post_id: postId,
    p_option_id: optionId,
  });

  if (error) {
    console.error("Error en RPC (cast_poll_vote):", error);
    throw new Error("No se pudo registrar el voto.");
  }
  return data;
};

export const postRepository = {
    getFeedFromDB,
    toggleLikeInDB,
    addCommentToDB,
    deletePostFromDB,
    deleteCommentFromDB,
    createPostInDB,
    castVoteInDB,
};