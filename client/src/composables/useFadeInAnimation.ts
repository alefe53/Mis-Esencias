import { watch, onMounted, type Ref } from 'vue'
import gsap from 'gsap'

export function useFadeInAnimation(targets: Ref<HTMLElement | null>[]) {
  const animate = (elements: (HTMLElement | null)[]) => {
    const validElements = elements.filter(Boolean) as HTMLElement[]

    if (validElements.length > 0) {
      gsap.to(validElements, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2,
        stagger: 0.2,
        ease: 'power3.out',
      })
    }
  }

  onMounted(() => {
    const initialElements = targets
      .map((target) => target.value)
      .filter((el) => el !== null)
    animate(initialElements)

    targets.forEach((targetRef) => {
      watch(targetRef, (newElement, oldElement) => {
        if (newElement && !oldElement) {
          animate([newElement])
        }
      })
    })
  })
}
