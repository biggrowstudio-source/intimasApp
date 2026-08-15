<script setup lang="ts">
interface Props {
  variant?: 'default' | 'circular' | 'text' | 'block'
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'pill'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  rounded: 'md',
})

const radiusClass = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  pill: 'rounded-pill',
}
</script>

<template>
  <div
    :class="[
      'animate-pulse bg-secondary-100',
      variant === 'circular' ? 'rounded-pill' : radiusClass[rounded],
      variant === 'text' ? 'h-4 w-full' : '',
      variant === 'block' ? 'w-full' : '',
    ]"
    :style="{
      width: variant === 'text' ? width : (width ?? (variant === 'circular' ? height ?? '3rem' : '100%')),
      height: variant === 'text' ? undefined : (height ?? (variant === 'circular' ? '3rem' : '12rem')),
    }"
  />
</template>
