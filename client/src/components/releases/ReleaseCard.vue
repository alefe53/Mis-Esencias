<template>
  <div class="release-card">
    <img
      v-if="release.coverArtUrl"
      :src="release.coverArtUrl"
      :alt="release.title"
      class="release-cover"
    />
    <div v-else class="release-cover placeholder-cover"></div>
    <div class="release-info">
      <h3 class="release-title">{{ release.title }}</h3>
      <p class="release-year">{{ release.releaseYear }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReleaseSummary } from '../../types'

defineProps<{
  release: ReleaseSummary
}>()
</script>

<style scoped>
.release-card {
  cursor: pointer;
  text-align: left;
  color: #fff;
}

.release-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  background-color: #333;

  border: 2px solid transparent;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  /*border: 2px solid #a7e4ff; */
}

.release-card:hover .release-cover {
  transform: translateY(-8px);
  border-color: #a7e4ff;
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 25px rgba(167, 228, 255, 0.7);
}

.release-info {
  margin-top: 1rem;
}

.release-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}

.release-year {
  font-size: 0.8rem;
  opacity: 0.7;
  color: #ccc;
  margin-top: 0.25rem;
}
</style>
