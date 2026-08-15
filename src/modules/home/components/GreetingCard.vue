<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@stores/auth.store'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useHomeContentBySlot } from '@modules/home/composables/useHomeContent'
import type { HomeContent } from '@modules/home/types/home-content.types'
import { BellIcon } from '@heroicons/vue/24/outline'
import dayjs from '@utils/dayjs'

import OnlineUsersButton from '@components/common/OnlineUsersButton.vue'
import UserProfileMenu from '@components/common/UserProfileMenu.vue'

const auth = useAuthStore()

const firstName = computed(() => auth.profile?.firstName ?? 'Embajadora')

const today = computed(() => {
  const d = dayjs()
  return d.format('dddd').charAt(0).toUpperCase() + d.format('dddd').slice(1)
})

const { data: greetings } = useHomeContentBySlot('greeting')

const period = computed<'morning' | 'afternoon' | 'evening'>(() => {
  const hour = dayjs().hour()
  if (hour < 12) return 'morning'
  if (hour < 19) return 'afternoon'
  return 'evening'
})

const subtitle = computed(() => {
  const match = greetings.value?.find((g: HomeContent) => g.variant === period.value)
  return match?.title ?? 'Bienvenida a Intimas'
})

const { data: unread } = useQuery({
  queryKey: ['notifications', 'unread-count', auth.user?.id],
  queryFn: async () => {
    if (!auth.user?.id) return 0
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
      .is('read_at', null)
      .is('archived_at', null)
    if (error) throw error
    return count ?? 0
  },
  enabled: !!auth.user?.id,
  refetchInterval: 30000,
})
</script>

<template>
  <header class="flex items-center gap-2">
    <UserProfileMenu class="shrink-0" />

    <div class="flex-1 min-w-0">
      <p class="text-caption text-text-secondary capitalize">{{ today }}</p>
      <h1 class="text-subtitle font-editorial text-text-primary leading-tight flex items-center gap-1">
        Hola, {{ firstName }}
        <span class="text-accent" aria-hidden="true">✦</span>
      </h1>
      <p class="text-caption text-text-secondary mt-0.5 line-clamp-1">{{ subtitle }}</p>
    </div>

    <!-- Botón de Usuarias Conectadas en Tiempo Real (al lado de notificaciones) -->
    <OnlineUsersButton />

    <RouterLink
      to="/notificaciones"
      class="relative shrink-0 w-10 h-10 rounded-pill bg-surface shadow-elevation1 flex items-center justify-center hover:shadow-elevation2 transition-shadow"
      aria-label="Notificaciones"
    >
      <BellIcon class="w-5 h-5 text-text-primary" />
      <span
        v-if="unread && unread > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-blush"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </RouterLink>
  </header>
</template>
