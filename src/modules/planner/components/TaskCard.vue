<script setup lang="ts">
import type { Task } from '@modules/planner/types/planner.types'
import { TrashIcon } from '@heroicons/vue/24/outline'
import dayjs from '@utils/dayjs'

const props = defineProps<{
  task: Task
}>()

defineEmits<{
  toggle: [id: string, completed: boolean]
  delete: [id: string]
}>()

const priorityClass = {
  low: 'text-text-secondary',
  medium: 'text-warning',
  high: 'text-error',
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 p-3 rounded-md bg-surface transition-opacity',
      task.completed ? 'opacity-60' : '',
    ]"
  >
    <button
      type="button"
      :aria-pressed="task.completed"
      :aria-label="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
      class="shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center transition-colors"
      :class="task.completed ? 'bg-success border-success text-white' : 'border-divider hover:border-accent'"
      @click="$emit('toggle', task.id, !task.completed)"
    >
      <svg v-if="task.completed" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </button>

    <div class="flex-1 min-w-0">
      <p
        :class="[
          'text-small text-text-primary truncate',
          task.completed ? 'line-through text-text-secondary' : '',
        ]"
      >
        {{ task.title }}
      </p>
      <div class="flex items-center gap-2 mt-0.5 text-caption">
        <span v-if="task.dueDate" class="text-text-secondary">
          {{ dayjs(task.dueDate).format('D MMM') }}
        </span>
        <span :class="['font-semibold uppercase tracking-wide', priorityClass[task.priority]]">
          {{ task.priority }}
        </span>
      </div>
    </div>

    <button
      type="button"
      class="shrink-0 w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
      aria-label="Eliminar tarea"
      @click="$emit('delete', task.id)"
    >
      <TrashIcon class="w-4 h-4" />
    </button>
  </div>
</template>
