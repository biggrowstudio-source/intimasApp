<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle(e: Event) {
  if (props.disabled) return
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <label :class="['flex items-center gap-3 cursor-pointer select-none', disabled ? 'opacity-50 cursor-not-allowed' : '']">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="peer sr-only"
      @change="toggle"
    />
    <span
      class="shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center transition-colors duration-base"
      :class="modelValue ? 'bg-accent border-accent' : 'bg-surface border-divider'"
    >
      <svg v-if="modelValue" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </span>
    <span v-if="label" class="text-small text-text-primary">{{ label }}</span>
  </label>
</template>
