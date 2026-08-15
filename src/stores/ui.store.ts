import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Theme = 'light' | 'dark'
type Locale = 'es' | 'en'

export interface ToastItem {
  id: number
  title: string
  description?: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>('light')
  const locale = ref<Locale>('es')
  const sidebarOpen = ref(false)
  const activeMobileMenu = ref<'none' | 'fab' | 'more'>('none')
  const toasts = ref<ToastItem[]>([])
  let toastId = 0

  const isDark = computed(() => theme.value === 'dark')

  function openFab() { activeMobileMenu.value = 'fab' }
  function openMoreMenu() { activeMobileMenu.value = 'more' }
  function closeMobileMenus() { activeMobileMenu.value = 'none' }
  function toggleFab() {
    activeMobileMenu.value = activeMobileMenu.value === 'fab' ? 'none' : 'fab'
  }
  function toggleMoreMenu() {
    activeMobileMenu.value = activeMobileMenu.value === 'more' ? 'none' : 'more'
  }


  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  function applyTheme() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme.value === 'dark')
    }
  }

  function setLocale(value: Locale) {
    locale.value = value
  }

  function openSidebar() { sidebarOpen.value = true }
  function closeSidebar() { sidebarOpen.value = false }
  function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }

  function pushToast(toast: Omit<ToastItem, 'id'>) {
    const id = ++toastId
    const item: ToastItem = { id, duration: 3500, ...toast }
    toasts.value.push(item)
    if (item.duration && item.duration > 0) {
      setTimeout(() => dismissToast(id), item.duration)
    }
    return id
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    theme,
    locale,
    sidebarOpen,
    activeMobileMenu,
    toasts,
    isDark,
    toggleTheme,
    setLocale,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    openFab,
    openMoreMenu,
    closeMobileMenus,
    toggleFab,
    toggleMoreMenu,
    pushToast,
    dismissToast,
  }

})
