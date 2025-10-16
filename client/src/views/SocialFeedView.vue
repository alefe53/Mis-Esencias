<template>
  <div class="social-feed-layout">
    <SubscriptionButton
      v-if="isMobile"
      mode="corner-float"
      :force-float-on-mobile="true"
    />

    <div class="title-area fade-in-item" ref="titleArea">
      <div class="feed-title-container">
        <div class="title-background-container" :style="containerStyle">
          <h2 class="feed-title" :style="textGlowStyle">Comunidad Fenicia</h2>
        </div>
        <SubscriptionButton v-if="!isMobile" mode="corner-float" />
      </div>
      <p class="fenicia-subtitle">
        Ahora estás en mis Dominios. Yo soy el ojo
        <img src="/ojo.png" alt="Ojo que todo lo ve" class="inline-icon" />
        que todo lo ve. ¡Portate Bien!
      </p>
    </div>
    <transition name="stream-fade">
      <div v-if="isLive" class="stream-area fade-in-item" ref="streamArea">
        <LiveStreamPlayer />
      </div>
    </transition>
    <div class="chat-area fade-in-item" ref="chatArea">
      <div class="pin-banners-container">
        <TemporaryPinBanner
          v-for="msg in temporaryPinnedMessages"
          :key="msg.message_id"
          :message="msg"
        />
      </div>
      <GlobalChat />
    </div>
    <div class="posts-area fade-in-item" ref="postsArea">
      <div v-if="isLoading && posts.length === 0" class="loading-spinner">
        Cargando...
      </div>
      <div v-else class="posts-container">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />

        <div
          v-if="posts.length > 0 && hasMorePosts"
          ref="loadTrigger"
          class="load-trigger"
        ></div>

        <div v-if="isLoading && posts.length > 0" class="loading-spinner">
          Cargando más...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch, nextTick } from 'vue'
import type { CSSProperties } from 'vue' // Importamos el tipo para los estilos
import gsap from 'gsap'
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/postStore'
import { useGlobalChatStore } from '../stores/globalChatStore'
import { usePlayerStore } from '../stores/playerStore'
import { useUiStore } from '../stores/uiStore'
import { moodColors } from '../constants/moods'
import PostCard from '../components/posts/PostCard.vue'
import GlobalChat from '../components/global-chat/GlobalChat.vue'
import TemporaryPinBanner from '../components/global-chat/TemporaryPinBanner.vue'
import { useStreamingStoreV2 } from '../stores/streamingStoreV2'
import LiveStreamPlayer from '../components/streaming/LiveStreamPlayer.vue'
import SubscriptionButton from '../components/common/SubscriptionButton.vue'

const postStore = usePostStore()
const playerStore = usePlayerStore()
const uiStore = useUiStore()
const globalChatStore = useGlobalChatStore()
const streamingStore = useStreamingStoreV2()

const titleArea = ref<HTMLElement | null>(null)
const streamArea = ref<HTMLElement | null>(null)
const chatArea = ref<HTMLElement | null>(null)
const postsArea = ref<HTMLElement | null>(null)

const { posts, isLoading, hasMorePosts } = storeToRefs(postStore)
const { currentMoodId } = storeToRefs(playerStore)
const { availableMoods } = storeToRefs(uiStore)
const { temporaryPinnedMessages } = storeToRefs(globalChatStore)
const { streamState } = storeToRefs(streamingStore)

const {
  checkStreamStatus,
  subscribeToStreamStatusChanges,
  unsubscribeFromStreamStatusChanges,
} = streamingStore

const isLive = computed(() => {
  const live = streamState.value.broadcastState === 'live'
  console.log(
    `[SocialFeedView] Checking broadcast state: ${streamState.value.broadcastState}. Is Live: ${live}`,
  )
  return live
})

const loadTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver

const isMobile = ref(window.innerWidth < 992)
const handleResize = () => {
  isMobile.value = window.innerWidth < 992
}

const containerStyle = computed((): CSSProperties => {
  const defaultColor = '#fca311'
  if (!currentMoodId.value) {
    return { '--mood-glow-color': defaultColor }
  }
  const currentMood = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )
  if (currentMood && moodColors[currentMood.name]) {
    const color = moodColors[currentMood.name]
    return { '--mood-glow-color': color }
  }
  return { '--mood-glow-color': defaultColor }
})

const textGlowStyle = computed((): CSSProperties => {
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
  window.addEventListener('resize', handleResize)
  postStore.fetchInitialFeed()

  console.log(
    '[SocialFeedView] 🚀 Component mounted. Iniciando comprobación de stream...',
  )
  checkStreamStatus()
  subscribeToStreamStatusChanges()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading.value) {
        postStore.fetchMorePosts()
      }
    },
    { root: null, threshold: 0.5 },
  )

  watch(isLive, (newValue) => {
    if (newValue) {
      nextTick(() => {
        if (streamArea.value) {
          gsap.from(streamArea.value, {
            opacity: 0,
            y: -30,
            scale: 0.98,
            duration: 0.8,
            ease: 'power3.out',
          })
          streamArea.value.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      })
    }
  })

  watch(loadTrigger, (newEl, oldEl) => {
    if (oldEl) {
      observer.unobserve(oldEl)
    }
    if (newEl) {
      observer.observe(newEl)
    }
  })

  const elementsToAnimate = [
    titleArea.value,
    streamArea.value,
    chatArea.value,
    postsArea.value,
  ].filter(Boolean)

  gsap.to(elementsToAnimate, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.8,
    delay: 0.3,
    stagger: 0.2,
    ease: 'power3.out',
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (observer) {
    observer.disconnect()
  }
  unsubscribeFromStreamStatusChanges()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400..900&display=swap');
@keyframes animated-border-glow {
  0% {
    box-shadow:
      0 0 10px 0 var(--mood-glow-color, #fca311),
      inset 0 0 10px 0 var(--mood-glow-color, #fca311);
  }
  50% {
    box-shadow:
      0 0 25px 3px var(--mood-glow-color, #fca311),
      inset 0 0 15px 2px var(--mood-glow-color, #fca311);
  }
  100% {
    box-shadow:
      0 0 10px 0 var(--mood-glow-color, #fca311),
      inset 0 0 10px 0 var(--mood-glow-color, #fca311);
  }
}
.social-feed-layout {
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
  box-sizing: border-box;
  min-height: 100vh;
}
.title-area {
  padding-top: 1rem;
}
.feed-title-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.title-background-container {
  display: inline-block;
  position: relative;
  border-radius: 25px;
  padding: 0.3rem 1.5rem;
  overflow: hidden;
  z-index: 1;
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: animated-border-glow 4s linear infinite;
  transition: box-shadow 0.5s ease;
}
.title-background-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/fondoInfo.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.9;
  z-index: -1;
}
.stream-fade-enter-active,
.stream-fade-leave-active {
  transition: all 0.5s ease;
}
.stream-fade-enter-from,
.stream-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.feed-title {
  font-family: 'Uncial Antiqua', serif;
  text-align: center;
  font-size: 2rem;
  color: #fca311;
  transition: text-shadow 0.5s ease;
  position: relative;
  z-index: 2;
}
.fenicia-subtitle {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 500;
  color: white;
  text-align: center;
  font-size: 0.9rem;
  margin-bottom: 1rem;
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
.stream-area {
  margin-bottom: 1rem;
  aspect-ratio: 16 / 9;
}
.chat-area,
.posts-area {
  margin-bottom: 1rem;
}
.chat-area {
  position: relative;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
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
.chat-area > :deep(.global-chat-container) {
  flex-grow: 1;
  min-height: 0;
}
.posts-area {
  padding-bottom: 1rem;
}
.loading-spinner {
  text-align: center;
  font-size: 1.5rem;
  padding: 2rem;
  color: #999;
}
.fade-in-item {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}
.load-trigger {
  height: 50px;
}
.stream-area.fade-in-item {
  opacity: 1 !important;
  transform: none !important;
}
@media (max-width: 991px) {
  .feed-title-container {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  .feed-title {
    font-size: 1.6rem;
  }
  .title-background-container {
    padding: 0.2rem 1rem;
  }
}
@media (min-width: 992px) {
  .social-feed-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;
    grid-template-areas: 'title chat' 'stream chat' 'posts chat';
    gap: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
    padding: 1rem 2rem 0 180px;
    height: calc(100vh - 80px);
    min-height: auto;
  }
  .title-area {
    grid-area: title;
    padding-top: 0;
  }
  .stream-area {
    grid-area: stream;
  }
  .chat-area {
    grid-area: chat;
    height: 100%;
    max-height: none;
  }
  .posts-area {
    grid-area: posts;
    overflow-y: auto;
    padding-right: 1rem;
  }
  .posts-area::-webkit-scrollbar {
    width: 8px;
  }
  .posts-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .posts-area::-webkit-scrollbar-thumb {
    background-color: #4a525d;
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .feed-title-container {
    position: sticky;
    top: 0;
    flex-direction: row;
    background-color: transparent;
    z-index: 10;
    padding: 1rem 0;
  }
}
</style>
