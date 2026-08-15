<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number | boolean | (string | number)[]
  options: Array<{ label: string; value: string | number; disabled?: boolean }>
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  multiple: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[]]
}>()

const stringValue = computed(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue.map(String)
  if (props.modelValue === undefined || props.modelValue === null) return ''
  return String(props.modelValue)
})

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement
  if (props.multiple) {
    const values = Array.from(target.selectedOptions).map((o) => o.value)
    emit('update:modelValue', values)
  } else {
    const opt = props.options.find((o) => String(o.value) === target.value)
    emit('update:modelValue', opt ? opt.value : target.value)
  }
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block mb-2 text-small font-medium text-text-primary">
      {{ label }}
      <span v-if="required" class="text-error" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <select
        :value="stringValue"
        :disabled="disabled"
        :required="required"
        :multiple="multiple"
        :class="[
          'w-full h-12 rounded-md border bg-surface text-body text-text-primary px-4 pr-10 appearance-none',
          'transition-colors duration-base',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
          error ? 'border-error' : 'border-divider hover:border-primary-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-background' : '',
        ]"
        @change="onChange"
      >
        <option v-if="placeholder && !multiple" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </select>
      <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
    <p v-if="error" class="mt-1.5 text-caption text-error" role="alert">{{ error }}</p>
  </div>
</template>
