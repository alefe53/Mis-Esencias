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
      <div v-if="authStore.isAdmin" class="post-header-actions">
        <button @click="openPostEdit" class="icon-btn edit-btn" title="Editar Publicación">
          <Pencil :size="18" />
        </button>
        <button @click="handleDeletePost" class="icon-btn delete-btn" title="Borrar Publicación">
          <Trash2 :size="18" />
        </button>
      </div>
    </div>

    <div class="post-body">
      <template v-if="!isEditingPost">
        <h3 v-if="post.title">{{ post.title }}</h3>
        <p v-if="post.content" class="post-content">{{ post.content }}</p>
      </template>
      <div v-else class="post-edit-form">
        <input v-model="editablePost.title" type="text" placeholder="Título" />
        <textarea v-model="editablePost.content" placeholder="Contenido" rows="5"></textarea>
        <div class="edit-form-actions">
          <button @click="cancelPostEdit" class="cancel-btn">Cancelar</button>
          <button @click="savePostChanges" class="save-btn">Guardar</button>
        </div>
      </div>

      <PollDisplay
        v-if="post.postType === 'poll' && post.pollData && !isEditingPost"
        :post-id="post.id"
        :poll-data="post.pollData"
        @vote="handlePollVote"
      />

      <img
        v-if="post.imageUrl && !isEditingPost"
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
        <button @click="submitComment" :disabled="!newCommentText.trim() || !canComment">
          Publicar
        </button>
      </div>
      <div v-if="post.comments && post.comments.length > 0" class="comments-list">
        <div v-for="comment in visibleComments" :key="comment.id" class="comment">
          <img :src="comment.author.avatarUrl || '/perfildefault.jpg'" alt="Avatar" class="comment-avatar" />
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author.fullName }}</span>
              <div v-if="authStore.isAdmin" class="comment-actions">
                <button
                  v-if="comment.author.id === authStore.user?.id"
                  @click="startCommentEdit(comment)"
                  class="icon-btn edit-btn"
                  title="Editar comentario"
                >
                  <Pencil :size="16" />
                </button>
                <button @click="handleDeleteComment(comment.id)" class="icon-btn delete-btn" title="Borrar comentario">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
            <div v-if="editingCommentId !== comment.id">
              <p class="comment-content">{{ comment.content }}</p>
            </div>
            <div v-else class="comment-edit-form">
              <textarea v-model="editableCommentContent" rows="3"></textarea>
              <div class="edit-form-actions">
                <button @click="cancelCommentEdit" class="cancel-btn">Cancelar</button>
                <button @click="saveCommentChanges" class="save-btn">Guardar</button>
              </div>
            </div>

            <div class="comment-footer-actions">
                <button 
                  @click="handleCommentLike(comment.id)" 
                  class="like-comment-btn" 
                  :class="{ liked: comment.isLikedByUser }"
                >
                  👍 {{ comment.likesCount }}
                </button>
            </div>
            </div>
        </div>
        <button v-if="post.comments.length > 5 && !showAllComments" @click="showAllComments = true" class="show-more-btn">
          Ver +{{ post.comments.length - 5 }} comentarios más
        </button>
      </div>
      <div v-else class="no-comments">Sé el primero en comentar.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, type PropType, computed } from 'vue';
import { Pencil, Trash2 } from 'lucide-vue-next'; // Importamos los íconos
import type { Post, PostComment } from '../../types';
import { usePostStore } from '../../stores/postStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import PollDisplay from './PollDisplay.vue';

const props = defineProps({
  post: {
    type: Object as PropType<Post>,
    required: true,
  },
});

const authStore = useAuthStore();
const uiStore = useUiStore();
const postStore = usePostStore();

const areCommentsVisible = ref(false);
const showAllComments = ref(false);
const newCommentText = ref('');

const isEditingPost = ref(false);
const editablePost = reactive({ title: '', content: '' });

const editingCommentId = ref<number | null>(null);
const editableCommentContent = ref('');

const canComment = computed(() => (authStore.user?.subscription_tier_id ?? 0) >= 2);
const commentPlaceholder = computed(() => (canComment.value ? 'Escribe un comentario...' : 'Requiere suscripción Premium para comentar.'));
const visibleComments = computed(() => {
  if (!props.post.comments) return [];
  return showAllComments.value ? props.post.comments : props.post.comments.slice(0, 5);
});

const openPostEdit = () => {
  isEditingPost.value = true;
  editablePost.title = props.post.title || '';
  editablePost.content = props.post.content || '';
};

const cancelPostEdit = () => {
  isEditingPost.value = false;
};

const savePostChanges = async () => {
  if (!editablePost.title.trim() && !editablePost.content.trim()) {
    uiStore.showToast({ message: "El título o el contenido no pueden estar vacíos.", color: '#EF4444' });
    return;
  }
  await postStore.updatePost(props.post.id, {
    title: editablePost.title,
    content: editablePost.content,
  });
  isEditingPost.value = false;
};

const startCommentEdit = (comment: PostComment) => {
  editingCommentId.value = comment.id;
  editableCommentContent.value = comment.content;
};

const cancelCommentEdit = () => {
  editingCommentId.value = null;
  editableCommentContent.value = '';
};

const saveCommentChanges = async () => {
  if (editingCommentId.value && editableCommentContent.value.trim()) {
    await postStore.updateComment(props.post.id, editingCommentId.value, { content: editableCommentContent.value });
    cancelCommentEdit();
  } else {
    uiStore.showToast({ message: "El comentario no puede estar vacío.", color: '#EF4444' });
  }
};

const handleLike = () => postStore.toggleLike(props.post.id);
const handlePollVote = (optionId: number) => postStore.castVote(props.post.id, optionId);

const submitComment = async () => {
  if (!canComment.value) {
    uiStore.showToast({ message: 'Para comentar debes tener mínimo suscripción nivel 2.', color: '#F59E0B' });
    return;
  }
  if (!newCommentText.value.trim()) return;
  await postStore.addComment(props.post.id, newCommentText.value);
  newCommentText.value = '';
};
const handleCommentLike = (commentId: number) => {
  postStore.toggleCommentLike(props.post.id, commentId);
};
const handleDeletePost = () => {
  if (window.confirm('¿Estás seguro de que quieres borrar esta publicación?')) {
    postStore.deletePost(props.post.id);
  }
};

const handleDeleteComment = (commentId: number) => {
  if (window.confirm('¿Estás seguro de que quieres borrar este comentario?')) {
    postStore.deleteComment(props.post.id, commentId);
  }
};

const formattedDate = computed(() => new Date(props.post.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<style scoped>
.post-header-actions,
.comment-actions {
  margin-left: auto;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.icon-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  color: #a0a0a0;
  opacity: 0.7;
  transition: all 0.2s ease;
}
.icon-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}
.icon-btn.edit-btn:hover {
  color: #3b82f6;
}
.icon-btn.delete-btn:hover {
  color: #ef4444;
}
.post-edit-form,
.comment-edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}
.post-edit-form input,
.post-edit-form textarea,
.comment-edit-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  background-color: #3a414b;
  border: 1px solid #555;
  border-radius: 8px;
  color: white;
  resize: vertical;
}
.edit-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.edit-form-actions button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
}
.cancel-btn {
  background-color: #4a525d;
  color: white;
}
.save-btn {
  background-color: #10b981;
  color: white;
}
.post-card {
  background-color: #262c35;
  border: 1px solid #39424e;
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #e0e0e0;
  overflow: hidden;
}
.post-header {
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
  margin: 0 0 1rem 0;
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
  margin-top: 0.5rem;
  padding: 0.25rem;
}
.show-more-btn:hover {
  color: #fff;
}

/* ===== NUEVOS ESTILOS PARA EL LIKE DEL COMENTARIO ===== */
.comment-footer-actions {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
}

.like-comment-btn {
  background: none;
  border: 1px solid #555;
  color: #a0a0a0;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.like-comment-btn:hover {
  border-color: #777;
  color: #fff;
}

.like-comment-btn.liked {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  font-weight: bold;
}
</style>