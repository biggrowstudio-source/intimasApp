<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import dayjs from '@utils/dayjs'
import { TrophyIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()

const { data: myBadges } = useQuery({
  queryKey: ['my-badges', auth.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        awarded_at,
        badge:badges(id, name, description, icon, points_required)
      `)
      .eq('user_id', auth.user!.id)
    if (error) throw error
    return (data ?? []).map((row) => ({
      awardedAt: row.awarded_at,
      ...((Array.isArray(row.badge) ? row.badge[0] : row.badge) as { id: string; name: string; description: string | null; icon: string | null; points_required: number }),
    }))
  },
  enabled: !!auth.user?.id,
})

const { data: myAchievements } = useQuery({
  queryKey: ['my-achievements', auth.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', auth.user!.id)
    if (error) throw error
    return data ?? []
  },
  enabled: !!auth.user?.id,
})
</script>

<template>
  <AppTopBar title="Mis logros" :back="true" />

  <div class="space-y-6">
    <section class="p-6 rounded-xl bg-gradient-to-br from-accent-50 to-secondary-100 text-center">
      <TrophyIcon class="w-10 h-10 mx-auto text-accent" />
      <p class="text-display font-editorial text-primary mt-2">{{ auth.profile?.points ?? 0 }}</p>
      <p class="text-small text-text-secondary">puntos acumulados</p>
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3">Insignias</h2>
      <div v-if="!myBadges || myBadges.length === 0" class="text-center py-6 text-text-secondary text-small">
        Aún no tienes insignias.
      </div>
      <div v-else class="grid grid-cols-3 gap-3">
        <div
          v-for="b in myBadges"
          :key="b.id"
          class="text-center p-3 rounded-lg bg-surface shadow-elevation1"
        >
          <div class="w-12 h-12 mx-auto rounded-pill bg-accent-50 flex items-center justify-center mb-2">
            <TrophyIcon class="w-6 h-6 text-accent" />
          </div>
          <p class="text-caption font-semibold text-text-primary truncate">{{ b.name }}</p>
          <p class="text-caption text-text-secondary">{{ dayjs(b.awardedAt).format('D MMM') }}</p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3">Logros</h2>
      <div v-if="!myAchievements || myAchievements.length === 0" class="text-center py-6 text-text-secondary text-small">
        Sin logros aún.
      </div>
      <div v-else class="space-y-3">
        <div v-for="a in myAchievements" :key="a.id" class="p-4 rounded-lg bg-surface shadow-elevation1">
          <div class="flex justify-between items-center mb-2">
            <span class="text-small font-medium text-text-primary">{{ a.key }}</span>
            <span class="text-caption text-text-secondary">{{ a.progress }} / {{ a.target }}</span>
          </div>
          <AppProgress :model-value="a.progress" :max="a.target" />
        </div>
      </div>
    </section>
  </div>
</template>
