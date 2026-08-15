<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import dayjs from '@utils/dayjs'
import {
  BellAlertIcon,
  CalendarIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  BellIcon,
  InformationCircleIcon,
  MegaphoneIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import AppPageHeader from '@components/base/AppPageHeader.vue'

const auth = useAuthStore()
const ui = useUiStore()
const qc = useQueryClient()
const filter = ref<'all' | 'unread'>('all')

const { data: notifications, isLoading } = useQuery({
  queryKey: ['notifications', auth.user?.id],
  queryFn: async () => {
    if (!auth.user?.id) return []
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.user.id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data ?? []
  },
  enabled: computed(() => !!auth.user?.id),
})

const filteredNotifications = computed(() => {
  if (!notifications.value) return []
  if (filter.value === 'unread') {
    return notifications.value.filter((n) => !n.read_at)
  }
  return notifications.value
})

const markRead = useMutation({
  mutationFn: async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
})

const markAllRead = useMutation({
  mutationFn: async () => {
    if (!auth.user?.id) return
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', auth.user.id)
      .is('read_at', null)
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    ui.pushToast({ title: 'Notificaciones marcadas como leídas', variant: 'success' })
  },
})

const deleteNotification = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
  },
})

const iconFor = (n: any) => {
  const title = (n.title || '').toLowerCase()
  const body = (n.body || '').toLowerCase()

  // Asistencia confirmada
  if (title.includes('asistir\u00e1') && !title.includes('no asistir\u00e1')) {
    return CheckCircleIcon
  }
  // Rechazo de asistencia
  if (title.includes('no asistir\u00e1') || body.includes('no podr\u00e1 asistir')) {
    return XCircleIcon
  }

  // Status check (Approved/Confirmed vs Rejected/Cancelled)
  if (
    title.includes('aprobado') || title.includes('aprobada') || title.includes('aprobó') ||
    title.includes('confirmado') || title.includes('confirmada') || title.includes('confirmó')
  ) {
    return CheckCircleIcon
  }
  if (
    title.includes('rechazado') || title.includes('rechazada') || title.includes('rechazó') ||
    title.includes('cancelado') || title.includes('cancelada') || title.includes('canceló')
  ) {
    return XCircleIcon
  }

  // Commission/Payment check
  if (title.includes('comisi\u00f3n') || title.includes('pago') || title.includes('pagada') || title.includes('pagado')) {
    return CurrencyDollarIcon
  }

  // Type-based defaults
  switch (n.type) {
    case 'workshop': return AcademicCapIcon
    case 'event': return CalendarIcon
    case 'planner': return CalendarIcon
    case 'community': return ChatBubbleLeftIcon
    case 'recognition': return SparklesIcon
    case 'system': default: return BellIcon
  }
}

const colorFor = (n: any) => {
  const title = (n.title || '').toLowerCase()
  const body = (n.body || '').toLowerCase()

  // Asistencia confirmada
  if (title.includes('asistir\u00e1') && !title.includes('no asistir\u00e1')) {
    return 'text-success bg-mint/15 border-success/20'
  }
  // Rechazo de asistencia
  if (title.includes('no asistir\u00e1') || body.includes('no podr\u00e1 asistir')) {
    return 'text-error bg-error/10 border-error/20'
  }

  if (
    title.includes('aprobado') || title.includes('aprobada') || title.includes('aprobó') ||
    title.includes('confirmado') || title.includes('confirmada') || title.includes('confirmó')
  ) {
    return 'text-success bg-mint/15 border-success/20'
  }
  if (
    title.includes('rechazado') || title.includes('rechazada') || title.includes('rechazó') ||
    title.includes('cancelado') || title.includes('cancelada') || title.includes('canceló')
  ) {
    return 'text-error bg-error/10 border-error/20'
  }
  if (title.includes('comisi\u00f3n') || title.includes('pago') || title.includes('pagada') || title.includes('pagado')) {
    return 'text-warning bg-warning/10 border-warning/20'
  }

  switch (n.type) {
    case 'workshop': return 'text-accent bg-accent/10 border-accent/25'
    case 'event': return 'text-accent bg-blush border-accent/25'
    case 'planner': return 'text-warning bg-warning/10 border-warning/20'
    case 'community': return 'text-accent bg-accent/10 border-accent/20'
    case 'recognition': return 'text-success bg-mint/15 border-success/20'
    case 'system': default: return 'text-text-secondary bg-light border-divider'
  }
}

function cleanTitle(title: string): string {
  // Removes emoji characters from title text
  return title.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
}

const unreadCount = computed(() => notifications.value?.filter((n) => !n.read_at).length ?? 0)

/** Extracts structured parts from notification body */
function parseBody(n: any): { workshop?: string; date?: string; respondedAt?: string; reason?: string; extra?: string } {
  const body: string = n.body || ''
  const result: { workshop?: string; date?: string; respondedAt?: string; reason?: string; extra?: string } = {}

  // Extract workshop name from quotes
  const workshopMatch = body.match(/"([^"]+)"/);
  if (workshopMatch) result.workshop = workshopMatch[1]

  // Extract date in parentheses
  const dateMatch = body.match(/\(([^)]+)\)/)
  if (dateMatch) result.date = dateMatch[1]

  // Extract time: "Respondió a las HH:MM"
  const timeMatch = body.match(/[Rr]espondió a las ([\d:]+(?:\s*[ap]\.?m\.?)?)/i)
  if (timeMatch) result.respondedAt = timeMatch[1]

  // Extract reason: "Motivo: ..."
  const reasonMatch = body.match(/Motivo:\s*([^.]+)/)
  if (reasonMatch) result.reason = reasonMatch[1].trim()

  return result
}
</script>

<template>
  <AppPageHeader
    title="Notificaciones"
    description="Mantente al día con las novedades, registros y actualizaciones de tu red."
  >
    <template #actions>
      <button
        v-if="unreadCount > 0"
        type="button"
        class="text-caption text-accent font-bold hover:underline transition-all mt-1"
        @click="markAllRead.mutate()"
      >
        Marcar leídas
      </button>
    </template>
  </AppPageHeader>

  <div class="space-y-4">
    <AppTabs
      v-model="filter"
      :options="[
        { label: 'Todas', value: 'all' },
        { label: `No leídas${unreadCount ? ` (${unreadCount})` : ''}`, value: 'unread' },
      ]"
    />

    <div v-if="isLoading" class="space-y-3">
      <AppSkeleton v-for="i in 4" :key="i" height="72px" />
    </div>

    <div v-else-if="!filteredNotifications || filteredNotifications.length === 0">
      <AppEmptyState title="Sin notificaciones" description="Cuando recibas novedades aparecerán aquí." icon-name="sparkles" />
    </div>

    <TransitionGroup
      v-else
      tag="div"
      name="notif-list"
      class="space-y-3"
    >
      <div
        v-for="n in filteredNotifications"
        :key="n.id"
        class="group relative w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-300 border shadow-xs cursor-pointer"
        :class="!n.read_at ? 'border-accent/30 bg-accent/[0.02] ring-1 ring-accent/5' : 'border-divider bg-surface hover:bg-light/30'"
        @click="!n.read_at && markRead.mutate(n.id)"
      >
        <!-- Icon -->
        <div :class="['shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5', colorFor(n)]">
          <component :is="iconFor(n)" class="w-4.5 h-4.5" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Title row -->
          <div class="flex items-center gap-2 mb-1">
            <p class="text-small font-bold text-text-primary leading-tight">
              {{ cleanTitle(n.title) }}
            </p>
            <span v-if="!n.read_at" class="shrink-0 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </div>

          <!-- Workshop name chip -->
          <div v-if="parseBody(n).workshop" class="mb-1.5">
            <span class="inline-flex items-center gap-1 px-2 h-5 rounded-pill bg-accent/10 text-accent text-[10px] font-semibold truncate max-w-full">
              <component :is="iconFor(n)" class="w-3 h-3 shrink-0" />
              {{ parseBody(n).workshop }}
            </span>
          </div>

          <!-- Meta row: date + time -->
          <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
            <span v-if="parseBody(n).date" class="inline-flex items-center gap-1">
              <CalendarIcon class="w-3 h-3" />
              {{ parseBody(n).date }}
            </span>
            <span v-if="parseBody(n).respondedAt" class="inline-flex items-center gap-1">
              <component :is="ClockIcon" class="w-3 h-3" />
              Respondió a las {{ parseBody(n).respondedAt }}
            </span>
          </div>

          <!-- Reason (if rejected) -->
          <p v-if="parseBody(n).reason" class="mt-1 text-[11px] text-error/80 italic">
            "{{ parseBody(n).reason }}"
          </p>

          <!-- Timestamp -->
          <p class="mt-1.5 text-[10px] text-text-secondary/60 font-medium">
            {{ dayjs(n.created_at).fromNow() }}
          </p>
        </div>

        <!-- Delete button -->
        <button
          type="button"
          class="shrink-0 p-1.5 rounded-xl text-text-secondary hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 active:scale-95"
          title="Eliminar notificación"
          @click.stop="deleteNotification.mutate(n.id)"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notif-list-enter-active,
.notif-list-leave-active {
  transition: all 0.3s ease;
}
.notif-list-enter-from,
.notif-list-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-12px);
}
</style>
