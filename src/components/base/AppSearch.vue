<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
  clear: []
}>()

const heightClass = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
}[props.size]

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div :class="['relative w-full', heightClass]">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    </span>
    <input
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      :class="[
        'w-full h-full rounded-pill border border-divider bg-surface pl-12 pr-12 text-body text-text-primary placeholder:text-text-secondary',
        'transition-colors duration-base',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
      ]"
      @input="onInput"
      @keyup.enter="$emit('search', String(modelValue ?? ''))"
    />
    <button
      v-if="modelValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
      aria-label="Limpiar búsqueda"
      @click="onClear"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
