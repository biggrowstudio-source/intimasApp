import { ref, watch, onUnmounted } from 'vue'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'

export interface OnlineUser {
  user_id: string
  firstName: string
  lastName: string
  photoUrl: string | null
  role: string | null
  onlineAt: string
}

const onlineUsers = ref<OnlineUser[]>([])
let presenceChannel: any = null

export function useOnlineUsers() {
  const auth = useAuthStore()

  const joinPresence = () => {
    if (presenceChannel) return
    const userId = auth.user?.id
    if (!userId || !auth.profile) return

    const channelName = 'online-users-global'
    presenceChannel = supabase.channel(channelName)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const usersList: OnlineUser[] = []
        for (const id in state) {
          const presences = state[id] as any[]
          if (presences && presences.length > 0) {
            const user = presences[presences.length - 1]
            if (user && user.user_id && !usersList.some((u) => u.user_id === user.user_id)) {
              usersList.push({
                user_id: user.user_id,
                firstName: user.firstName || 'Embajadora',
                lastName: user.lastName || '',
                photoUrl: user.photoUrl || null,
                role: user.role || null,
                onlineAt: user.onlineAt || new Date().toISOString(),
              })
            }
          }
        }
        onlineUsers.value = usersList
      })
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        for (const p of newPresences ?? []) {
          if (p.user_id && !onlineUsers.value.some((u) => u.user_id === p.user_id)) {
            onlineUsers.value.push({
              user_id: p.user_id,
              firstName: p.firstName || 'Embajadora',
              lastName: p.lastName || '',
              photoUrl: p.photoUrl || null,
              role: p.role || null,
              onlineAt: p.onlineAt || new Date().toISOString(),
            })
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        for (const p of leftPresences ?? []) {
          if (p.user_id) {
            onlineUsers.value = onlineUsers.value.filter((u) => u.user_id !== p.user_id)
          }
        }
      })

    presenceChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: userId,
          firstName: auth.profile?.firstName || (auth.profile as any)?.first_name || 'Embajadora',
          lastName: auth.profile?.lastName || (auth.profile as any)?.last_name || '',
          photoUrl: auth.profile?.photoUrl || (auth.profile as any)?.photo_url || null,
          role: auth.profile?.role || null,
          onlineAt: new Date().toISOString(),
        })
      }
    })
  }

  const leavePresence = () => {
    if (presenceChannel) {
      presenceChannel.untrack()
      supabase.removeChannel(presenceChannel)
      presenceChannel = null
    }
  }

  watch(
    () => [auth.user?.id, auth.profile],
    ([newId]) => {
      if (newId) {
        joinPresence()
      } else {
        leavePresence()
        onlineUsers.value = []
      }
    },
    { immediate: true, deep: true }
  )

  onUnmounted(() => {
    // Keep presence channel alive globally
  })

  return {
    onlineUsers,
    joinPresence,
    leavePresence,
  }
}
