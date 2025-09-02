import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollState(threshold = 50) {
  const isScrolled = ref(false)
  let scrollableContainer: HTMLElement | null = null

  const handleScroll = () => {
    if (scrollableContainer) {
      isScrolled.value = scrollableContainer.scrollTop > threshold
    }
  }

  onMounted(() => {
    scrollableContainer = document.getElementById('app-container')
    if (scrollableContainer) {
      scrollableContainer.addEventListener('scroll', handleScroll, {
        passive: true,
      })
      handleScroll()
    }
  })

  onUnmounted(() => {
    if (scrollableContainer) {
      scrollableContainer.removeEventListener('scroll', handleScroll)
    }
  })

  return { isScrolled }
}
