<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'
import { useAuthStore } from '@stores/auth.store'
import AppBottomNav from '@components/layout/AppBottomNav.vue'
import AppToast from '@components/base/AppToast.vue'
import SuspendedOverlay from '@components/layout/SuspendedOverlay.vue'
import AppMobileSplash from '@components/layout/AppMobileSplash.vue'

import { Capacitor } from '@capacitor/core'
import { useOnlineUsers } from '@composables/useOnlineUsers'

const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()
const qc = useQueryClient()
const { joinPresence } = useOnlineUsers()

let notificationsChannel: any = null
let profileChannel: any = null
let globalRealtimeChannel: any = null
let lastSessionLogTimestamp = 0

async function recordActivityHeartbeat() {
  if (!auth.user?.id) return
  try {
    const platform = Capacitor.getPlatform()
    const nowIso = new Date().toISOString()

    // 1. Actualizar última conexión en profiles
    await supabase.from('profiles').update({
      last_seen_at: nowIso,
      device_platform: platform,
    }).eq('user_id', auth.user.id)

    // 2. Insertar registro en el historial de conexiones (user_sessions)
    const now = Date.now()
    if (now - lastSessionLogTimestamp > 10 * 60 * 1000) {
      lastSessionLogTimestamp = now
      await supabase.from('user_sessions').insert({
        user_id: auth.user.id,
        device_platform: platform,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      })
    }
  } catch {
    // Silent ignore
  }
}

// Detección de reactivación al volver a enfocar la app (App Resume)
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    qc.invalidateQueries()
    recordActivityHeartbeat()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('focus', handleVisibilityChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

const setupGlobalRealtime = () => {
  if (globalRealtimeChannel) return
  globalRealtimeChannel = supabase
    .channel('global-app-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
      qc.invalidateQueries({ queryKey: ['community'] })
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
      qc.invalidateQueries({ queryKey: ['community'] })
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workshops' }, () => {
      qc.invalidateQueries({ queryKey: ['workshops'] })
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['library'] })
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'home_content' }, () => {
      qc.invalidateQueries({ queryKey: ['home-content'] })
    })
    .subscribe()
}

const setupNotificationsRealtime = (userId: string) => {
  if (notificationsChannel) {
    supabase.removeChannel(notificationsChannel)
    notificationsChannel = null
  }

  const channelName = `user-notifications-${userId}-${Date.now()}`
  notificationsChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        qc.invalidateQueries({ queryKey: ['notifications'] })
        ui.pushToast({
          title: payload.new.title,
          description: payload.new.body || 'Tienes una nueva notificación.',
          variant: payload.new.type === 'recognition' ? 'success' : 'info',
        })
      }
    )

  notificationsChannel.subscribe()
}

const setupProfileRealtime = (userId: string) => {
  if (profileChannel) {
    supabase.removeChannel(profileChannel)
    profileChannel = null
  }

  const channelName = `user-profile-${userId}-${Date.now()}`
  profileChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        if (payload.new && auth.profile) {
          auth.profile.is_suspended = payload.new.is_suspended
          auth.profile.isSuspended = payload.new.is_suspended
          if (payload.new.role) {
            auth.profile.role = payload.new.role
          }
        }
      }
    )

  profileChannel.subscribe()
}

const cleanupChannels = () => {
  if (notificationsChannel) {
    supabase.removeChannel(notificationsChannel)
    notificationsChannel = null
  }
  if (profileChannel) {
    supabase.removeChannel(profileChannel)
    profileChannel = null
  }
  if (globalRealtimeChannel) {
    supabase.removeChannel(globalRealtimeChannel)
    globalRealtimeChannel = null
  }
}

watch(
  () => auth.user?.id,
  (newId) => {
    if (newId) {
      recordActivityHeartbeat()
      joinPresence()
      setupNotificationsRealtime(newId)
      setupProfileRealtime(newId)
      setupGlobalRealtime()
    } else {
      cleanupChannels()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  cleanupChannels()
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', handleVisibilityChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})

const showBottomNav = computed(() => {
  if (!auth.isAuthenticated) return false
  const path = route.path
  return !path.startsWith('/auth') && !path.startsWith('/full')
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Intro Animado Femenino en Pantalla Completa / Móvil -->
    <AppMobileSplash />

    <!-- Pantalla de Bloqueo de Suspensión en Tiempo Real -->
    <SuspendedOverlay v-if="auth.isSuspended" />

    <RouterView />


    <AppBottomNav v-if="showBottomNav" />

    <AppToast :toasts="ui.toasts" @dismiss="ui.dismissToast" />
  </div>
</template>

