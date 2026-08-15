<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
  id?: string
  iconLeft?: boolean
  maxlength?: number | string
  minlength?: number | string
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  pattern?: string
  min?: number | string
  max?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  iconLeft: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const autoId = useId()
const inputId = computed(() => props.id ?? `input-${autoId}`)

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
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
    <div class="relative">
      <span
        v-if="iconLeft || $slots.iconLeft"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
      >
        <slot name="iconLeft" />
      </span>
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :minlength="minlength"
        :inputmode="inputmode"
        :pattern="pattern"
        :min="min"
        :max="max"
        :class="[
          'w-full h-12 rounded-md border bg-surface text-body text-text-primary placeholder:text-text-secondary',
          'transition-colors duration-base',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1',
          error ? 'border-error' : 'border-divider hover:border-primary-300',
          iconLeft || $slots.iconLeft ? 'pl-11 pr-4' : 'px-4',
          disabled ? 'opacity-50 cursor-not-allowed bg-background' : '',
        ]"
        @input="onInput"
        @blur="(e) => $emit('blur', e)"
        @focus="(e) => $emit('focus', e)"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-caption text-error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-caption text-text-secondary">{{ hint }}</p>
  </div>
</template>
