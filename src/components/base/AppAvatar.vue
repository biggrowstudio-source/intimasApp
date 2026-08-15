<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
})

const sizeClass = computed(() => {
  const map = {
    xs: 'w-7 h-7 text-caption',
    sm: 'w-9 h-9 text-small',
    md: 'w-11 h-11 text-body',
    lg: 'w-14 h-14 text-title',
    xl: 'w-20 h-20 text-h2',
  }
  return map[props.size]
})
</script>

<template>
  <div
    :class="[
      'inline-flex items-center justify-center overflow-hidden rounded-pill bg-blush text-accent-600 font-extrabold shrink-0 ring-2 ring-accent/40 border border-accent/30 shadow-xs',
      sizeClass,
    ]"
    :aria-label="name ?? 'avatar'"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name ?? ''"
      class="w-full h-full object-cover"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>
