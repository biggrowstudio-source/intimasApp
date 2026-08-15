<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  siblingCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  siblingCount: 1,
})

defineEmits<{
  change: [page: number]
}>()

const pages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const sib = props.siblingCount

  const range = (start: number, end: number) => {
    const length = end - start + 1
    return Array.from({ length }, (_, i) => start + i)
  }

  if (total <= 5 + sib * 2) return range(1, total)

  const leftSibling = Math.max(current - sib, 1)
  const rightSibling = Math.min(current + sib, total)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < total - 1

  if (!showLeftDots && showRightDots) return [...range(1, 3 + sib * 2), '...', total]
  if (showLeftDots && !showRightDots) return [1, '...', ...range(total - (3 + sib * 2), total)]
  return [1, '...', ...range(leftSibling, rightSibling), '...', total]
})
</script>

<template>
  <nav class="flex items-center justify-center gap-1" aria-label="Paginación">
    <button
      :disabled="currentPage <= 1"
      class="w-9 h-9 rounded-md text-small disabled:opacity-40 hover:bg-background"
      aria-label="Anterior"
      @click="$emit('change', currentPage - 1)"
    >
      <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '...'" class="w-9 h-9 flex items-center justify-center text-text-secondary">…</span>
      <button
        v-else
        :class="[
          'w-9 h-9 rounded-md text-small font-medium transition-colors',
          p === currentPage ? 'bg-primary text-white' : 'hover:bg-background text-text-primary',
        ]"
        :aria-current="p === currentPage ? 'page' : undefined"
        @click="$emit('change', p as number)"
      >
        {{ p }}
      </button>
    </template>
    <button
      :disabled="currentPage >= totalPages"
      class="w-9 h-9 rounded-md text-small disabled:opacity-40 hover:bg-background"
      aria-label="Siguiente"
      @click="$emit('change', currentPage + 1)"
    >
      <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  </nav>
</template>
