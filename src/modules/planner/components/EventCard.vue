<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import type { PlannerEvent } from '@modules/planner/types/planner.types'
import { ClockIcon, MapPinIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  event: PlannerEvent
}>()

const start = computed(() => dayjs(props.event.startDate))
const end = computed(() => (props.event.endDate ? dayjs(props.event.endDate) : null))

const timeLabel = computed(() => {
  const s = start.value.format('HH:mm')
  if (end.value) return `${s} – ${end.value.format('HH:mm')}`
  return s
})

const typeColor = computed(() => {
  return {
    personal: 'bg-accent-50 text-accent-500',
    workshop: 'bg-primary-50 text-primary',
    meeting: 'bg-secondary-100 text-primary',
    reminder: 'bg-warning/15 text-warning',
  }[props.event.type]
})

const statusColor = computed(() => {
  return {
    pending: 'bg-divider',
    in_progress: 'bg-warning',
    completed: 'bg-success',
    cancelled: 'bg-error',
  }[props.event.status]
})
</script>

<template>
  <article class="flex gap-3 p-4 rounded-lg bg-surface shadow-elevation1">
    <div class="shrink-0 flex flex-col items-center justify-center w-14 text-center">
      <span class="text-caption text-text-secondary uppercase tracking-wide">{{ start.format('MMM') }}</span>
      <span class="text-h3 font-bold text-text-primary leading-none">{{ start.format('D') }}</span>
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-small font-semibold text-text-primary truncate flex-1">{{ event.title }}</h3>
        <span :class="['shrink-0 w-2 h-2 rounded-pill mt-1.5', statusColor]" :title="event.status" />
      </div>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
        <span class="inline-flex items-center gap-1 text-caption text-text-secondary">
          <ClockIcon class="w-3.5 h-3.5" /> {{ timeLabel }}
        </span>
        <span :class="['inline-flex items-center px-2 h-5 rounded-pill text-caption font-medium', typeColor]">
          {{ event.type }}
        </span>
      </div>
      <p v-if="event.description" class="text-caption text-text-secondary mt-1.5 line-clamp-2">{{ event.description }}</p>
    </div>
  </article>
</template>
