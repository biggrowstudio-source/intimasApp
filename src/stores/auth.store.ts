import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, SessionUser, UserRole } from '@/types/auth.types'
import { authService } from '@/services/supabase/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SessionUser | null>(null)
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed<UserRole>(() => profile.value?.role ?? 'ambassador')
  const isSuspended = computed(() => {
    if (!profile.value) return false
    if (role.value === 'admin' || role.value === 'super_admin') return false
    return !!(profile.value.is_suspended || profile.value.isSuspended)
  })

  async function initialize() {
    if (initialized.value) return
    isLoading.value = true
    try {
      const session = await authService.getSession()
      if (session?.user) {
        user.value = { id: session.user.id, email: session.user.email ?? '' }
        await loadProfile()
      }
    } finally {
      initialized.value = true
      isLoading.value = false
    }
  }

  async function loadProfile() {
    if (!user.value) return
    const data = await authService.getProfile(user.value.id)
    profile.value = data
  }

  async function signIn(email: string, password: string) {
    isLoading.value = true
    try {
      const data = await authService.signIn(email, password)
      if (data.user) {
        user.value = { id: data.user.id, email: data.user.email ?? email }
        await loadProfile()
      }
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(email: string, password: string, firstName: string, lastName: string) {
    isLoading.value = true
    try {
      const data = await authService.signUp(email, password, firstName, lastName)
      if (data.user) {
        user.value = { id: data.user.id, email: data.user.email ?? email }
        await loadProfile()
      }
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    await authService.signOut()
    user.value = null
    profile.value = null
  }

  async function resetPassword(email: string) {
    await authService.resetPassword(email)
  }

  return {
    user,
    profile,
    isLoading,
    initialized,
    isAuthenticated,
    role,
    isSuspended,
    initialize,
    loadProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
})
