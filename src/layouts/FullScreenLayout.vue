<script setup lang="ts">
import { useRouter } from 'vue-router'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const router = useRouter()

function close() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <div class="fixed inset-0 z-40 bg-background flex flex-col">
    <header class="flex items-center justify-end p-3 safe-top shrink-0">
      <button
        class="w-10 h-10 rounded-pill flex items-center justify-center text-text-primary hover:bg-surface transition-colors"
        aria-label="Cerrar"
        @click="close"
      >
        <XMarkIcon class="w-6 h-6" />
      </button>
    </header>
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
