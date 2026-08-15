<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { BellIcon, PlusIcon } from '@heroicons/vue/24/outline'

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

defineProps<{
  showNewEvent?: boolean
}>()

defineEmits<{
  newEvent: []
}>()
</script>

<template>
  <header class="flex items-start justify-between gap-3 pt-1">
    <div class="min-w-0 flex-1">
      <h1 class="text-display font-editorial text-text-primary leading-none mb-2">
        Planeador
      </h1>
      <p class="text-small text-text-secondary leading-snug max-w-sm">
        Organiza tu día, cumple tus metas y sigue creciendo.
      </p>
    </div>

    <div class="flex flex-col items-end gap-2.5 mt-1">
      <RouterLink
        to="/notificaciones"
        class="relative shrink-0 w-11 h-11 rounded-pill bg-surface shadow-elevation1 flex items-center justify-center hover:shadow-elevation2 transition-shadow"
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

      <button
        v-if="showNewEvent"
        type="button"
        class="inline-flex items-center gap-1.5 h-11 px-4 rounded-pill bg-blush text-accent-500 text-small font-semibold hover:bg-accent hover:text-white transition-colors whitespace-nowrap"
        @click="$emit('newEvent')"
      >
        <PlusIcon class="w-4 h-4" />
        Nuevo evento
      </button>
    </div>
  </header>
</template>
