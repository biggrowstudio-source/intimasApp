<script setup lang="ts">
import { reactive, ref } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { taskSchema } from '@modules/planner/validators/planner.schema'
import type { TaskInput } from '@modules/planner/types/planner.types'

const emit = defineEmits<{ submit: [input: TaskInput] }>()

const form = reactive({ title: '', priority: 'medium' as TaskInput['priority'], dueDate: '' })
const errors = ref<Record<string, string>>({})

function submit() {
  const result = taskSchema.safeParse(form)
  if (!result.success) {
    errors.value = Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]))
    return
  }
  emit('submit', {
    title: result.data.title,
    priority: result.data.priority,
    dueDate: result.data.dueDate || null,
  })
  form.title = ''
  form.dueDate = ''
  errors.value = {}
}
</script>

<template>
  <form class="flex gap-2" @submit.prevent="submit">
    <div class="flex-1">
      <AppInput v-model="form.title" placeholder="Nueva tarea" :error="errors.title" />
    </div>
    <AppButton type="submit" icon-only aria-label="Agregar tarea">
      <PlusIcon class="w-5 h-5" />
    </AppButton>
  </form>
</template>
