<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'

const ui = useUiStore()
const qc = useQueryClient()

const { data: badges } = useQuery({
  queryKey: ['admin', 'badges'],
  queryFn: async () => {
    const { data, error } = await supabase.from('badges').select('*').order('points_required', { ascending: true })
    if (error) throw error
    return data ?? []
  },
})

const { data: levels } = useQuery({
  queryKey: ['admin', 'levels'],
  queryFn: async () => {
    const { data, error } = await supabase.from('levels').select('*').order('"order"', { ascending: true })
    if (error) throw error
    return data ?? []
  },
})

const showBadge = ref(false)
const badgeForm = ref({ name: '', description: '', points_required: 0 })

const createBadge = useMutation({
  mutationFn: async () => {
    const { error } = await supabase.from('badges').insert(badgeForm.value)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'badges'] })
    ui.pushToast({ title: 'Insignia creada', variant: 'success' })
    showBadge.value = false
    badgeForm.value = { name: '', description: '', points_required: 0 }
  },
})
</script>

<template>
  <AppTopBar title="Reconocimientos" :back="true">
    <template #actions>
      <AppButton size="sm" @click="showBadge = true">Nueva insignia</AppButton>
    </template>
  </AppTopBar>

  <div class="space-y-6">
    <section>
      <h2 class="text-title font-semibold mb-3">Insignias</h2>
      <div v-if="!badges || badges.length === 0" class="text-center py-6 text-text-secondary text-small">
        Sin insignias
      </div>
      <div v-else class="rounded-lg bg-surface shadow-elevation1 overflow-hidden divide-y divide-divider">
        <article v-for="b in badges" :key="b.id" class="p-4 flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-small font-medium">{{ b.name }}</p>
            <p class="text-caption text-text-secondary">{{ b.description ?? '—' }}</p>
          </div>
          <span class="text-caption text-text-secondary">{{ b.points_required }} pts</span>
        </article>
      </div>
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3">Niveles</h2>
      <div v-if="!levels || levels.length === 0" class="text-center py-6 text-text-secondary text-small">
        Sin niveles
      </div>
      <div v-else class="space-y-2">
        <div v-for="l in levels" :key="l.id" class="p-4 rounded-lg bg-surface shadow-elevation1 flex items-center justify-between">
          <div>
            <p class="text-small font-medium">{{ l.name }}</p>
            <p class="text-caption text-text-secondary">{{ l.min_points }} pts mínimos</p>
          </div>
          <span class="text-caption text-text-secondary">Orden #{{ l.order }}</span>
        </div>
      </div>
    </section>

    <AppModal v-model="showBadge" title="Nueva insignia" size="md">
      <form class="space-y-3" @submit.prevent="createBadge.mutate()">
        <AppInput v-model="badgeForm.name" label="Nombre" required />
        <AppTextarea v-model="badgeForm.description" label="Descripción" :rows="2" />
        <AppInput v-model.number="badgeForm.points_required" type="number" label="Puntos requeridos" />
      </form>
      <template #footer>
        <AppButton variant="ghost" @click="showBadge = false">Cancelar</AppButton>
        <AppButton :loading="createBadge.isPending.value" @click="createBadge.mutate()">Crear</AppButton>
      </template>
    </AppModal>
  </div>
</template>
