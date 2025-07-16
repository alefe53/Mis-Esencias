// composables/useClickOutside.ts
import { onMounted, onUnmounted, type Ref } from 'vue';

export function useClickOutside(
  elementRef: Ref<HTMLElement | undefined>,
  callback: (e: MouseEvent) => void
) {
  const handler = (e: MouseEvent) => {
    if (elementRef.value && !elementRef.value.contains(e.target as Node)) {
      callback(e);
    }
  };

  onMounted(() => {
    document.addEventListener('mousedown', handler);
  });

  onUnmounted(() => {
    document.removeEventListener('mousedown', handler);
  });
}