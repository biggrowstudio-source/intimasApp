<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import {
  CheckIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/vue/24/outline'
import type { Task, TaskPriority } from '@modules/planner/types/planner.types'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  toggle: [id: string, completed: boolean]
  delete: [id: string]
}>()

const priorityConfig: Record<
  TaskPriority,
  { label: string; bgClass: string; textClass: string }
> = {
  high: { label: 'Alta', bgClass: 'bg-error/10', textClass: 'text-error' },
  medium: { label: 'Media', bgClass: 'bg-warning/15', textClass: 'text-warning' },
  low: { label: 'Baja', bgClass: 'bg-success/15', textClass: 'text-success' },
}

const dateLabel = computed(() => {
  if (!props.task.dueDate) return ''
  const d = dayjs(props.task.dueDate)
  if (d.isSame(dayjs(), 'day')) return 'Hoy'
  return d.format('D MMM')
})

const priority = computed(() => priorityConfig[props.task.priority])
</script>

<template>
  <article
    :class="[
      'group flex items-center gap-3 px-3 py-2.5 transition-colors',
      task.completed ? 'opacity-60' : '',
    ]"
  >
    <button
      type="button"
      :aria-pressed="task.completed"
      :aria-label="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
      class="shrink-0 w-6 h-6 rounded-pill border-2 flex items-center justify-center transition-all"
      :class="
        task.completed
          ? 'bg-success border-success text-white'
          : 'border-divider hover:border-accent'
      "
      @click="emit('toggle', task.id, !task.completed)"
    >
      <CheckIcon v-if="task.completed" class="w-3.5 h-3.5" stroke-width="3" />
    </button>

    <p
      :class="[
        'flex-1 text-small text-text-primary truncate',
        task.completed ? 'line-through text-text-secondary' : '',
      ]"
    >
      {{ task.title }}
    </p>

    <span
      v-if="dateLabel"
      class="inline-flex items-center gap-1 text-caption text-text-secondary shrink-0"
    >
      <CalendarIcon class="w-3.5 h-3.5" />
      {{ dateLabel }}
    </span>

    <span
      :class="[
        'shrink-0 inline-flex items-center px-2.5 h-6 rounded-pill text-caption font-semibold',
        priority.bgClass,
        priority.textClass,
      ]"
    >
      {{ priority.label }}
    </span>

    <button
      type="button"
      class="shrink-0 w-8 h-8 rounded-pill text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-background transition-all"
      aria-label="Más opciones"
      @click="emit('delete', task.id)"
    >
      <EllipsisHorizontalIcon class="w-5 h-5 mx-auto" />
    </button>
  </article>
</template>
