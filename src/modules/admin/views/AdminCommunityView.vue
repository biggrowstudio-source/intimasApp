<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'
import dayjs from '@utils/dayjs'

const ui = useUiStore()
const qc = useQueryClient()

const { data: posts } = useQuery({
  queryKey: ['admin', 'posts'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey(first_name, last_name, photo_url)`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data ?? []
  },
})

const hide = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('posts').update({ is_hidden: true }).eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'posts'] })
    ui.pushToast({ title: 'Publicación ocultada', variant: 'info' })
  },
})

const remove = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'posts'] })
    ui.pushToast({ title: 'Publicación eliminada', variant: 'info' })
  },
})
</script>

<template>
  <AppTopBar title="Comunidad" :back="true" />

  <div class="space-y-3">
    <div v-if="!posts || posts.length === 0">
      <AppEmptyState title="Sin publicaciones" icon-name="users" />
    </div>

    <article v-for="p in posts" v-else :key="p.id" class="p-4 rounded-lg bg-surface shadow-elevation1">
      <header class="flex items-center gap-3 mb-2">
        <AppAvatar
          :src="(Array.isArray(p.author) ? p.author[0]?.photo_url : p.author?.photo_url) ?? null"
          :name="`${(Array.isArray(p.author) ? p.author[0]?.first_name : p.author?.first_name) ?? ''} ${(Array.isArray(p.author) ? p.author[0]?.last_name : p.author?.last_name) ?? ''}`"
          size="sm"
        />
        <div class="flex-1 min-w-0">
          <p class="text-small font-medium truncate">
            {{ (Array.isArray(p.author) ? p.author[0]?.first_name : p.author?.first_name) ?? '—' }}
            {{ (Array.isArray(p.author) ? p.author[0]?.last_name : p.author?.last_name) ?? '' }}
          </p>
          <p class="text-caption text-text-secondary">{{ dayjs(p.created_at).fromNow() ?? p.created_at }}</p>
        </div>
        <AppBadge v-if="p.is_hidden" variant="warning">Oculta</AppBadge>
      </header>
      <p class="text-small text-text-primary line-clamp-3">{{ p.content }}</p>
      <div class="flex gap-2 mt-3">
        <AppButton v-if="!p.is_hidden" size="sm" variant="outline" @click="hide.mutate(p.id)">Ocultar</AppButton>
        <AppButton size="sm" variant="danger" @click="remove.mutate(p.id)">Eliminar</AppButton>
      </div>
    </article>
  </div>
</template>
