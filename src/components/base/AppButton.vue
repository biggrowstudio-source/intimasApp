<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  block?: boolean
  iconOnly?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  block: false,
  iconOnly: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const baseClass = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'h-9 px-3 text-small',
    md: 'h-11 px-5 text-button',
    lg: 'h-14 px-7 text-button',
  }
  const variants: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-secondary-300 text-primary hover:bg-secondary-400 active:bg-secondary-500',
    ghost: 'bg-transparent text-primary hover:bg-primary-50 active:bg-primary-100',
    outline: 'bg-transparent text-primary border border-divider hover:bg-background active:bg-secondary-50',
    danger: 'bg-error text-white hover:opacity-90 active:opacity-80',
  }
  return [
    'inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-all duration-base whitespace-nowrap shrink-0',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
    sizes[props.size],
    variants[props.variant],
    (props.fullWidth || props.block) ? 'w-full' : '',
    props.iconOnly ? 'aspect-square px-0' : '',
  ].join(' ')
})
</script>

<template>
  <button
    :type="type"
    :class="baseClass"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
    @click="(e) => $emit('click', e)"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot v-else name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>
