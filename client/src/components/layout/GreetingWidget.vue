<template>
  <div class="greeting-svg-container">
    <svg viewBox="0 0 100 100" class="greeting-svg">
      <path 
        id="greeting-curve"
        d="M 15, 48 A 34,34 0 1,1 85,48"
        fill="none"
      />

      <text class="greeting-text">
        <textPath xlink:href="#greeting-curve" startOffset="50%" text-anchor="middle">
          ¿Qué onda, {{ name }}?
        </textPath>
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<style scoped>
.greeting-svg-container {
  position: absolute;
  width: 98px; 
  height: 90px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  overflow: visible;
  
}

.greeting-svg {
  overflow: visible;
}

.greeting-text {
  font-size: 8px;
  font-weight: 600;
  fill: #e5e7eb;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 1);
}
</style>