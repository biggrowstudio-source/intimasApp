<script setup lang="ts">
import { computed } from 'vue'
import type { FeaturedDocument } from '@modules/home/types/home.types'
import { DocumentTextIcon, ArrowDownTrayIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  document: FeaturedDocument
}>()

const onOpen = () => {
  window.location.href = `/full/pdf/${props.document.id}`
}
</script>

<template>
  <button
    type="button"
    class="group w-full flex items-center gap-3 p-3.5 rounded-lg bg-surface shadow-elevation1 hover:shadow-elevation2 active:scale-[0.99] transition-all text-left"
    @click="onOpen"
  >
    <div class="shrink-0 w-12 h-12 rounded-md bg-gradient-to-br from-secondary-100 to-accent-50 flex items-center justify-center overflow-hidden">
      <img
        v-if="document.thumbnail"
        :src="document.thumbnail"
        :alt="document.title"
        class="w-full h-full object-cover"
      />
      <DocumentTextIcon v-else class="w-6 h-6 text-accent" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="text-small font-semibold text-text-primary truncate">{{ document.title }}</h3>
      <p v-if="document.description" class="text-caption text-text-secondary line-clamp-1 mt-0.5">
        {{ document.description }}
      </p>
    </div>
    <ChevronRightIcon class="shrink-0 w-4 h-4 text-text-secondary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
  </button>
</template>
