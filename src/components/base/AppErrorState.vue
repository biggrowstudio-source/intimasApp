<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  variant?: 'error' | 'warning' | 'info'
  retryLabel?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'error',
  retryLabel: 'Reintentar',
})

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center px-6 py-12 rounded-lg border border-error/20 bg-error/5">
    <div class="w-14 h-14 rounded-pill bg-error/10 flex items-center justify-center mb-4">
      <svg class="w-7 h-7 text-error" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h3 v-if="title" class="text-title font-medium text-text-primary mb-1.5">{{ title }}</h3>
    <p v-if="message" class="text-small text-text-secondary max-w-sm mb-5">{{ message }}</p>
    <button
      class="inline-flex items-center justify-center h-10 px-5 rounded-pill border border-error text-error text-small font-semibold hover:bg-error hover:text-white transition-colors"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
