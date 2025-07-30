<template>
  <div class="post-card">
    <div class="post-header">
      <img
        :src="post.author.avatarUrl || '/perfildefault.jpg'"
        alt="Avatar del autor"
        class="author-avatar"
      />
      <div class="author-info">
        <span class="author-name">{{ post.author.fullName }}</span>
        <span class="post-timestamp">{{ formattedDate }}</span>
      </div>
      <button
        v-if="authStore.isAdmin"
        @click="handleDeletePost"
        class="delete-btn post-delete-btn"
        title="Borrar publicación"
      >
        🗑️
      </button>
    </div>

    <div class="post-body">
      <h3 v-if="post.title">{{ post.title }}</h3>
      <p v-if="post.content && post.postType !== 'poll'" class="post-content">
        {{ post.content }}
      </p>

      <PollDisplay
        v-if="post.postType === 'poll' && post.pollData"
        :post-id="post.id"
        :poll-data="post.pollData"
        @vote="handlePollVote"
      />

      <img
        v-if="post.imageUrl"
        :src="post.imageUrl"
        alt="Imagen del post"
        class="post-image"
      />
    </div>

    <div class="post-footer">
      <div class="post-stats">
        <span>{{ post.stats.likesCount }} Me gusta</span>
        <span>·</span>
        <span>{{ post.stats.commentsCount }} Comentarios</span>
      </div>
      <div class="post-actions">
        <button @click="handleLike" :class="{ liked: post.isLikedByUser }">
          <span class="icon">👍</span> Me Gusta
        </button>
        <button @click="areCommentsVisible = !areCommentsVisible">
          <span class="icon">💬</span> Comentar
        </button>
      </div>
    </div>

    <div v-if="areCommentsVisible" class="comments-section">
      <div class="add-comment-form">
        <textarea
          v-model="newCommentText"
          :placeholder="commentPlaceholder"
          :disabled="!canComment"
          rows="2"
        ></textarea>
        <button
          @click="submitComment"
          :disabled="!newCommentText.trim() || !canComment"
        >
          Publicar
        </button>
      </div>

      <div
        v-if="post.comments && post.comments.length > 0"
        class="comments-list"
      >
        <div
          v-for="comment in visibleComments"
          :key="comment.id"
          class="comment"
        >
          <img
            :src="comment.author.avatarUrl || '/perfildefault.jpg'"
            alt="Avatar"
            class="comment-avatar"
          />
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author.fullName }}</span>
              <button
                v-if="authStore.isAdmin"
                @click="handleDeleteComment(comment.id)"
                class="delete-btn"
                title="Borrar comentario"
              >
                🗑️
              </button>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>

        <button
          v-if="post.comments.length > 5 && !showAllComments"
          @click="showAllComments = true"
          class="show-more-btn"
        >
          Ver +{{ post.comments.length - 5 }} comentarios más
        </button>
      </div>
      <div v-else class="no-comments">Sé el primero en comentar.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType, computed } from 'vue'
import type { Post } from '../../types'
import { usePostStore } from '../../stores/postStore'
import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import PollDisplay from './PollDisplay.vue'

const props = defineProps({
  post: {
    type: Object as PropType<Post>,
    required: true,
  },
})

const authStore = useAuthStore()
const uiStore = useUiStore()
const postStore = usePostStore()

const areCommentsVisible = ref(false)
const showAllComments = ref(false)
const newCommentText = ref('')

const canComment = computed(
  () => (authStore.user?.subscription_tier_id ?? 0) >= 2,
)
const commentPlaceholder = computed(() =>
  canComment.value
    ? 'Escribe un comentario...'
    : 'Requiere suscripción Premium para comentar.',
)

const visibleComments = computed(() => {
  if (!props.post.comments) return []
  if (showAllComments.value) {
    return props.post.comments
  }
  return props.post.comments.slice(0, 5)
})

const handleLike = () => {
  postStore.toggleLike(props.post.id)
}

const handlePollVote = (optionId: number) => {
  postStore.castVote(props.post.id, optionId)
}

const submitComment = async () => {
  if (!canComment.value) {
    uiStore.showToast({
      message: 'Para comentar debes tener mínimo suscripción nivel 2.',
      color: '#F59E0B',
    })
    return
  }
  if (!newCommentText.value.trim()) return
  await postStore.addComment(props.post.id, newCommentText.value)
  newCommentText.value = ''
}

const handleDeletePost = () => {
  if (
    window.confirm(
      '¿Estás seguro de que quieres borrar esta publicación? Esta acción es irreversible.',
    )
  ) {
    postStore.deletePost(props.post.id)
  }
}

const handleDeleteComment = (commentId: number) => {
  if (window.confirm('¿Estás seguro de que quieres borrar este comentario?')) {
    postStore.deleteComment(props.post.id, commentId)
  }
}

const formattedDate = computed(() => {
  return new Date(props.post.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})
</script>

<style scoped>
.post-card {
  background-color: #262c35;
  border: 1px solid #39424e;
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #e0e0e0;
  overflow: hidden;
}
.post-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.author-info {
  display: flex;
  flex-direction: column;
}
.author-name {
  font-weight: 600;
}
.post-timestamp {
  font-size: 0.8rem;
  color: #999;
}
.post-body {
  padding: 0 1rem 1rem 1rem;
}
.post-body h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}
.post-content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}
.post-image {
  width: 100%;
  border-radius: 8px;
  margin-top: 1rem;
}
.post-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #39424e;
}
.post-stats {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 0.75rem;
}
.post-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.post-actions button {
  background-color: #3a414b;
  color: #e0e0e0;
  border: none;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.post-actions button:hover {
  background-color: #4a525d;
}
.post-actions button.liked {
  background-color: #3b82f6;
  color: white;
}
.comments-section {
  padding: 1rem;
  background-color: #20252c;
  border-top: 1px solid #39424e;
}
.add-comment-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.add-comment-form textarea {
  flex-grow: 1;
  background-color: #3a414b;
  border: 1px solid #555;
  border-radius: 8px;
  color: white;
  padding: 0.5rem;
  resize: vertical;
}
.add-comment-form button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1rem;
  cursor: pointer;
}
.add-comment-form button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.comment {
  display: flex;
  gap: 0.75rem;
}
.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.comment-body {
  background-color: #3a414b;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  flex-grow: 1;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.comment-author {
  font-weight: 600;
  font-size: 0.9rem;
}
.comment-content {
  margin: 0.25rem 0 0 0;
  font-size: 0.95rem;
}
.no-comments {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 1rem;
}
.show-more-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  margin-top: 0.5rem;
  padding: 0.25rem;
}
.show-more-btn:hover {
  color: #fff;
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
  font-size: 0.9rem;
}
.delete-btn:hover {
  opacity: 1;
  color: #ef4444;
}
.post-delete-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.1rem;
}
</style>
