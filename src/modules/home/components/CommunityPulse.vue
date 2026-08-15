<script setup lang="ts">
import { computed } from 'vue'
import type { LatestPost } from '@modules/home/types/home.types'
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
} from '@heroicons/vue/24/outline'
import dayjs from '@utils/dayjs'
import { parsePostBg } from '@modules/community/constants/presets'
import AppAvatar from '@components/base/AppAvatar.vue'

const props = defineProps<{
  posts: LatestPost[]
}>()

const first = computed(() => props.posts[0])

const timeAgo = computed(() => {
  if (!first.value) return ''
  return dayjs(first.value.createdAt).fromNow()
})

const parsedContent = computed(() => parsePostBg(first.value?.content ?? ''))
</script>

<template>
  <section v-if="first">
    <header class="flex items-center justify-between mb-3 px-1">
      <h2 class="text-title font-semibold text-text-primary">Actividad reciente</h2>
      <RouterLink to="/comunidad" class="text-small text-accent font-medium hover:underline">
        Ver comunidad
      </RouterLink>
    </header>

    <article class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1">
      <header class="flex items-center gap-3 mb-3">
        <AppAvatar
          :src="first.author.photoUrl"
          :name="`${first.author.firstName} ${first.author.lastName}`"
          size="sm"
        />
        <div class="flex-1 min-w-0">
          <p class="text-small font-bold text-text-primary truncate">
            {{ first.author.firstName }} {{ first.author.lastName }}
          </p>
          <p class="text-caption text-text-secondary">{{ timeAgo }}</p>
        </div>
        <button
          class="shrink-0 text-text-secondary hover:text-accent transition-colors p-1"
          aria-label="Guardar publicación"
        >
          <BookmarkIcon class="w-5 h-5" />
        </button>
      </header>

      <!-- Caso A: Publicación con Fondo Degradado -->
      <div
        v-if="parsedContent.preset.id !== 'none'"
        class="my-2 p-5 rounded-2xl min-h-[100px] flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden"
        :class="parsedContent.preset.class"
      >
        <p class="font-extrabold text-caption sm:text-body text-white drop-shadow-md leading-snug line-clamp-3">
          {{ parsedContent.text }}
        </p>
      </div>

      <!-- Caso B: Publicación Estándar -->
      <div v-else class="flex gap-3 items-start">
        <p class="flex-1 text-small text-text-primary leading-relaxed line-clamp-3">
          {{ parsedContent.text }}
        </p>
        <div v-if="first.image" class="shrink-0 w-20 h-20 rounded-xl bg-secondary-100 overflow-hidden">
          <img
            :src="first.image"
            :alt="first.author.firstName"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <footer class="flex items-center gap-5 mt-3 pt-3 border-t border-divider/60">
        <span class="inline-flex items-center gap-1.5 text-caption font-semibold text-text-secondary">
          <HeartIcon class="w-4 h-4 text-accent" /> {{ first.likesCount }}
        </span>
        <span class="inline-flex items-center gap-1.5 text-caption font-semibold text-text-secondary">
          <ChatBubbleLeftIcon class="w-4 h-4 text-accent" /> {{ first.commentsCount }}
        </span>
      </footer>
    </article>
  </section>
</template>
