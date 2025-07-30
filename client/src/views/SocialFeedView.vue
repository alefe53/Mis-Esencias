<template>
  <div class="social-feed-layout">
    <div class="feed-column">
      <div class="social-feed-container">
        <h2 class="feed-title">Comunidad Fenicia</h2>
        <p class="fenicia-subtitle">
          Ahora estás en mis Dominios. Yo soy el ojo
          <img src="/ojo.png" alt="Ojo que todo lo ve" class="inline-icon" />
          que todo lo ve. ¡Portate Bien!
        </p>
        <div v-if="isLoading && posts.length === 0" class="loading-spinner">
          Cargando...
        </div>
        <div v-else class="posts-container">
          <PostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>
      </div>
    </div>
    <div class="chat-column">
      <GlobalChat />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/postStore'
import PostCard from '../components/posts/PostCard.vue'
import GlobalChat from '../components/global-chat/GlobalChat.vue'
const postStore = usePostStore()
const { posts, isLoading } = storeToRefs(postStore)
onMounted(() => {
  postStore.fetchInitialFeed()
})
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400..900&display=swap');
.social-feed-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem 0 12rem;
  box-sizing: border-box;
  height: calc(100vh - 100px);
}
.feed-column {
  height: 100%;
  overflow-y: auto;
  padding-right: 1rem;
}
.chat-column {
  height: 100%;
}
.feed-column::-webkit-scrollbar {
  width: 8px;
}
.feed-column::-webkit-scrollbar-track {
  background: transparent;
}
.feed-column::-webkit-scrollbar-thumb {
  background-color: #4a525d;
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.social-feed-container {
  max-width: 700px;
  margin: 0 auto;
  padding-top: 2rem;
}
.feed-title {
  font-family: 'Uncial Antiqua', serif;
  text-align: center;
  font-size: 2.5rem;
  color: #fca311;
  flex-shrink: 0;
}
.fenicia-subtitle {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 500;
  color: white;
  text-align: center;
  font-size: 0.9rem;
  margin-top: -1.2rem;
  margin-bottom: 2rem;
  text-shadow:
    0 0 7px black,
    0 0 4px black;
}
.inline-icon {
  height: 1.7em;
  width: auto;
  vertical-align: text-bottom;
  margin: 0 0.2em;
}
.loading-spinner {
  text-align: center;
  font-size: 1.5rem;
  padding: 4rem;
  color: #999;
}
.posts-container {
  padding-bottom: 2rem;
}
</style>
