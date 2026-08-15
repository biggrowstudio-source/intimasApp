<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import {
  BookmarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/vue/24/solid'
import type { LibraryDocument } from '@modules/library/types/library.types'

const props = defineProps<{
  documents: LibraryDocument[]
  favoriteIds: string[]
}>()

const emit = defineEmits<{
  open: [document: LibraryDocument]
  download: [document: LibraryDocument]
  toggleFavorite: [document: LibraryDocument]
}>()

const formatted = computed(() =>
  props.documents.map((d) => ({
    ...d,
    formattedDate: dayjs(d.createdAt).format('MMM YYYY'),
  })),
)

function isFavorite(id: string) {
  return props.favoriteIds.includes(id)
}
</script>

<template>
  <section v-if="formatted.length > 0" class="-mx-4 tablet:mx-0">
    <header class="flex items-center justify-between mb-3 px-4 tablet:px-0">
      <h2 class="text-title font-semibold text-text-primary">Documentos destacados</h2>
      <RouterLink to="/biblioteca" class="text-small text-accent font-medium hover:underline">
        Ver todos
      </RouterLink>
    </header>

    <div class="flex gap-3 overflow-x-auto px-4 tablet:px-0 pb-2 scrollbar-hide snap-x snap-mandatory">
      <article
        v-for="doc in formatted"
        :key="doc.id"
        class="snap-start shrink-0 w-[200px] rounded-xl bg-surface shadow-elevation1 overflow-hidden flex flex-col"
      >
        <button
          type="button"
          class="relative block w-full aspect-[3/4] bg-secondary-100 overflow-hidden"
          @click="emit('open', doc)"
        >
          <img
            v-if="doc.thumbnail"
            :src="doc.thumbnail"
            :alt="doc.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-else class="w-full h-full bg-gradient-to-br from-secondary-200 to-accent-100" />

          <button
            type="button"
            class="absolute top-2.5 right-2.5 w-8 h-8 rounded-pill bg-white/95 backdrop-blur-sm shadow-elevation1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            :aria-label="isFavorite(doc.id) ? 'Quitar de guardados' : 'Guardar'"
            @click.stop="emit('toggleFavorite', doc)"
          >
            <component
              :is="isFavorite(doc.id) ? BookmarkSolid : BookmarkIcon"
              class="w-4 h-4 text-text-primary"
            />
          </button>
        </button>

        <div class="p-3 flex flex-col gap-2 flex-1">
          <h3 class="text-small font-semibold text-text-primary line-clamp-2 leading-snug min-h-[2.5rem]">
            {{ doc.title }}
          </h3>
          <div class="flex items-center justify-between mt-auto">
            <span class="text-caption text-accent font-medium">{{ doc.categoryName }}</span>
            <button
              type="button"
              class="shrink-0 w-8 h-8 rounded-pill bg-blush hover:bg-accent hover:text-white text-accent-500 flex items-center justify-center transition-colors"
              aria-label="Descargar"
              @click.stop="emit('download', doc)"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
