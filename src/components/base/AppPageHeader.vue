<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { BellIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title: string
  description?: string
  hideNotificationBell?: boolean
}>()

const auth = useAuthStore()

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
  <header class="flex items-start justify-between gap-3 pt-1 mb-5">
    <div class="min-w-0 flex-1">
      <h1 class="text-display font-editorial text-text-primary leading-none mb-2">
        {{ title }}
      </h1>
      <p v-if="description" class="text-small text-text-secondary leading-snug max-w-md">
        {{ description }}
      </p>
    </div>

    <div class="flex flex-col items-end gap-2.5 mt-1 shrink-0">
      <!-- Campana de Notificaciones (Siempre visible en todas las pantallas) -->
      <RouterLink
        v-if="!hideNotificationBell"
        to="/notificaciones"
        class="relative shrink-0 w-11 h-11 rounded-pill bg-surface border border-divider/60 shadow-elevation1 flex items-center justify-center hover:shadow-elevation2 hover:border-accent/40 transition-all"
        aria-label="Notificaciones"
      >
        <BellIcon class="w-5 h-5 text-text-primary" />
        <span
          v-if="unread && unread > 0"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-blush shadow-sm"
        >
          {{ unread > 9 ? '9+' : unread }}
        </span>
      </RouterLink>

      <!-- Slot para botones de acción adicional (Ej: Nuevo workshop, Nuevo recurso) -->
      <slot name="actions" />
    </div>
  </header>
</template>
