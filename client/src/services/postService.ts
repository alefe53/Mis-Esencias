// RUTA: src/services/postService.ts

import api from './api'
import type { Post, PostComment, PollData } from '../types'

export const getFeed = async (page = 1, limit = 10): Promise<Post[]> => {
  const response = await api.get('/posts', {
    params: { page, limit },
  })
  return response.data.data
}

export const toggleLikeOnPost = async (postId: number) => {
  const response = await api.post(`/posts/${postId}/like`)
  return response.data.data
}

export const addCommentToPost = async (
  postId: number,
  content: string,
): Promise<PostComment> => {
  const response = await api.post(`/posts/${postId}/comments`, { content })
  return response.data.data
}

export const deletePostById = async (postId: number): Promise<void> => {
  await api.delete(`/posts/${postId}`)
}

export const deleteCommentById = async (commentId: number): Promise<void> => {
  await api.delete(`/posts/comments/${commentId}`)
}
export const castVoteOnPoll = async (
  postId: number,
  optionId: number,
): Promise<PollData> => {
  const response = await api.post(`/posts/${postId}/vote`, { optionId })
  return response.data.data
}
export const toggleLikeOnComment = async (commentId: number) => {
  const response = await api.post(`/posts/comments/${commentId}/like`)
  return response.data.data
}
