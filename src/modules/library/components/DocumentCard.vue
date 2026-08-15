<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryDocument } from '@modules/library/types/library.types'
import { DocumentTextIcon, HeartIcon } from '@heroicons/vue/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/vue/24/solid'
import dayjs from '@utils/dayjs'

const props = defineProps<{
  document: LibraryDocument
  isFavorite: boolean
}>()

const emit = defineEmits<{
  open: [document: LibraryDocument]
  toggleFavorite: [documentId: string]
}>()

const formatted = computed(() => dayjs(props.document.createdAt).format('D MMM YYYY'))
</script>

<template>
  <article class="flex flex-col p-4 rounded-lg bg-surface shadow-elevation1 hover:shadow-elevation2 transition-shadow duration-base">
    <button
      type="button"
      class="flex items-start gap-3 text-left w-full"
      @click="emit('open', document)"
    >
      <div class="shrink-0 w-14 h-14 rounded-md bg-secondary-100 flex items-center justify-center overflow-hidden">
        <img v-if="document.thumbnail" :src="document.thumbnail" :alt="document.title" class="w-full h-full object-cover" />
        <DocumentTextIcon v-else class="w-7 h-7 text-accent" />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-small font-semibold text-text-primary line-clamp-2">{{ document.title }}</h3>
        <p v-if="document.categoryName" class="text-caption text-text-secondary mt-1">{{ document.categoryName }}</p>
      </div>
    </button>
    <footer class="flex items-center justify-between mt-3 pt-3 border-t border-divider">
      <span class="text-caption text-text-secondary">{{ formatted }}</span>
      <button
        type="button"
        class="w-9 h-9 rounded-pill flex items-center justify-center text-accent hover:bg-accent-50 transition-colors"
        :aria-label="isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'"
        @click="emit('toggleFavorite', document.id)"
      >
        <component :is="isFavorite ? HeartSolid : HeartIcon" class="w-5 h-5" />
      </button>
    </footer>
  </article>
</template>
