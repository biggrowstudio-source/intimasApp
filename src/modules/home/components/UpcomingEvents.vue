<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import {
  ClockIcon,
  ChevronRightIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  BellAlertIcon,
} from '@heroicons/vue/24/outline'
import type { UpcomingEvent, PlannerEventType } from '@modules/home/types/home.types'

const props = defineProps<{
  events: UpcomingEvent[]
}>()

interface FormattedEvent {
  id: string
  title: string
  description: string | null
  month: string
  day: string
  weekday: string
  time: string
  endTime: string | null
  type: PlannerEventType
  typeLabel: string
  typeIcon: typeof ClockIcon
  typeClass: string
}

const typeConfig: Record<PlannerEventType, { label: string; icon: typeof ClockIcon; class: string }> = {
  personal: { label: 'Personal', icon: UserIcon, class: 'bg-blush text-accent-500' },
  workshop: { label: 'Capacitación', icon: AcademicCapIcon, class: 'bg-primary-50 text-primary' },
  meeting: { label: 'Reunión', icon: CalendarIcon, class: 'bg-mint text-success' },
  reminder: { label: 'Recordatorio', icon: BellAlertIcon, class: 'bg-warning/15 text-warning' },
}

const formatted = computed<FormattedEvent[]>(() =>
  props.events.map((e) => {
    const d = dayjs(e.date)
    const end = e.endDate ? dayjs(e.endDate) : null
    const cfg = typeConfig[e.type]
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      month: d.format('MMM').toUpperCase(),
      day: d.format('D'),
      weekday: d.format('ddd').toUpperCase().replace('.', ''),
      time: d.format('HH:mm'),
      endTime: end ? end.format('HH:mm') : null,
      type: e.type,
      typeLabel: cfg.label,
      typeIcon: cfg.icon,
      typeClass: cfg.class,
    }
  }),
)
</script>

<template>
  <div v-if="formatted.length > 0" class="space-y-2.5">
      <RouterLink
        v-for="event in formatted"
        :key="event.id"
        to="/planeador"
        class="group flex items-center gap-3 p-3 rounded-xl bg-surface shadow-elevation1 hover:shadow-elevation2 active:scale-[0.99] transition-all"
      >
        <div class="shrink-0 flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-lg bg-blush">
          <span class="text-caption font-semibold uppercase tracking-wide text-accent leading-none">{{ event.month }}</span>
          <span class="text-h3 font-editorial font-bold text-primary leading-none my-0.5">{{ event.day }}</span>
          <span class="text-caption font-semibold uppercase tracking-wide text-accent leading-none mt-0.5">{{ event.time }}</span>
        </div>

        <div class="flex-1 min-w-0 border-l border-divider pl-3">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-title font-editorial font-semibold text-text-primary leading-snug line-clamp-1 flex-1 min-w-0">
              {{ event.title }}
            </h3>
          </div>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-secondary">
            <span class="inline-flex items-center gap-1">
              <ClockIcon class="w-3 h-3" />
              <span v-if="event.endTime && event.endTime !== event.time">{{ event.time }} – {{ event.endTime }}</span>
              <span v-else>{{ event.time }}</span>
            </span>
            <span
              :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-pill font-medium', event.typeClass]"
            >
              <component :is="event.typeIcon" class="w-3 h-3" />
              {{ event.typeLabel }}
            </span>
          </div>
          <p v-if="event.description" class="text-caption text-text-secondary mt-1 line-clamp-1">
            {{ event.description }}
          </p>
        </div>

        <ChevronRightIcon class="shrink-0 w-4 h-4 text-text-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </RouterLink>
  </div>
</template>
