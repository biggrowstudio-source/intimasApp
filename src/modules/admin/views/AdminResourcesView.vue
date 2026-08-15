<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'

const ui = useUiStore()
const qc = useQueryClient()

const { data: resources } = useQuery({
  queryKey: ['admin', 'resources'],
  queryFn: async () => {
    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
})

const showCreate = ref(false)
const file = ref<File | null>(null)
const form = ref({ title: '', description: '', type: 'video' as 'video' | 'template' | 'image' | 'presentation' | 'file' })

const create = useMutation({
  mutationFn: async () => {
    if (!file.value) throw new Error('Selecciona un archivo')
    const path = `${Date.now()}-${file.value.name}`
    const { error: upErr } = await supabase.storage.from('resources').upload(path, file.value)
    if (upErr) throw upErr
    const { error } = await supabase.from('resources').insert({
      title: form.value.title,
      description: form.value.description || null,
      type: form.value.type,
      file_path: path,
    })
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'resources'] })
    ui.pushToast({ title: 'Recurso creado', variant: 'success' })
    showCreate.value = false
    form.value = { title: '', description: '', type: 'video' }
    file.value = null
  },
})

const remove = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) throw error
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'resources'] }),
})
</script>

<template>
  <AppTopBar title="Recursos" :back="true">
    <template #actions>
      <AppButton size="sm" @click="showCreate = true">Subir recurso</AppButton>
    </template>
  </AppTopBar>

  <div class="space-y-3">
    <div v-if="!resources || resources.length === 0">
      <AppEmptyState title="Sin recursos" icon-name="document" />
    </div>

    <div v-else class="rounded-lg bg-surface shadow-elevation1 overflow-hidden divide-y divide-divider">
      <article v-for="r in resources" :key="r.id" class="p-4 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <p class="text-small font-medium truncate">{{ r.title }}</p>
          <p class="text-caption text-text-secondary">{{ r.type }}</p>
        </div>
        <AppButton size="sm" variant="danger" @click="remove.mutate(r.id)">Eliminar</AppButton>
      </article>
    </div>

    <AppModal v-model="showCreate" title="Nuevo recurso" size="md">
      <form class="space-y-3" @submit.prevent="create.mutate()">
        <AppInput v-model="form.title" label="Título" required />
        <AppTextarea v-model="form.description" label="Descripción" :rows="2" />
        <AppSelect
          v-model="form.type"
          label="Tipo"
          :options="[
            { label: 'Video', value: 'video' },
            { label: 'Plantilla', value: 'template' },
            { label: 'Imagen', value: 'image' },
            { label: 'Presentación', value: 'presentation' },
            { label: 'Archivo', value: 'file' },
          ]"
        />
        <AppUpload label="Archivo" @select="(f: File) => (file = f)" />
      </form>
      <template #footer>
        <AppButton variant="ghost" @click="showCreate = false">Cancelar</AppButton>
        <AppButton :loading="create.isPending.value" @click="create.mutate()">Subir</AppButton>
      </template>
    </AppModal>
  </div>
</template>
