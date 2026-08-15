<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import type { CommunityPost } from '@modules/community/types/community.types'
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  COMMUNITY_QUERY_KEYS,
} from '@modules/community/composables/useCommunity'
import { communityService } from '@modules/community/services/community.service'
import { useQueryClient } from '@tanstack/vue-query'
import {
  HeartIcon,
  ChatBubbleLeftEllipsisIcon,
  BookmarkIcon,
  TrashIcon,
  PaperAirplaneIcon,
  GlobeAmericasIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/outline'
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/vue/24/solid'
import dayjs from '@utils/dayjs'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import { commentSchema } from '@modules/community/validators/community.schema'
import { MOODS } from '@modules/community/constants/moods'
import { parsePostBg } from '@modules/community/constants/presets'
import AppAvatar from '@components/base/AppAvatar.vue'
import MoodEmojiIcon from './MoodEmojiIcon.vue'

const props = defineProps<{ post: CommunityPost }>()
const emit = defineEmits<{
  like: [postId: string, isLiked: boolean]
  save: [postId: string, isSaved: boolean]
  delete: [postId: string]
  viewProfile: [userId: string]
}>()

const auth = useAuthStore()
const ui = useUiStore()
const qc = useQueryClient()

const isAuthor = computed(() => auth.user?.id === props.post.authorId)
const isAdmin = computed(() => auth.role === 'admin' || auth.role === 'super_admin')
const moodLabel = computed(() => MOODS.find((m) => m.emoji === props.post.mood)?.label ?? '')
const moodObj = computed(() => MOODS.find((m) => m.emoji === props.post.mood || m.label === props.post.mood || m.id === props.post.mood))

const parsedContent = computed(() => parsePostBg(props.post.content))

const dynamicBgFontSize = computed(() => {
  const len = parsedContent.value.text.length
  if (len < 50) return 'text-h2 font-extrabold sm:text-[26px] leading-tight'
  if (len < 110) return 'text-h3 font-extrabold sm:text-[20px] leading-snug'
  if (len < 170) return 'text-body font-bold sm:text-[16px] leading-snug'
  return 'text-caption font-semibold sm:text-[14px] leading-snug'
})

const showComments = ref(false)
const commentText = ref('')
const commentError = ref('')
const unsubscribeRealtime = ref<(() => void) | null>(null)

const activePostId = computed(() => (showComments.value ? props.post.id : ''))
const { data: comments, isLoading: commentsLoading } = useComments(activePostId)
const createComment = useCreateComment()
const deleteComment = useDeleteComment()

async function onDeleteComment(commentId: string) {
  try {
    await deleteComment.mutateAsync(commentId)
    ui.pushToast({ title: 'Comentario eliminado', variant: 'info' })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

watch(showComments, (open) => {
  if (open) {
    unsubscribeRealtime.value = communityService.subscribeToComments(props.post.id, () => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.comments(props.post.id) })
    })
  } else {
    unsubscribeRealtime.value?.()
    unsubscribeRealtime.value = null
  }
})

onUnmounted(() => {
  unsubscribeRealtime.value?.()
})

function goToProfile() {
  emit('viewProfile', props.post.authorId)
}

async function submitComment() {
  commentError.value = ''
  const result = commentSchema.safeParse({ content: commentText.value })
  if (!result.success) {
    commentError.value = result.error.issues[0]?.message ?? 'Datos inválidos'
    return
  }
  try {
    await createComment.mutateAsync({ postId: props.post.id, content: result.data.content })
    commentText.value = ''
  } catch (e) {
    commentError.value = (e as Error).message
  }
}
</script>

<template>
  <article class="rounded-2xl bg-surface border border-divider shadow-sm overflow-hidden transition-all hover:shadow-md">
    <!-- Header del Post -->
    <header class="p-4 pb-2 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <button type="button" class="shrink-0 transition-transform active:scale-95" @click="goToProfile">
          <AppAvatar
            :src="post.author.photoUrl"
            :name="`${post.author.firstName} ${post.author.lastName}`"
            size="md"
          />
        </button>

        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" class="text-left group" @click="goToProfile">
              <span class="text-small font-bold text-text-primary group-hover:text-accent transition-colors truncate block">
                {{ post.author.firstName }} {{ post.author.lastName }}
              </span>
            </button>
            <span
              v-if="post.author.role === 'admin' || post.author.role === 'super_admin'"
              class="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider border border-accent/20"
            >
              Admin
            </span>
            <span
              v-else-if="post.author.role === 'moderator'"
              class="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 text-[10px] font-black uppercase tracking-wider border border-purple-300"
            >
              Moderadora
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5">
            <span>{{ dayjs(post.createdAt).fromNow() }}</span>
            <span>•</span>
            <span v-if="post.visibility === 'ambassadors'" class="inline-flex items-center gap-0.5 text-accent font-medium">
              <UserGroupIcon class="w-3 h-3" /> Para Embajadoras
            </span>
            <span v-else-if="post.visibility === 'public'" class="inline-flex items-center gap-0.5 font-medium">
              <GlobeAmericasIcon class="w-3 h-3" /> Pública
            </span>
            <span v-else class="inline-flex items-center gap-0.5 font-medium">
              <LockClosedIcon class="w-3 h-3" /> Privada
            </span>
          </div>
        </div>

      </div>

      <div class="flex items-center gap-1">
        <!-- Badge de Mood con Icono Vectorial -->
        <span
          v-if="moodObj"
          class="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border shrink-0"
          :class="moodObj.colorClass"
        >
          <MoodEmojiIcon :name="moodObj.id" size="sm" />
          <span>{{ moodObj.label }}</span>
        </span>
        <span v-else-if="post.mood" class="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
          {{ post.mood }}
        </span>

        <!-- Botón Eliminar si es autor o admin -->
        <button
          v-if="isAuthor || isAdmin"
          type="button"
          class="p-2 rounded-full text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
          title="Eliminar publicación"
          @click="emit('delete', post.id)"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- CUERPO DE LA PUBLICACIÓN -->
    <!-- Caso A: Publicación con Fondo Degradado Presets (Estilo FB Status) -->
    <div
      v-if="parsedContent.preset.id !== 'none'"
      class="my-2 mx-4 p-6 sm:p-8 rounded-2xl min-h-[180px] flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden"
      :class="parsedContent.preset.class"
    >
      <p class="whitespace-pre-wrap max-w-lg mx-auto drop-shadow-md my-auto self-center text-center text-white" :class="dynamicBgFontSize">
        {{ parsedContent.text }}
      </p>
    </div>

    <!-- Caso B: Publicación Texto Estándar (Estilo Twitter) -->
    <div v-else class="px-4 py-2">
      <p class="text-body text-text-primary whitespace-pre-wrap leading-relaxed">
        {{ parsedContent.text }}
      </p>

      <!-- Imagen adjunta opcional -->
      <img
        v-if="post.image"
        :src="post.image"
        :alt="post.content"
        class="mt-3 rounded-xl w-full max-h-96 object-cover border border-divider"
      />
    </div>

    <!-- BARRA DE INTERACCIONES (Estilo Twitter / FB) -->
    <footer class="px-4 py-2.5 border-t border-divider/60 flex items-center justify-between text-caption text-text-secondary">
      <div class="flex items-center gap-4">
        <!-- Me Gusta -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-pill transition-all active:scale-95"
          :class="post.likedByMe ? 'text-accent font-bold bg-accent/10' : 'hover:text-accent hover:bg-background'"
          @click="emit('like', post.id, post.likedByMe)"
        >
          <component :is="post.likedByMe ? HeartSolid : HeartIcon" class="w-5 h-5 transition-transform" :class="post.likedByMe ? 'scale-110' : ''" />
          <span>{{ post.likesCount || 0 }}</span>
        </button>

        <!-- Comentarios -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-pill transition-all"
          :class="showComments ? 'text-accent font-bold bg-accent/10' : 'hover:text-accent hover:bg-background'"
          @click="showComments = !showComments"
        >
          <ChatBubbleLeftEllipsisIcon class="w-5 h-5" />
          <span>{{ post.commentsCount || 0 }}</span>
        </button>
      </div>

      <!-- Guardar / Marcador -->
      <button
        type="button"
        class="p-2 rounded-full transition-all active:scale-95"
        :class="post.savedByMe ? 'text-accent bg-accent/10' : 'hover:text-accent hover:bg-background'"
        :title="post.savedByMe ? 'Guardado' : 'Guardar'"
        @click="emit('save', post.id, post.savedByMe)"
      >
        <component :is="post.savedByMe ? BookmarkSolid : BookmarkIcon" class="w-5 h-5" />
      </button>
    </footer>

    <!-- SECCIÓN DE COMENTARIOS DESPLEGABLE -->
    <div v-if="showComments" class="bg-background/50 border-t border-divider/60 p-4 space-y-3">
      <div v-if="commentsLoading" class="space-y-2">
        <AppSkeleton height="40px" />
        <AppSkeleton height="40px" />
      </div>

      <div v-else-if="comments && comments.length > 0" class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        <div
          v-for="c in comments"
          :key="c.id"
          class="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface border border-divider/40 text-caption"
        >
          <AppAvatar
            :src="c.author.photoUrl"
            :name="`${c.author.firstName} ${c.author.lastName}`"
            size="xs"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-text-primary text-[11px] truncate">
                {{ c.author.firstName }} {{ c.author.lastName }}
              </span>
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-[10px] text-text-secondary">{{ dayjs(c.createdAt).fromNow() }}</span>
                <button
                  v-if="c.authorId === auth.user?.id || isAuthor || isAdmin"
                  type="button"
                  class="text-text-secondary hover:text-error ml-1"
                  @click="onDeleteComment(c.id)"
                >
                  <TrashIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
            <p class="text-text-primary text-small mt-0.5 whitespace-pre-wrap">{{ c.content }}</p>
          </div>
        </div>
      </div>

      <p v-else class="text-caption text-text-secondary text-center py-2">
        Sé la primera en comentar esta publicación ✨
      </p>

      <!-- Formulario para agregar comentario -->
      <form class="flex items-center gap-2 pt-1" @submit.prevent="submitComment">
        <input
          v-model="commentText"
          type="text"
          placeholder="Escribe un comentario..."
          class="flex-1 px-3 py-2 rounded-xl border border-divider bg-surface text-small text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
        <button
          type="submit"
          :disabled="!commentText.trim()"
          class="p-2 rounded-xl bg-accent text-white font-bold disabled:opacity-40 transition active:scale-95"
        >
          <PaperAirplaneIcon class="w-4 h-4" />
        </button>
      </form>
    </div>
  </article>
</template>
