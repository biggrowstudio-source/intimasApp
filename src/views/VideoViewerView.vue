<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'

const route = useRoute()
const id = String(route.params.resourceId ?? '')

const { data, isLoading } = useQuery({
  queryKey: ['resource', id],
  queryFn: async () => {
    const { data, error } = await supabase.from('resources').select('*').eq('id', id).single()
    if (error) throw error
    const { data: signed } = await supabase.storage.from('resources').createSignedUrl(data.file_path, 60 * 30)
    return { ...data, url: signed?.signedUrl ?? '' }
  },
})
</script>

<template>
  <div class="h-full flex flex-col bg-black">
    <div v-if="isLoading" class="flex-1 flex items-center justify-center text-white">Cargando...</div>
    <video
      v-else-if="data?.url"
      :src="data.url"
      controls
      autoplay
      class="w-full h-full"
    />
  </div>
</template>
