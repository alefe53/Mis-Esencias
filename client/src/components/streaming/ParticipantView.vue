<template>
  <div class="participant-view" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue'
import { Track, type TrackPublication } from 'livekit-client'

const props = defineProps<{
  publication: TrackPublication | null
  muted?: boolean
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let currentElement: HTMLElement | null = null

const attachTrack = (pub: TrackPublication) => {
  if (!pub.track || !containerRef.value) return

  const element = pub.track.attach()
  currentElement = element

  if (element instanceof HTMLVideoElement) {
    element.muted = true
    element.playsInline = true
  }

  if (pub.source === Track.Source.Camera) {
    element.classList.add('mirrored')
  }

  containerRef.value.innerHTML = ''
  containerRef.value.appendChild(element)
}

const detachTrack = () => {
  if (currentElement) {
    currentElement.remove()
    currentElement = null
  }
}

watch(
  () => props.publication,
  (newPub, oldPub) => {
    nextTick(() => {
      detachTrack()
      if (newPub) {
        attachTrack(newPub)
      }
    })
  },
  { immediate: true },
)

watch(
  () => props.muted,
  (isMuted) => {
    if (!props.publication?.track) return
    const audioElements = props.publication.track.attachedElements.filter(
      (el) => el.tagName === 'AUDIO',
    )
    audioElements.forEach((audio) => {
      ;(audio as HTMLAudioElement).muted = !!isMuted
    })
  },
  { deep: true },
)

onUnmounted(() => {
  detachTrack()
})
</script>

<style scoped>
.participant-view {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.participant-view :deep(video),
.participant-view :deep(audio) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.participant-view :deep(video.mirrored) {
  transform: scaleX(-1);
}
.participant-view :deep(audio) {
  visibility: hidden;
}
</style>
