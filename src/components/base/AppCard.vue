<script setup lang="ts">
interface Props {
  variant?: 'elevated' | 'flat' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  padding: 'md',
  hoverable: false,
})

const variantClass = {
  elevated: 'bg-surface shadow-elevation1',
  flat: 'bg-surface',
  outlined: 'bg-surface border border-divider',
}[props.variant]

const paddingClass = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}[props.padding]
</script>

<template>
  <div
    :class="[
      'rounded-lg',
      variantClass,
      paddingClass,
      hoverable ? 'transition-shadow duration-base hover:shadow-elevation2' : '',
    ]"
  >
    <slot />
  </div>
</template>
