<script setup lang="ts">
interface Props {
  title?: string
  back?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  back: false,
})

const emit = defineEmits<{ back: [] }>()

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  }
  emit('back')
}
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-divider safe-top"
  >
    <div class="flex items-center justify-between h-14 px-4 tablet:px-6 max-w-[1280px] mx-auto">
      <div class="flex items-center gap-3 min-w-0">
        <button
          v-if="back"
          class="shrink-0 w-9 h-9 -ml-2 rounded-pill flex items-center justify-center text-text-primary hover:bg-background"
          aria-label="Volver"
          @click="goBack"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 v-if="title" class="text-title font-semibold text-text-primary truncate">{{ title }}</h1>
        <slot name="title" />
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
