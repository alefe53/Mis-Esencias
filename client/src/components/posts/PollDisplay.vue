<template>
  <div class="poll-container">
    <div
      v-for="option in pollData.options"
      :key="option.id"
      class="poll-option"
      :class="{ voted: hasVoted, 'my-vote': isMyVote(option.id) }"
      @click="handleVote(option.id)"
    >
      <div class="poll-option-text">{{ option.text }}</div>
      <div v-if="hasVoted" class="poll-option-result">
        <span class="vote-percentage"
          >{{ calculatePercentage(option.votes) }}%</span
        >
        <span class="vote-count">({{ option.votes }} votos)</span>
      </div>

      <div v-if="hasVoted" class="progress-bar-background">
        <div
          class="progress-bar-foreground"
          :style="{ width: calculatePercentage(option.votes) + '%' }"
        ></div>
      </div>
    </div>
    <div v-if="hasVoted" class="total-votes">Total: {{ totalVotes }} votos</div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { PollData } from '../../types'

const props = defineProps({
  pollData: {
    type: Object as PropType<PollData>,
    required: true,
  },
  postId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'vote', optionId: number): void
}>()

const hasVoted = computed(() => props.pollData.userVote !== null)

const totalVotes = computed(() => {
  if (!props.pollData.options) return 0
  return props.pollData.options.reduce((sum, option) => sum + option.votes, 0)
})

const isMyVote = (optionId: number) => {
  return props.pollData.userVote === optionId
}

const calculatePercentage = (votes: number) => {
  if (totalVotes.value === 0) return 0
  return Math.round((votes / totalVotes.value) * 100)
}

const handleVote = (optionId: number) => {
  // Solo se puede votar si aún no lo has hecho
  if (!hasVoted.value) {
    emit('vote', optionId)
  }
}
</script>

<style scoped>
.poll-container {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.poll-option {
  position: relative;
  background-color: #3a414b;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}
.poll-option:not(.voted):hover {
  background-color: #4a525d;
  border-color: #3b82f6;
}
.poll-option.voted {
  cursor: not-allowed;
}
.poll-option.my-vote {
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}
.poll-option-text {
  font-weight: 500;
  position: relative;
  z-index: 2;
}
.poll-option-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}
.vote-percentage {
  font-weight: bold;
}
.vote-count {
  color: #a0a0a0;
}
.progress-bar-background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(60, 60, 70, 0.5);
  z-index: 1;
}
.progress-bar-foreground {
  height: 100%;
  background-color: #3b82f6;
  opacity: 0.4;
  transition: width 0.5s ease-out;
}
.total-votes {
  text-align: right;
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.5rem;
}
</style>
