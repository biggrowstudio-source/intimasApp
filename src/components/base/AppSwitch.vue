<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label
    :class="[
      'flex items-start gap-3 cursor-pointer select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]"
  >
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="relative shrink-0 w-11 h-6 rounded-pill transition-colors duration-base"
      :class="modelValue ? 'bg-accent' : 'bg-divider'"
      @click="toggle"
    >
      <span
        class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-pill shadow-elevation1 transition-transform duration-base"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
    <span v-if="label || description" class="flex-1">
      <span v-if="label" class="block text-small font-medium text-text-primary">{{ label }}</span>
      <span v-if="description" class="block text-caption text-text-secondary mt-0.5">{{ description }}</span>
    </span>
  </label>
</template>
