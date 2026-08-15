<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral'
type Size = 'sm' | 'md'

interface Props {
  variant?: Variant
  size?: Size
  pill?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
  pill: true,
})

const classes = computed(() => {
  const variants: Record<Variant, string> = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary-300 text-primary',
    accent: 'bg-accent-100 text-accent-500',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    neutral: 'bg-background text-text-secondary',
  }
  const sizes: Record<Size, string> = {
    sm: 'h-6 px-2.5 text-caption',
    md: 'h-7 px-3 text-small',
  }
  return [
    'inline-flex items-center gap-1.5 font-medium',
    props.pill ? 'rounded-pill' : 'rounded-sm',
    variants[props.variant],
    sizes[props.size],
  ].join(' ')
})
</script>

<template>
  <span :class="classes">
    <slot name="icon" />
    <slot />
  </span>
</template>
