<template>
  <div 
    v-if="currentMoodId !== null"
    class="mood-glow-container"
    :style="glowStyle"
    :key="currentMoodId"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../../stores/playerStore';
import { moodColors } from '../../constants/moods';

const playerStore = usePlayerStore();
const { currentMoodId, availableMoods } = storeToRefs(playerStore);

const currentColor = computed(() => {
  if (currentMoodId.value === null) {
    return 'transparent';
  }
  const mood = availableMoods.value.find(m => m.id === currentMoodId.value);
  return mood ? moodColors[mood.name] || 'transparent' : 'transparent';
});

const glowStyle = computed(() => {
  const color = currentColor.value;
  if (color === 'transparent') return {};
  
  return {
    '--glow-color': color,
  };
});
</script>

<style scoped>
.mood-glow-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.mood-glow-container::before,
.mood-glow-container::after {
  content: '';
  position: absolute;
  top: 0;
  height: 100%;
  
  width: 35vw; 
  
  filter: blur(80px);

  transition: background 1.5s ease;
}

.mood-glow-container::before {
  left: 0;
  background: linear-gradient(to right, 
    var(--glow-color, transparent), 
    transparent 80%
  );
  animation: pulse-glow 8s infinite ease-in-out;
}

.mood-glow-container::after {
  right: 0;
  background: linear-gradient(to left, 
    var(--glow-color, transparent), 
    transparent 80%
  );

  animation: pulse-glow 8s -4s infinite ease-in-out;
}


@keyframes pulse-glow {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    opacity: 0.4;
  }
}
</style>