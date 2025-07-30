// RUTA: src/services/postService.js

import { postRepository } from "../repositories/postRepository.js";
import { getPublicUrl, createPrivateUrl } from "../utils/supabaseUtils.js";
import { config } from "../config/config.js";

const PUBLIC_BUCKET = config.supabase.buckets.PUBLIC;
const PRIVATE_BUCKET = config.supabase.buckets.PRIVATE;

const fetchSocialFeed = async (authToken, userId, page = 1, limit = 10) => { 
    const feedData = await postRepository.getFeedFromDB(authToken, userId, page, limit);

    if (!feedData) return [];

    return Promise.all(feedData.map(async (item) => {
        const post = item.post_data;

        
        if (post.author.avatarUrl) {
            post.author.avatarUrl = getPublicUrl(PUBLIC_BUCKET, post.author.avatarUrl);
        }

        if (post.imageUrl) {
            post.imageUrl = await createPrivateUrl(PRIVATE_BUCKET, post.imageUrl);
        }
        if (post.comments) {
            post.comments = await Promise.all(post.comments.map(async (comment) => {
                if (comment.author.avatarUrl) {
                    comment.author.avatarUrl = getPublicUrl(PUBLIC_BUCKET, comment.author.avatarUrl);
                }
                if (comment.imageUrl) { 
                    comment.imageUrl = await createPrivateUrl(PRIVATE_BUCKET, comment.imageUrl);
                }
                return comment;
            }));
        }
        return post;
    }));
};

const togglePostLike = async (authToken, postId) => {
    return postRepository.toggleLikeInDB(authToken, postId);
};

const addComment = async ({ postId, content, imageUrl, parentId }, authToken, userId) => {
    const newComment = await postRepository.addCommentToDB(authToken, userId, postId, content, imageUrl, parentId);
    
    if (newComment.author.avatarUrl) {
        newComment.author.avatarUrl = getPublicUrl(PUBLIC_BUCKET, newComment.author.avatarUrl);
    }
    if (newComment.imageUrl) {
        newComment.imageUrl = await createPrivateUrl(PRIVATE_BUCKET, newComment.imageUrl);
    }

    return newComment;
};

const deletePost = async (authToken, postId) => {
    return postRepository.deletePostFromDB(authToken, postId);
};

const deleteComment = async (authToken, commentId) => {
    return postRepository.deleteCommentFromDB(authToken, commentId);
};
const createPost = async (authToken, postData) => {
    return postRepository.createPostInDB(authToken, postData);
};
const castPollVote = async (authToken, postId, optionId) => {
  return postRepository.castVoteInDB(authToken, postId, optionId);
};
export const postService = {
    fetchSocialFeed,
    togglePostLike,
    addComment,
    deletePost,
    deleteComment,
    createPost,
    castPollVote,
};