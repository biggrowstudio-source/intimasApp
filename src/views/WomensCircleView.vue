<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import dayjs from '@utils/dayjs'
import OnlineUsersBar from '@components/common/OnlineUsersBar.vue'

const auth = useAuthStore()
const ui = useUiStore()
const qc = useQueryClient()

const { data: groups } = useQuery({
  queryKey: ['womens-circle', 'groups', auth.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('womens_circle_groups')
      .select(`
        id, name, description, topic, is_private, created_at,
        members:womens_circle_members(user_id)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((g) => ({
      ...g,
      memberCount: Array.isArray(g.members) ? g.members.length : 0,
      isMember: Array.isArray(g.members) && auth.user?.id
        ? (g.members as Array<{ user_id: string }>).some((m) => m.user_id === auth.user!.id)
        : false,
    }))
  },
  enabled: computed(() => !!auth.user?.id),
})

const showCreate = ref(false)
const form = ref({ name: '', description: '', topic: '', is_private: true })

const createGroup = useMutation({
  mutationFn: async (input: typeof form.value) => {
    if (!auth.user?.id) throw new Error('No autenticado')
    const { error } = await supabase.from('womens_circle_groups').insert({
      name: input.name,
      description: input.description || null,
      topic: input.topic || null,
      is_private: input.is_private,
      created_by: auth.user.id,
    })
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['womens-circle'] })
    ui.pushToast({ title: 'Grupo creado', variant: 'success' })
    showCreate.value = false
    form.value = { name: '', description: '', topic: '', is_private: true }
  },
  onError: (e: Error) => ui.pushToast({ title: 'Error', description: e.message, variant: 'error' }),
})

const joinGroup = useMutation({
  mutationFn: async (groupId: string) => {
    if (!auth.user?.id) throw new Error('No autenticado')
    const { error } = await supabase
      .from('womens_circle_members')
      .insert({ group_id: groupId, user_id: auth.user.id })
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['womens-circle'] })
    ui.pushToast({ title: 'Te uniste al grupo', variant: 'success' })
  },
  onError: (e: Error) => ui.pushToast({ title: 'Error', description: e.message, variant: 'error' }),
})
</script>

<template>
  <AppTopBar title="Women's Circle">
    <template #actions>
      <AppButton size="sm" @click="showCreate = true">Nuevo grupo</AppButton>
    </template>
  </AppTopBar>

  <div class="space-y-4">
    <p class="text-small text-text-secondary">Espacios seguros para conversaciones privadas entre embajadoras.</p>

    <div v-if="!groups || groups.length === 0">
      <AppEmptyState title="Aún no hay grupos" description="Crea el primero o espera a ser invitada." icon-name="users" />
    </div>

    <div v-else class="space-y-3">
      <article v-for="g in groups" :key="g.id" class="p-4 rounded-lg bg-surface shadow-elevation1">
        <header class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-subtitle font-semibold text-text-primary">{{ g.name }}</h3>
            <p v-if="g.topic" class="text-caption text-accent mt-0.5">{{ g.topic }}</p>
          </div>
          <AppBadge v-if="g.is_private" variant="secondary">Privado</AppBadge>
          <AppBadge v-else variant="success">Público</AppBadge>
        </header>
        <p v-if="g.description" class="text-small text-text-secondary mt-2 line-clamp-2">{{ g.description }}</p>
        <footer class="flex items-center justify-between mt-3 pt-3 border-t border-divider">
          <span class="text-caption text-text-secondary">{{ g.memberCount }} miembros · {{ dayjs(g.created_at).fromNow() ?? g.created_at }}</span>
          <AppButton v-if="!g.isMember" size="sm" variant="outline" :loading="joinGroup.isPending.value" @click="joinGroup.mutate(g.id)">
            Unirme
          </AppButton>
          <span v-else class="text-caption text-success font-medium">Miembro</span>
        </footer>
      </article>
    </div>

    <AppModal v-model="showCreate" title="Nuevo grupo" size="md">
      <form class="space-y-4" @submit.prevent="createGroup.mutate(form)">
        <AppInput v-model="form.name" label="Nombre" required />
        <AppInput v-model="form.topic" label="Tema (opcional)" placeholder="Liderazgo, marketing, ..." />
        <AppTextarea v-model="form.description" label="Descripción" :rows="3" />
        <AppSwitch v-model="form.is_private" label="Grupo privado" description="Solo invitadas pueden unirse" />
      </form>
      <template #footer>
        <AppButton variant="ghost" @click="showCreate = false">Cancelar</AppButton>
        <AppButton :loading="createGroup.isPending.value" @click="createGroup.mutate(form)">Crear</AppButton>
      </template>
    </AppModal>
  </div>
</template>
