<template>
  <div class="transition-container" ref="containerRef">
    <img
      src="/adflogo.png"
      alt="ADF Logo"
      class="transition-logo"
      ref="logoRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore'
import gsap from 'gsap'

const router = useRouter()
const uiStore = useUiStore()

const containerRef = ref<HTMLElement | null>(null)
const logoRef = ref<HTMLImageElement | null>(null)

onMounted(() => {
  uiStore.setTransitionState(true)

  const tl = gsap.timeline({
    onComplete: () => {
      router.push({ name: 'music' })
      uiStore.setTransitionState(false)
    },
  })

  gsap.set(logoRef.value, { opacity: 0, scale: 0.8 })

  tl.to(logoRef.value, {
    opacity: 1,
    scale: 1,
    duration: 1.5,
    ease: 'power2.out',
    delay: 0.5,
  })
    .to(
      logoRef.value,
      {
        filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 1))',
        duration: 1,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      },
      '-=0.5',
    )
    .to(logoRef.value, {
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
      delay: 0.2,
    })
})
</script>

<style scoped>
.transition-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #111827;
  z-index: 9999;
}

.transition-logo {
  max-width: 600px;
  width: 50%;
  height: auto;
  opacity: 0;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.7));
}

@media (max-width: 768px) {
  .transition-logo {
    width: 85%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .transition-logo {
    width: 90%;
  }
}
</style>
