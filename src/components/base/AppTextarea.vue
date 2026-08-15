<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
}>()

const autoId = useId()
const inputId = computed(() => props.id ?? `textarea-${autoId}`)

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block mb-2 text-small font-medium text-text-primary"
    >
      {{ label }}
      <span v-if="required" class="text-error" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="inputId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :class="[
        'w-full rounded-md border bg-surface text-body text-text-primary placeholder:text-text-secondary px-4 py-3 resize-y',
        'transition-colors duration-base',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
        error ? 'border-error' : 'border-divider hover:border-primary-300',
        disabled ? 'opacity-50 cursor-not-allowed bg-background' : '',
      ]"
      @input="onInput"
      @blur="(e) => $emit('blur', e)"
    />
    <p v-if="error" class="mt-1.5 text-caption text-error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-caption text-text-secondary">{{ hint }}</p>
  </div>
</template>
