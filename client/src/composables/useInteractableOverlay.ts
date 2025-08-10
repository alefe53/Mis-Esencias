//composables/useInteractableOverlay.ts
import { watch, onUnmounted, type Ref, onBeforeUpdate } from 'vue'

interface InteractableOptions {
  position: Ref<{ x: number; y: number }>
  size: Ref<{ width: number }>
  onDragEnd?: (pos: { x: number; y: number }) => void
  onResizeEnd?: (size: { width: number }) => void
}

export function useInteractableOverlay(
  target: Ref<HTMLElement | null>,
  resizeHandle: Ref<HTMLElement | null>,
  options: InteractableOptions,
) {
  let isDragging = false
  let isResizing = false
  let offset = { x: 0, y: 0 }
  const startPos = { x: 0, y: 0 }
  let startWidth = 0

  const updateElementStyle = () => {
    if (!target.value) return
    target.value.style.left = `${options.position.value.x}%`
    target.value.style.top = `${options.position.value.y}%`
    target.value.style.width = `${options.size.value.width}%`
  }

  watch(options.position, updateElementStyle, { deep: true })
  watch(options.size, updateElementStyle, { deep: true })

  const onMouseDownTarget = (e: MouseEvent) => {
    if (!target.value || !e.target) return
    const clickedElement = e.target as HTMLElement
    const resizeHandleElement = resizeHandle.value
    if (resizeHandleElement && resizeHandleElement.contains(clickedElement)) {
      return
    }

    e.preventDefault()
    isDragging = true
    const rect = target.value.getBoundingClientRect()
    offset.x = e.clientX - rect.left
    offset.y = e.clientY - rect.top
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseDownResize = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!target.value) return
    isResizing = true
    startPos.x = e.clientX
    startWidth = target.value.offsetWidth
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!target.value || !target.value.parentElement) return
    const parentRect = target.value.parentElement.getBoundingClientRect()

    if (isDragging) {
      let newX = e.clientX - offset.x
      let newY = e.clientY - offset.y

      newX = Math.max(0, Math.min(newX, parentRect.width - target.value.offsetWidth))
      newY = Math.max(0, Math.min(newY, parentRect.height - target.value.offsetHeight))

      const newXPercent = (newX / parentRect.width) * 100
      const newYPercent = (newY / parentRect.height) * 100
      options.position.value = { x: newXPercent, y: newYPercent }
    }

    if (isResizing) {
      const dx = e.clientX - startPos.x
      const newWidthPx = startWidth + dx
      const maxWidthPx = parentRect.width - (options.position.value.x / 100) * parentRect.width
      const minWidthPx = 160

      const finalWidthPx = Math.max(minWidthPx, Math.min(newWidthPx, maxWidthPx))
      const finalWidthPercent = (finalWidthPx / parentRect.width) * 100
      options.size.value = { width: finalWidthPercent }
    }
  }

  const onMouseUp = () => {
    if (isDragging && options.onDragEnd) {
      options.onDragEnd(options.position.value)
    }
    if (isResizing && options.onResizeEnd) {
      options.onResizeEnd(options.size.value)
    }
    isDragging = false
    isResizing = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  const cleanupListeners = () => {
    if (target.value) target.value.removeEventListener('mousedown', onMouseDownTarget)
    if (resizeHandle.value) resizeHandle.value.removeEventListener('mousedown', onMouseDownResize)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  watch(target, (newTarget, oldTarget) => {
    if (oldTarget) {
      cleanupListeners()
    }
    if (newTarget) {
      updateElementStyle()
      newTarget.addEventListener('mousedown', onMouseDownTarget)
      if (resizeHandle.value) resizeHandle.value.addEventListener('mousedown', onMouseDownResize)
    }
  })
  
  onBeforeUpdate(() => {
    cleanupListeners()
  });

  onUnmounted(() => {
    cleanupListeners()
  })
}