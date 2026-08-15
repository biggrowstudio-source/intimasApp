<script setup lang="ts">
import type { LatestPost } from '@modules/home/types/home.types'
import { ChatBubbleLeftIcon, HeartIcon } from '@heroicons/vue/24/outline'
import dayjs from '@utils/dayjs'

defineProps<{ post: LatestPost }>()
</script>

<template>
  <article class="p-4 rounded-lg bg-surface shadow-elevation1">
    <header class="flex items-center gap-3 mb-3">
      <AppAvatar
        :src="post.author.photoUrl"
        :name="`${post.author.firstName} ${post.author.lastName}`"
        size="sm"
      />
      <div class="flex-1 min-w-0">
        <p class="text-small font-semibold text-text-primary truncate">
          {{ post.author.firstName }} {{ post.author.lastName }}
        </p>
        <p class="text-caption text-text-secondary">{{ dayjs(post.createdAt).fromNow() ?? post.createdAt }}</p>
      </div>
    </header>
    <p class="text-small text-text-primary line-clamp-3">{{ post.content }}</p>
    <footer class="flex items-center gap-4 mt-3 text-caption text-text-secondary">
      <span class="inline-flex items-center gap-1">
        <HeartIcon class="w-4 h-4" /> {{ post.likesCount }}
      </span>
      <span class="inline-flex items-center gap-1">
        <ChatBubbleLeftIcon class="w-4 h-4" /> {{ post.commentsCount }}
      </span>
    </footer>
  </article>
</template>
