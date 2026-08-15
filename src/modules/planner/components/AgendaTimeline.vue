<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import {
  MegaphoneIcon,
  BellAlertIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  HeartIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'
import type { PlannerEvent, PlannerEventType } from '@modules/planner/types/planner.types'
import AppAvatar from '@components/base/AppAvatar.vue'

const props = defineProps<{
  events: PlannerEvent[]
}>()

const emit = defineEmits<{
  delete: [id: string]
  select: [id: string]
}>()

const typeConfig: Record<
  PlannerEventType,
  { icon: typeof CalendarIcon; label: string }
> = {
  workshop: { icon: AcademicCapIcon, label: 'Capacitación' },
  meeting: { icon: UserIcon, label: 'Reunión' },
  reminder: { icon: BellAlertIcon, label: 'Recordatorio' },
  personal: { icon: UserIcon, label: 'Personal' },
}

const statusConfig: Record<
  PlannerEvent['status'],
  { label: string; cardBgClass: string; dotClass: string; icon: typeof CheckCircleIcon }
> = {
  pending: { label: 'Pendiente', cardBgClass: 'bg-error/15', dotClass: 'bg-error', icon: HeartIcon },
  in_progress: { label: 'En progreso', cardBgClass: 'bg-warning/30', dotClass: 'bg-warning', icon: MegaphoneIcon },
  completed: { label: 'Completado', cardBgClass: 'bg-success/15', dotClass: 'bg-success', icon: CheckCircleIcon },
  cancelled: { label: 'Cancelado', cardBgClass: 'bg-primary/10', dotClass: 'bg-primary', icon: XCircleIcon },
}

interface FormattedEvent {
  id: string
  title: string
  description: string | null
  time: string
  ampm: string
  endTime: string | null
  type: PlannerEventType
  cardBgClass: string
  cardBorderClass: string
  dotClass: string
  icon: typeof CalendarIcon
  typeLabel: string
  statusLabel: string
  priorityName: string | null
  priorityColor: string | null
  isoDate: string
  dayLabel: string
  isAdminEvent: boolean
  attendees: { id: string; name: string; avatarUrl: string | null }[]
  attendeesCount: number
  myAttendanceStatus: 'attending' | 'not_attending' | null
}

interface DayGroup {
  isoDate: string
  dayLabel: string
  daySubLabel: string
  isToday: boolean
  isPast: boolean
  events: FormattedEvent[]
}

const sortedEvents = computed<FormattedEvent[]>(() =>
  [...props.events]
    .filter((e) => e.status !== 'cancelled')
    .map((e) => {
      const d = dayjs(e.startDate)
      const cfg = typeConfig[e.type]
      const stat = statusConfig[e.status]
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        time: d.format('HH:mm'),
        ampm: d.format('A').toUpperCase(),
        endTime: e.endDate ? dayjs(e.endDate).format('HH:mm') : null,
        type: e.type,
        cardBgClass: e.type === 'personal' ? 'bg-blush/40' : e.source === 'admin' ? 'bg-primary/5' : stat.cardBgClass,
        cardBorderClass: e.type === 'personal' ? 'border-2 border-blush' : e.source === 'admin' ? 'border-2 border-accent/40' : 'border-2 border-transparent',
        dotClass: e.type === 'personal' ? 'bg-accent' : e.source === 'admin' ? 'bg-accent' : stat.dotClass,
        icon: e.source === 'admin' ? UserGroupIcon : cfg.icon,
        typeLabel: cfg.label,
        statusLabel: stat.label,
        priorityName: e.priority?.name ?? null,
        priorityColor: e.priority?.color ?? null,
        isoDate: d.format('YYYY-MM-DD'),
        dayLabel: d.format('dddd'),
        isAdminEvent: e.source === 'admin',
        attendees: e.attendees ?? [],
        attendeesCount: e.attendeesCount ?? (e.attendees ? e.attendees.length : 0),
        myAttendanceStatus: e.myAttendanceStatus ?? null,
      }
    })
    .sort((a, b) => {
      if (a.isoDate !== b.isoDate) return a.isoDate.localeCompare(b.isoDate)
      return a.time.localeCompare(b.time)
    })
)

const dayGroups = computed<DayGroup[]>(() => {
  const groups: Record<string, DayGroup> = {}
  const today = dayjs().format('YYYY-MM-DD')

  for (const ev of sortedEvents.value) {
    if (!groups[ev.isoDate]) {
      const d = dayjs(ev.isoDate)
      const isToday = ev.isoDate === today
      const isPast = d.isBefore(dayjs(), 'day')
      const dayName = d.format('dddd')
      const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1)

      let subLabel: string
      if (isToday) subLabel = 'Hoy'
      else if (d.isSame(dayjs().add(1, 'day'), 'day')) subLabel = 'Mañana'
      else if (isPast) subLabel = d.format('D [de] MMMM')
      else subLabel = d.format('D [de] MMMM')

      groups[ev.isoDate] = {
        isoDate: ev.isoDate,
        dayLabel: dayNameCap,
        daySubLabel: subLabel,
        isToday,
        isPast,
        events: [],
      }
    }
    groups[ev.isoDate].events.push(ev)
  }

  return Object.values(groups)
})

const totalCount = computed(() => sortedEvents.value.length)
</script>

<template>
  <section>
    <header class="flex items-center justify-between mb-4 px-1">
      <h2 class="text-title font-semibold text-text-primary">Tu agenda</h2>
      <span class="text-caption text-text-secondary">
        {{ totalCount }} {{ totalCount === 1 ? 'evento' : 'eventos' }}
      </span>
    </header>

    <div v-if="totalCount === 0" class="text-center py-10">
      <CalendarIcon class="w-12 h-12 mx-auto text-text-secondary opacity-40 mb-2" />
      <p class="text-small font-semibold text-text-primary">Tu agenda está libre</p>
      <p class="text-caption text-text-secondary mt-1">Crea tu primer evento con el botón rosa.</p>
    </div>

    <div v-else class="space-y-5">
      <div
        v-for="group in dayGroups"
        :key="group.isoDate"
        class="space-y-2.5"
      >
        <header class="flex items-center gap-2 px-1">
          <span
            :class="[
              'inline-flex items-center justify-center min-w-[40px] h-9 px-2.5 rounded-lg text-small font-bold',
              group.isToday
                ? 'bg-accent text-white'
                : group.isPast
                ? 'bg-secondary-100 text-text-secondary'
                : 'bg-blush text-accent-500',
            ]"
          >
            {{ dayjs(group.isoDate).format('D') }}
          </span>
          <div>
            <p class="text-small font-semibold text-text-primary capitalize">
              {{ group.dayLabel }}
            </p>
            <p class="text-caption text-text-secondary">{{ group.daySubLabel }}</p>
          </div>
        </header>

        <div class="space-y-2.5">
          <article
            v-for="event in group.events"
            :key="event.id"
            class="relative grid grid-cols-[42px_16px_1fr] sm:grid-cols-[48px_20px_1fr] items-stretch gap-x-2 sm:gap-x-3 cursor-pointer active:scale-[0.99] transition-transform"
            @click="emit('select', event.id)"
          >
            <div class="flex flex-col items-end justify-start pt-1.5 text-right">
              <span class="text-small font-bold text-text-primary leading-none">{{ event.time }}</span>
              <span class="text-caption text-text-secondary leading-none mt-1">{{ event.ampm }}</span>
            </div>

            <div class="relative flex justify-center pt-3 w-px bg-divider">
              <span
                :class="[
                  'w-3 h-3 rounded-pill ring-4 ring-background shrink-0',
                  event.dotClass,
                ]"
                aria-hidden="true"
              />
            </div>

            <div :class="['rounded-xl p-3.5 min-w-0', event.cardBgClass, event.cardBorderClass]">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="shrink-0 w-7 h-7 rounded-md bg-white/60 flex items-center justify-center text-text-primary">
                  <component :is="event.icon" class="w-4 h-4" />
                </span>
                <h3 class="text-small font-semibold text-text-primary leading-snug flex-1 min-w-0">
                  {{ event.title }}
                </h3>
                <span
                  v-if="event.type === 'personal'"
                  class="shrink-0 inline-flex items-center gap-1 px-2 h-5 rounded-pill bg-blush text-accent text-[10px] font-bold uppercase tracking-wide"
                >
                  Personal
                </span>
                <span
                  v-if="event.isAdminEvent"
                  class="shrink-0 inline-flex items-center gap-1 px-2 h-5 rounded-pill bg-accent text-white text-[10px] font-bold uppercase tracking-wide"
                >
                  <UserGroupIcon class="w-3 h-3" />
                  Admin
                </span>
              </div>

              <div class="flex items-center gap-2 flex-wrap text-caption text-text-secondary">
                <span v-if="event.endTime" class="inline-flex items-center gap-1">
                  {{ event.time }} – {{ event.endTime }}
                </span>
                <span v-else class="inline-flex items-center gap-1">
                  {{ event.time }}
                </span>
                <span v-if="event.description" class="opacity-70">·</span>
                <span v-if="event.description" class="truncate">{{ event.description }}</span>
              </div>

              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <!-- Badge de asistencia personal -->
                <span
                  v-if="event.myAttendanceStatus === 'attending'"
                  class="inline-flex items-center gap-1 px-2 h-6 rounded-pill bg-success/15 text-success text-caption font-semibold"
                >
                  <CheckCircleIcon class="w-3.5 h-3.5" />
                  Asistiré
                </span>
                <span
                  v-else-if="event.myAttendanceStatus === 'not_attending'"
                  class="inline-flex items-center gap-1 px-2 h-6 rounded-pill bg-error/15 text-error text-caption font-semibold"
                >
                  <XCircleIcon class="w-3.5 h-3.5" />
                  No asistiré
                </span>

                <span
                  v-if="event.priorityName && !event.myAttendanceStatus"
                  class="inline-flex items-center gap-1 px-2 h-6 rounded-pill text-caption font-semibold text-white"
                  :style="{ backgroundColor: event.priorityColor ?? '#999' }"
                >
                  {{ event.priorityName }}
                </span>

                <!-- Stack de Asistentes Reales (Embajadoras inscritas) -->
                <div v-if="event.attendees && event.attendees.length > 0" class="inline-flex items-center -space-x-1.5 ml-auto">
                  <AppAvatar
                    v-for="att in event.attendees.slice(0, 3)"
                    :key="att.id"
                    size="xs"
                    :name="att.name"
                    :src="att.avatarUrl"
                    class="ring-2 ring-surface"
                    :title="att.name"
                  />
                  <span
                    v-if="event.attendeesCount > 3"
                    class="w-7 h-7 rounded-full bg-accent-50 text-accent text-[10px] font-black flex items-center justify-center ring-2 ring-surface shadow-xs"
                    :title="`+${event.attendeesCount - 3} más`"
                  >
                    +{{ event.attendeesCount - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

