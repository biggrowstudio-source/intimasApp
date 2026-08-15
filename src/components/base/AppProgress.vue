<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'accent' | 'success'
  showLabel?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 'md',
  variant: 'accent',
  showLabel: false,
})

const percent = computed(() => {
  if (!props.modelValue || props.modelValue <= 0) return 0
  return Math.min(100, Math.round((props.modelValue / props.max) * 100))
})

const heightClass = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}[props.size]

const colorClass = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
}[props.variant]
</script>

<template>
  <div class="w-full">
    <div v-if="showLabel" class="flex justify-between text-caption text-text-secondary mb-1.5">
      <span>{{ label }}</span>
      <span>{{ percent }}%</span>
    </div>
    <div :class="['w-full rounded-pill bg-divider overflow-hidden', heightClass]">
      <div
        :class="['h-full rounded-pill transition-all duration-slow', colorClass]"
        :style="{ width: `${percent}%` }"
        role="progressbar"
        :aria-valuenow="modelValue ?? 0"
        :aria-valuemin="0"
        :aria-valuemax="max"
      />
    </div>
  </div>
</template>
