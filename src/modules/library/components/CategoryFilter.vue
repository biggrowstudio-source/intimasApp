<script setup lang="ts">
import type { DocumentCategory } from '@modules/library/types/library.types'

const props = defineProps<{
  categories: DocumentCategory[]
  modelValue: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

function select(id: string | null) {
  emit('update:modelValue', props.modelValue === id ? null : id)
}
</script>

<template>
  <div class="flex gap-2 overflow-x-auto -mx-4 px-4 tablet:mx-0 tablet:px-0 scrollbar-hide">
    <button
      type="button"
      :class="[
        'shrink-0 h-9 px-4 rounded-pill text-small font-medium transition-colors',
        modelValue === null ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-divider hover:bg-background',
      ]"
      @click="emit('update:modelValue', null)"
    >
      Todos
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      type="button"
      :class="[
        'shrink-0 h-9 px-4 rounded-pill text-small font-medium transition-colors',
        modelValue === cat.id ? 'bg-primary text-white' : 'bg-surface text-text-primary border border-divider hover:bg-background',
      ]"
      @click="select(cat.id)"
    >
      {{ cat.name }}
    </button>
  </div>
</template>
