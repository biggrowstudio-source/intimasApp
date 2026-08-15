import { computed, onUnmounted, watch } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'

export function useNotifications() {
  const auth = useAuthStore()
  const qc = useQueryClient()

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', auth.user?.id],
    queryFn: async () => {
      if (!auth.user?.id) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', auth.user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: computed(() => !!auth.user?.id),
  })

  const unreadCount = computed(() => {
    if (!notifications.value) return 0
    return notifications.value.filter((n) => !n.read_at).length
  })

  let channel: any = null

  const subscribeRealtime = () => {
    if (channel) return
    const userId = auth.user?.id
    if (!userId) return

    const uniqueId = Math.random().toString(36).substring(2, 9)
    channel = supabase
      .channel(`realtime-notifications-${userId}-${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['notifications', userId] })
        }
      )
      .subscribe()
  }

  const unsubscribeRealtime = () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  // Subscribe when user changes
  watch(
    () => auth.user?.id,
    (newId) => {
      unsubscribeRealtime()
      if (newId) {
        subscribeRealtime()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    unsubscribeRealtime()
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
  }
}
