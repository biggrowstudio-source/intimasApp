<script setup lang="ts">
import { computed } from 'vue'
import { SparklesIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  completed: number
  total: number
}>()

const percent = computed(() => {
  if (props.total <= 0) return 0
  return Math.min(100, Math.round((props.completed / props.total) * 100))
})
</script>

<template>
  <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blush via-secondary-100 to-accent-50 p-5">
    <div class="absolute -top-12 -right-12 w-40 h-40 rounded-pill bg-accent/15 blur-2xl" aria-hidden="true" />
    <div class="absolute bottom-2 -left-6 w-28 h-28 rounded-pill bg-secondary-300/30 blur-2xl" aria-hidden="true" />

    <header class="relative flex items-start justify-between mb-4">
      <div>
        <h2 class="text-subtitle font-semibold text-text-primary">Tu progreso semanal</h2>
        <p class="text-caption text-text-secondary mt-1">Eventos completados</p>
      </div>
      <RouterLink to="/reconocimientos" class="text-small text-accent font-medium hover:underline">
        Ver estadísticas
      </RouterLink>
    </header>

    <div class="relative flex items-end justify-between gap-3">
      <div class="flex-1">
        <p class="text-h1 font-editorial text-text-primary leading-none mb-3">
          {{ completed }}
          <span class="text-h3 text-text-secondary">/ {{ total }}</span>
        </p>
        <div class="h-2.5 bg-white/60 rounded-pill overflow-hidden">
          <div
            class="h-full rounded-pill bg-gradient-to-r from-accent to-error transition-all duration-slow"
            :style="{ width: `${percent}%` }"
          />
        </div>
        <p class="text-caption text-text-secondary mt-2 font-medium">{{ percent }}% completado</p>
      </div>

      <div class="shrink-0 relative w-20 h-20">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.5)" stroke-width="6" fill="none" />
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="url(#progressGrad)"
            stroke-width="6"
            fill="none"
            stroke-linecap="round"
            :stroke-dasharray="`${(percent / 100) * 213.6} 213.6`"
            class="transition-all duration-slow"
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E07A78" />
              <stop offset="100%" stop-color="#D9534F" />
            </linearGradient>
          </defs>
        </svg>
        <span class="absolute inset-0 flex items-center justify-center text-accent">
          <SparklesIcon class="w-7 h-7" />
        </span>
      </div>
    </div>
  </section>
</template>
