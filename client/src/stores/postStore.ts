// RUTA: src/stores/postStore.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Post } from '../types';
import * as postService from '../services/postService';
import { useUiStore } from './uiStore';

export const usePostStore = defineStore('posts', () => {
  const posts = ref<Post[]>([]);
  const isLoading = ref(false);
  const currentPage = ref(1);
  const hasMorePosts = ref(true);

  async function fetchInitialFeed() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const newPosts = await postService.getFeed(1);
      posts.value = newPosts;
      currentPage.value = 1;
      hasMorePosts.value = newPosts.length > 0;
    } catch (error) {
      console.error("Error al cargar el feed:", error);
      useUiStore().showToast({ message: "No se pudo cargar el feed." });
    } finally {
      isLoading.value = false;
    }
  }

  async function toggleLike(postId: number) {
    const post = posts.value.find(p => p.id === postId);
    if (!post) return;

    post.isLikedByUser = !post.isLikedByUser;
    post.stats.likesCount += post.isLikedByUser ? 1 : -1;

    try {
      const result = await postService.toggleLikeOnPost(postId);
      post.isLikedByUser = result.isLiked;
      post.stats.likesCount = result.likesCount;
    } catch (error) {
      post.isLikedByUser = !post.isLikedByUser;
      post.stats.likesCount += post.isLikedByUser ? 1 : -1;
      console.error("Error en toggleLike:", error);
    }
  }

  async function castVote(postId: number, optionId: number) {
    const post = posts.value.find(p => p.id === postId);
    if (!post || !post.pollData || post.pollData.userVote !== null) return; 

    try {
      const updatedPollData = await postService.castVoteOnPoll(postId, optionId);
      
      post.pollData = updatedPollData;

    } catch (error) {
      console.error("Error al emitir el voto:", error);
      useUiStore().showToast({ message: "No se pudo registrar tu voto.", color: '#EF4444' });
    }
  }

  async function addComment(postId: number, content: string) {
    const uiStore = useUiStore();
    try {
      const newComment = await postService.addCommentToPost(postId, content);

      const post = posts.value.find(p => p.id === postId);
      if (post) {
        if (!post.comments) {
          post.comments = [];
        }
        post.comments.unshift(newComment); 
        post.stats.commentsCount++; 
      }
    } catch (error) {
      console.error("Error al añadir comentario:", error);
      uiStore.showToast({ message: "No se pudo publicar el comentario.", color: '#EF4444' });
    }
  }

  async function deletePost(postId: number) {
    const uiStore = useUiStore();
    try {
      await postService.deletePostById(postId);
      posts.value = posts.value.filter(p => p.id !== postId);
      uiStore.showToast({ message: "Publicación eliminada.", color: '#4ade80' });
    } catch (error) {
      console.error("Error al eliminar la publicación:", error);
      uiStore.showToast({ message: "No se pudo eliminar la publicación." });
    }
  }

  async function deleteComment(postId: number, commentId: number) {
    const uiStore = useUiStore();
    try {
      await postService.deleteCommentById(commentId);
      const post = posts.value.find(p => p.id === postId);
      if (post && post.comments) {
        post.comments = post.comments.filter(c => c.id !== commentId);
        post.stats.commentsCount--;
      }
      uiStore.showToast({ message: "Comentario eliminado.", color: '#4ade80' });
    } catch (error) {
      console.error("Error al eliminar el comentario:", error);
      uiStore.showToast({ message: "No se pudo eliminar el comentario." });
    }
  }

  return {
    posts,
    isLoading,
    fetchInitialFeed,
    toggleLike,
    addComment,
    deletePost,
    deleteComment,
    castVote,
  };
});