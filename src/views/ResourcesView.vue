<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { ArrowDownTrayIcon, FilmIcon, DocumentIcon, PhotoIcon, PresentationChartBarIcon } from '@heroicons/vue/24/outline'
import AppPageHeader from '@components/base/AppPageHeader.vue'

const search = ref('')
const activeType = ref<'all' | 'video' | 'template' | 'image' | 'presentation' | 'file'>('all')

const { data: categories } = useQuery({
  queryKey: ['resources', 'categories'],
  queryFn: async () => {
    const { data, error } = await supabase.from('resource_categories').select('*').order('name')
    if (error) throw error
    return data ?? []
  },
})

const { data: resources, isLoading } = useQuery({
  queryKey: ['resources', activeType, search],
  queryFn: async () => {
    let q = supabase.from('resources').select('*').order('created_at', { ascending: false })
    if (activeType.value !== 'all') q = q.eq('type', activeType.value)
    if (search.value) q = q.ilike('title', `%${search.value}%`)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
  },
})

const typeIcons = {
  video: FilmIcon,
  template: DocumentIcon,
  image: PhotoIcon,
  presentation: PresentationChartBarIcon,
  file: DocumentIcon,
} as const

async function download(path: string) {
  const { data, error } = await supabase.storage.from('resources').createSignedUrl(path, 60)
  if (error) return
  window.open(data.signedUrl, '_blank')
}
</script>

<template>
  <AppPageHeader
    title="Recursos"
    description="Descarga guías, elementos gráficos y materiales útiles para tu gestión."
  />

  <div class="space-y-4">
    <AppSearch v-model="search" placeholder="Buscar recurso..." />

    <AppTabs
      v-model="activeType"
      :options="[
        { label: 'Todos', value: 'all' },
        { label: 'Videos', value: 'video' },
        { label: 'Plantillas', value: 'template' },
        { label: 'Imágenes', value: 'image' },
        { label: 'Presentaciones', value: 'presentation' },
      ]"
    />

    <div v-if="isLoading" class="space-y-3">
      <AppSkeleton v-for="i in 3" :key="i" height="80px" />
    </div>

    <div v-else-if="!resources || resources.length === 0">
      <AppEmptyState title="Sin recursos" description="Pronto habrá nuevos materiales." icon-name="document" />
    </div>

    <div v-else class="space-y-3">
      <article v-for="r in resources" :key="r.id" class="flex items-center gap-3 p-4 rounded-lg bg-surface shadow-elevation1">
        <div class="shrink-0 w-12 h-12 rounded-md bg-secondary-100 flex items-center justify-center">
          <component :is="typeIcons[r.type as keyof typeof typeIcons] ?? DocumentIcon" class="w-6 h-6 text-accent" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-small font-semibold text-text-primary truncate">{{ r.title }}</h3>
          <p v-if="r.description" class="text-caption text-text-secondary line-clamp-1">{{ r.description }}</p>
        </div>
        <AppButton variant="ghost" icon-only aria-label="Descargar" @click="download(r.file_path)">
          <ArrowDownTrayIcon class="w-5 h-5" />
        </AppButton>
      </article>
    </div>
  </div>
</template>
