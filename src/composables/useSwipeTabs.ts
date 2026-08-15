import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const TAB_ROUTES = ['/', '/biblioteca', '/planeador', '/comunidad', '/perfil']

export function useSwipeTabs() {
  const router = useRouter()
  const route = useRoute()
  const el = ref<HTMLElement | null>(null)
  const direction = ref<'forward' | 'backward' | null>(null)

  let startX = 0
  let startY = 0

  function onPointerDown(e: PointerEvent) {
    startX = e.clientX
    startY = e.clientY
  }

  function onPointerUp(e: PointerEvent) {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return

    const currentIndex = TAB_ROUTES.indexOf(route.path)
    if (currentIndex === -1) return

    if (dx < 0) {
      direction.value = 'forward'
      const nextIndex = (currentIndex + 1) % TAB_ROUTES.length
      router.push(TAB_ROUTES[nextIndex])
    } else {
      direction.value = 'backward'
      const prevIndex = (currentIndex - 1 + TAB_ROUTES.length) % TAB_ROUTES.length
      router.push(TAB_ROUTES[prevIndex])
    }
  }

  function clearDirection() {
    direction.value = null
  }

  onMounted(() => {
    el.value?.addEventListener('pointerdown', onPointerDown)
    el.value?.addEventListener('pointerup', onPointerUp)
  })

  onUnmounted(() => {
    el.value?.removeEventListener('pointerdown', onPointerDown)
    el.value?.removeEventListener('pointerup', onPointerUp)
  })

  return { el, direction, clearDirection }
}
