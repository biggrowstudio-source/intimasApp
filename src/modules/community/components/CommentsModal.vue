<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useComments, useCreateComment, COMMUNITY_QUERY_KEYS } from '@modules/community/composables/useCommunity'
import { commentSchema } from '@modules/community/validators/community.schema'
import { communityService } from '@modules/community/services/community.service'
import { useQueryClient } from '@tanstack/vue-query'
import dayjs from '@utils/dayjs'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth.store'

const props = defineProps<{ postId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const qc = useQueryClient()
const commentText = ref('')
const error = ref('')

const activePostId = computed(() => props.postId ?? '')

const { data: comments, isLoading } = useComments(activePostId)

const createComment = useCreateComment()

watch(
  () => props.postId,
  (newId) => {
    if (newId) {
      const off = communityService.subscribeToComments(newId, () => {
        qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.comments(newId) })
      })
      setTimeout(off, 1000 * 60 * 5)
    }
  },
)

async function submit() {
  error.value = ''
  if (!props.postId) return
  const result = commentSchema.safeParse({ content: commentText.value })
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'Datos inválidos'
    return
  }
  try {
    await createComment.mutateAsync({ postId: props.postId, content: result.data.content })
    commentText.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <AppModal
    :model-value="!!postId"
    size="md"
    @update:model-value="(v: boolean) => !v && emit('close')"
  >
    <div class="flex flex-col h-[70vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-divider shrink-0">
        <h2 class="text-title font-semibold">Comentarios</h2>
        <button
          class="w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
          aria-label="Cerrar"
          @click="emit('close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Comments list -->
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="flex gap-2.5">
            <div class="w-8 h-8 rounded-full bg-secondary-200 shrink-0 animate-pulse" />
            <div class="flex-1 space-y-2">
              <div class="h-3 w-24 bg-secondary-200 rounded animate-pulse" />
              <div class="h-4 w-full bg-secondary-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div v-else-if="!comments || comments.length === 0" class="text-center py-12">
          <p class="text-body text-text-secondary">No hay comentarios aún.</p>
          <p class="text-small text-text-secondary mt-1">Sé la primera en escribir.</p>
        </div>

        <div v-for="c in comments" :key="c.id" class="flex gap-2.5">
          <AppAvatar
            :src="c.author.photoUrl"
            :name="`${c.author.firstName} ${c.author.lastName}`"
            size="xs"
            class="mt-0.5 shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="bg-background rounded-2xl px-3.5 py-2.5">
              <p class="text-small font-semibold text-text-primary">
                {{ c.author.firstName }} {{ c.author.lastName }}
              </p>
              <p class="text-small text-text-primary whitespace-pre-wrap mt-0.5">{{ c.content }}</p>
            </div>
            <div class="flex items-center gap-3 mt-1 ml-1">
              <span class="text-caption text-text-secondary">{{ dayjs(c.createdAt).fromNow() ?? c.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Comment input -->
      <div class="border-t border-divider px-5 py-3 shrink-0">
        <form class="flex items-center gap-2.5" @submit.prevent="submit">
          <AppAvatar
            :src="auth.profile?.photoUrl"
            :name="`${auth.profile?.firstName ?? ''} ${auth.profile?.lastName ?? ''}`"
            size="xs"
            class="shrink-0"
          />
          <div class="flex-1 relative">
            <input
              v-model="commentText"
              type="text"
              placeholder="Escribe un comentario..."
              class="w-full h-10 px-4 rounded-pill bg-background text-small text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
              :disabled="createComment.isPending.value"
            />
            <p v-if="error" class="text-caption text-error mt-1 ml-1">{{ error }}</p>
          </div>
          <button
            type="submit"
            :disabled="!commentText.trim() || !postId || createComment.isPending.value"
            class="shrink-0 w-9 h-9 rounded-pill inline-flex items-center justify-center transition-all disabled:opacity-40"
            :class="commentText.trim() ? 'text-accent hover:bg-accent/10' : 'text-text-secondary'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </AppModal>
</template>
