<template>
  <div class="social-feed-layout">
    <div class="feed-column">
      <div class="feed-title-container">
        <h2 class="feed-title" :style="titleStyle">Comunidad Fenicia</h2>
      </div>

      <div class="feed-content-scrollable">
        <p class="fenicia-subtitle">
          Ahora estás en mis Dominios. Yo soy el ojo
          <img src="/ojo.png" alt="Ojo que todo lo ve" class="inline-icon" />
          que todo lo ve. ¡Portate Bien!
        </p>

        <LiveStreamPlayer v-if="isLive" />

        <div v-if="isLoading && posts.length === 0" class="loading-spinner">
          Cargando...
        </div>
        <div v-else class="posts-container">
          <PostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>
      </div>
    </div>
    <div class="chat-column">
      <div class="pin-banners-container">
        <TemporaryPinBanner
          v-for="msg in temporaryPinnedMessages"
          :key="msg.message_id"
          :message="msg"
        />
      </div>
      <GlobalChat />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/postStore'
import { useGlobalChatStore } from '../stores/globalChatStore'
import { usePlayerStore } from '../stores/playerStore'
import { useUiStore } from '../stores/uiStore'
import { moodColors } from '../constants/moods'
import PostCard from '../components/posts/PostCard.vue'
import GlobalChat from '../components/global-chat/GlobalChat.vue'
import TemporaryPinBanner from '../components/global-chat/TemporaryPinBanner.vue'
import { useStreamingStore } from '../stores/streamingStore'
import LiveStreamPlayer from '../components/streaming/LiveStreamPlayer.vue'

const postStore = usePostStore()
const playerStore = usePlayerStore()
const uiStore = useUiStore()
const globalChatStore = useGlobalChatStore()
const streamingStore = useStreamingStore()

const { posts, isLoading } = storeToRefs(postStore)
const { currentMoodId } = storeToRefs(playerStore)
const { availableMoods } = storeToRefs(uiStore)
const { temporaryPinnedMessages } = storeToRefs(globalChatStore)
const { isLive } = storeToRefs(streamingStore)

const titleStyle = computed(() => {
  if (!currentMoodId.value) return {}
  const currentMood = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )
  if (currentMood && moodColors[currentMood.name]) {
    const color = moodColors[currentMood.name]
    return {
      textShadow: `0 0 15px ${color}, 0 0 25px ${color}`,
    }
  }
  return {}
})

onMounted(() => {
  postStore.fetchInitialFeed()
  streamingStore.checkInitialStreamStatus()
  streamingStore.listenToStreamStatus()
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
  padding: 1rem 2rem 0 12rem;
  box-sizing: border-box;
  height: calc(100vh - 80px);
}
.feed-column {
  height: 100%;
  overflow-y: auto;
  padding-right: 1rem;
}
.feed-title-container {
  position: sticky;
  top: 0;
  background-color: transparent;
  backdrop-filter: blur(0px);
  z-index: 10;
  padding: 0rem 0;
}
.feed-content-scrollable {
  padding-top: 1.5rem;
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
.chat-column {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.pin-banners-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 1rem;
  pointer-events: none;
}
.pin-banners-container > :deep(*) {
  pointer-events: auto;
}
.chat-column > :deep(.global-chat-container) {
  flex-grow: 1;
  min-height: 0;
}
.social-feed-container {
  max-width: 700px;
  margin: 0 auto;
}
.feed-title {
  font-family: 'Uncial Antiqua', serif;
  text-align: center;
  font-size: 2.5rem;
  color: #fca311;
  flex-shrink: 0;
  transition: text-shadow 0.5s ease;
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
