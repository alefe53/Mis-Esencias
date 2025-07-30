// RUTA: src/directives/clickOutside.ts
import type { Directive } from 'vue';

export const vClickOutside: Directive = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function(event: MouseEvent) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    document.body.addEventListener('mousedown', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener('mousedown', el.clickOutsideEvent);
  },
};