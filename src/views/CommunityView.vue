<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  usePosts,
  useMyPosts,
  useDeletePost,
  useToggleLike,
  useToggleSave,
  useCommunityRealtime,
} from '@modules/community/composables/useCommunity'
import { useUiStore } from '@stores/ui.store'
import CommunityPostCard from '@modules/community/components/CommunityPostCard.vue'
import CreatePost from '@modules/community/components/CreatePost.vue'
import AppPageHeader from '@components/base/AppPageHeader.vue'
import AppSkeleton from '@components/base/AppSkeleton.vue'
import AppErrorState from '@components/base/AppErrorState.vue'
import AppEmptyState from '@components/base/AppEmptyState.vue'

const router = useRouter()
const ui = useUiStore()

const activeTab = ref<'public' | 'mine'>('public')

const { data: publicPosts, isLoading: publicLoading, isError, refetch: refetchPublic } = usePosts()
const { data: myPosts, isLoading: myLoading, refetch: refetchMine } = useMyPosts()
const deletePost = useDeletePost()
const toggleLike = useToggleLike()
const toggleSave = useToggleSave()
const realtime = useCommunityRealtime()

const feed = computed(() => (activeTab.value === 'public' ? publicPosts.value : myPosts.value))
const isLoading = computed(() => (activeTab.value === 'public' ? publicLoading.value : myLoading.value))

onMounted(() => {
  realtime.subscribe()
})

async function onDelete(postId: string) {
  if (!confirm('¿Eliminar publicación?')) return
  try {
    await deletePost.mutateAsync(postId)
    ui.pushToast({ title: 'Publicación eliminada', variant: 'info' })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onLike(postId: string, isLiked: boolean) {
  try {
    await toggleLike.mutateAsync({ postId, isLiked })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onSave(postId: string, isSaved: boolean) {
  try {
    await toggleSave.mutateAsync({ postId, isSaved })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

function onViewProfile(userId: string) {
  router.push(`/perfil/${userId}`)
}

function refetchFeed() {
  if (activeTab.value === 'public') refetchPublic()
  else refetchMine()
}
</script>

<template>
  <AppPageHeader
    title="Comunidad"
    description="Conecta, comparte y crece junto a tus compañeras embajadoras."
  />

  <div class="space-y-5 pb-16 max-w-2xl mx-auto">
    <!-- Pestañas del Feed (Muro Público / Mi Muro) Estilo Twitter -->
    <div class="flex items-center gap-2 p-1 rounded-2xl bg-surface border border-divider shadow-sm">
      <button
        type="button"
        :class="[
          'flex-1 py-2 rounded-xl text-caption font-bold transition-all text-center',
          activeTab === 'public'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-background',
        ]"
        @click="activeTab = 'public'"
      >
        Muro público
      </button>
      <button
        type="button"
        :class="[
          'flex-1 py-2 rounded-xl text-caption font-bold transition-all text-center',
          activeTab === 'mine'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-background',
        ]"
        @click="activeTab = 'mine'"
      >
        Mi muro
      </button>
    </div>

    <!-- Compositor de Publicación (Twitter/FB style + Fondos Degradados) -->
    <CreatePost @created="refetchFeed" />

    <!-- FEED DE PUBLICACIONES -->
    <div v-if="isLoading" class="space-y-4">
      <AppSkeleton v-for="i in 3" :key="i" height="180px" />
    </div>

    <div v-else-if="isError">
      <AppErrorState title="No pudimos cargar la comunidad" message="Intenta nuevamente" @retry="refetchFeed()" />
    </div>

    <div v-else-if="!feed || feed.length === 0">
      <AppEmptyState
        :title="activeTab === 'public' ? 'Aún no hay publicaciones' : 'No has publicado nada aún'"
        :description="activeTab === 'public' ? 'Sé la primera en compartir algo con la comunidad.' : 'Comparte tu primer estado para que aparezca aquí.'"
        icon-name="users"
      />
    </div>

    <div v-else class="space-y-4">
      <CommunityPostCard
        v-for="post in feed"
        :key="post.id"
        :post="post"
        @like="onLike"
        @save="onSave"
        @delete="onDelete"
        @view-profile="onViewProfile"
      />
    </div>
  </div>
</template>
