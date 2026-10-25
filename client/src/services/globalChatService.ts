import api from './api'
import type { GlobalChatMessage } from '../stores/globalChatStore'

export interface MessageReaction {
  emoji: string
  count: number
}

export const fetchHistory = async (
  limit = 50,
  cursor?: string,
): Promise<GlobalChatMessage[]> => {
  const params = { limit, cursor }
  const response = await api.get('/global-chat', { params })
  return response.data.data
}

export const postMessage = async (
  content: string,
  parentId: number | null,
  wantsToPin: boolean,
): Promise<GlobalChatMessage> => {
  const response = await api.post('/global-chat', {
    content,
    parentId,
    wantsToPin,
  })
  return response.data.data
}

export const toggleReaction = async (messageId: number, emoji: string) => {
  const response = await api.post(`/global-chat/${messageId}/react`, { emoji })
  return response.data.data
}

export const getReactions = async (
  messageId: number,
): Promise<MessageReaction[]> => {
  const response = await api.get(`/global-chat/${messageId}/reactions`)
  return response.data.data
}

export const fetchSingleMessage = async (
  messageId: number,
): Promise<GlobalChatMessage> => {
  const response = await api.get(`/global-chat/${messageId}`)
  return response.data.data
}
