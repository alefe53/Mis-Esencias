// RUTA: src/stores/postStore.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post } from '../types'
import * as postService from '../services/postService'
import * as adminService from '../services/adminService'
import { useUiStore } from './uiStore'

export const usePostStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const isLoading = ref(false)
  const currentPage = ref(1)
  const hasMorePosts = ref(true)

  async function fetchInitialFeed() {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const newPosts = await postService.getFeed(1)
      posts.value = newPosts
      currentPage.value = 1 // Reseteamos la página
      hasMorePosts.value = newPosts.length > 0
    } catch (error) {
      console.error('Error al cargar el feed:', error)
      useUiStore().showToast({ message: 'No se pudo cargar el feed.' })
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMorePosts() {
    if (isLoading.value || !hasMorePosts.value) return

    isLoading.value = true
    try {
      currentPage.value++
      const newPosts = await postService.getFeed(currentPage.value)

      if (newPosts.length > 0) {
        posts.value.push(...newPosts)
      } else {
        hasMorePosts.value = false
      }
    } catch (error) {
      console.error('Error al cargar más posts:', error)
      currentPage.value--
    } finally {
      isLoading.value = false
    }
  }
  async function toggleLike(postId: number) {
    const post = posts.value.find((p) => p.id === postId)
    if (!post) return

    post.isLikedByUser = !post.isLikedByUser
    post.stats.likesCount += post.isLikedByUser ? 1 : -1

    try {
      const result = await postService.toggleLikeOnPost(postId)
      post.isLikedByUser = result.isLiked
      post.stats.likesCount = result.likesCount
    } catch (error) {
      post.isLikedByUser = !post.isLikedByUser
      post.stats.likesCount += post.isLikedByUser ? 1 : -1
      console.error('Error en toggleLike:', error)
    }
  }

  async function toggleCommentLike(postId: number, commentId: number) {
    const post = posts.value.find((p) => p.id === postId)
    if (!post || !post.comments) return

    const comment = post.comments.find((c) => c.id === commentId)
    if (!comment) return

    comment.isLikedByUser = !comment.isLikedByUser
    comment.likesCount += comment.isLikedByUser ? 1 : -1

    try {
      const result = await postService.toggleLikeOnComment(commentId)
      comment.isLikedByUser = result.isLiked
      comment.likesCount = result.likesCount
    } catch (error) {
      comment.isLikedByUser = !comment.isLikedByUser
      comment.likesCount += comment.isLikedByUser ? 1 : -1
      console.error('Error en toggleCommentLike:', error)
      useUiStore().showToast({
        message: 'No se pudo registrar el Me Gusta.',
        color: '#EF4444',
      })
    }
  }

  async function castVote(postId: number, optionId: number) {
    const post = posts.value.find((p) => p.id === postId)
    if (!post || !post.pollData) return
    const originalPollData = JSON.parse(JSON.stringify(post.pollData))
    if (post.pollData.userVote === null) {
      post.pollData.userVote = optionId
      const votedOption = post.pollData.options.find(
        (opt) => opt.id === optionId,
      )
      if (votedOption) votedOption.votes++
    }
    try {
      const updatedPollData = await postService.castVoteOnPoll(postId, optionId)
      post.pollData = updatedPollData
    } catch (error) {
      console.error('Error al emitir el voto:', error)
      post.pollData = originalPollData
      useUiStore().showToast({
        message: 'No se pudo registrar tu voto.',
        color: '#EF4444',
      })
    }
  }

  async function addComment(postId: number, content: string) {
    const uiStore = useUiStore()
    try {
      const newComment = await postService.addCommentToPost(postId, content)
      const post = posts.value.find((p) => p.id === postId)
      if (post) {
        if (!post.comments) {
          post.comments = []
        }
        post.comments.unshift(newComment)
        post.stats.commentsCount++
      }
    } catch (error) {
      console.error('Error al añadir comentario:', error)
      uiStore.showToast({
        message: 'No se pudo publicar el comentario.',
        color: '#EF4444',
      })
    }
  }

  async function deletePost(postId: number) {
    const uiStore = useUiStore()
    try {
      await adminService.deletePostById(postId)
      posts.value = posts.value.filter((p) => p.id !== postId)
      uiStore.showToast({ message: 'Publicación eliminada.', color: '#4ade80' })
    } catch (error) {
      console.error('Error al eliminar la publicación:', error)
      uiStore.showToast({ message: 'No se pudo eliminar la publicación.' })
    }
  }

  async function deleteComment(postId: number, commentId: number) {
    const uiStore = useUiStore()
    try {
      await adminService.deleteCommentById(commentId)
      const post = posts.value.find((p) => p.id === postId)
      if (post && post.comments) {
        post.comments = post.comments.filter((c) => c.id !== commentId)
        post.stats.commentsCount--
      }
      uiStore.showToast({ message: 'Comentario eliminado.', color: '#4ade80' })
    } catch (error) {
      console.error('Error al eliminar el comentario:', error)
      uiStore.showToast({ message: 'No se pudo eliminar el comentario.' })
    }
  }

  async function updatePost(
    postId: number,
    payload: { title: string; content: string },
  ) {
    const uiStore = useUiStore()
    try {
      const updatedPostData = await adminService.updatePost(postId, payload)
      const postIndex = posts.value.findIndex((p) => p.id === postId)
      if (postIndex !== -1) {
        posts.value[postIndex].title = updatedPostData.title
        posts.value[postIndex].content = updatedPostData.content
      }
      uiStore.showToast({
        message: 'Publicación actualizada.',
        color: '#4ade80',
      })
    } catch (error) {
      console.error('Error al actualizar la publicación:', error)
      uiStore.showToast({ message: 'No se pudo actualizar la publicación.' })
      throw error
    }
  }

  async function updateComment(
    postId: number,
    commentId: number,
    payload: { content: string },
  ) {
    const uiStore = useUiStore()
    try {
      const updatedCommentData = await adminService.updateComment(
        commentId,
        payload,
      )
      const post = posts.value.find((p) => p.id === postId)
      if (post && post.comments) {
        const commentIndex = post.comments.findIndex((c) => c.id === commentId)
        if (commentIndex !== -1) {
          post.comments[commentIndex].content = updatedCommentData.content
        }
      }
      uiStore.showToast({
        message: 'Comentario actualizado.',
        color: '#4ade80',
      })
    } catch (error) {
      console.error('Error al actualizar el comentario:', error)
      uiStore.showToast({ message: 'No se pudo actualizar el comentario.' })
      throw error
    }
  }

  return {
    posts,
    isLoading,
    hasMorePosts,
    fetchInitialFeed,
    fetchMorePosts,
    toggleLike,
    addComment,
    deletePost,
    deleteComment,
    castVote,
    updatePost,
    updateComment,
    toggleCommentLike,
  }
})
