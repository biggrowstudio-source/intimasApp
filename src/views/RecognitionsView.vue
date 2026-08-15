<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { TrophyIcon, StarIcon, SparklesIcon } from '@heroicons/vue/24/solid'

const auth = useAuthStore()

const { data: myBadges } = useQuery({
  queryKey: ['recognitions', 'my-badges', auth.user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        awarded_at,
        badge:badges(id, name, description, icon, points_required)
      `)
      .eq('user_id', auth.user!.id)
      .order('awarded_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row) => ({
      awardedAt: row.awarded_at,
      ...((Array.isArray(row.badge) ? row.badge[0] : row.badge) as { id: string; name: string; description: string | null; icon: string | null; points_required: number }),
    }))
  },
  enabled: !!auth.user?.id,
})

const { data: topRank } = useQuery({
  queryKey: ['recognitions', 'top-rank'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, photo_url, points')
      .order('points', { ascending: false })
      .limit(10)
    if (error) throw error
    return data ?? []
  },
})

const { data: currentLevel } = useQuery({
  queryKey: ['recognitions', 'level', auth.profile?.levelId],
  queryFn: async () => {
    if (!auth.profile?.levelId) return null
    const { data, error } = await supabase.from('levels').select('*').eq('id', auth.profile.levelId).maybeSingle()
    if (error) throw error
    return data
  },
})

const nextLevelPoints = computed(() => {
  if (!auth.profile) return 100
  const points = auth.profile.points ?? 0
  const milestones = [0, 100, 300, 700, 1500, 3000]
  return milestones.find((m) => m > points) ?? 3000
})
</script>

<template>
  <AppTopBar title="Reconocimientos" />

  <div class="space-y-6">
    <section class="p-6 rounded-xl bg-gradient-to-br from-accent-50 to-secondary-100 text-center">
      <SparklesIcon class="w-12 h-12 mx-auto text-accent" />
      <p class="text-display font-editorial text-primary mt-2">{{ auth.profile?.points ?? 0 }}</p>
      <p class="text-small text-text-secondary">puntos acumulados</p>
    </section>

    <section v-if="auth.profile">
      <div class="flex justify-between text-small mb-2">
        <span class="font-medium">{{ currentLevel?.name ?? 'Nivel actual' }}</span>
        <span class="text-text-secondary">{{ auth.profile.points ?? 0 }} / {{ nextLevelPoints }}</span>
      </div>
      <AppProgress
        :model-value="auth.profile.points ?? 0"
        :max="nextLevelPoints"
        variant="accent"
      />
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3 flex items-center gap-2">
        <TrophyIcon class="w-5 h-5 text-accent" /> Tus insignias
      </h2>
      <div v-if="!myBadges || myBadges.length === 0" class="text-center py-8 text-text-secondary text-small">
        Aún no tienes insignias. ¡Participa para conseguir las primeras!
      </div>
      <div v-else class="grid grid-cols-3 tablet:grid-cols-4 gap-3">
        <div
          v-for="b in myBadges"
          :key="b.id"
          class="text-center p-3 rounded-lg bg-surface shadow-elevation1"
        >
          <div class="w-12 h-12 mx-auto rounded-pill bg-accent-50 flex items-center justify-center mb-2">
            <StarIcon class="w-6 h-6 text-accent" />
          </div>
          <p class="text-caption font-semibold text-text-primary truncate">{{ b.name }}</p>
          <p class="text-caption text-text-secondary">{{ b.points_required }} pts</p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3">Ranking</h2>
      <div v-if="!topRank || topRank.length === 0" class="text-center py-6 text-text-secondary text-small">
        Aún no hay ranking.
      </div>
      <div v-else class="space-y-2">
        <article
          v-for="(p, i) in topRank"
          :key="p.id"
          :class="[
            'flex items-center gap-3 p-3 rounded-lg bg-surface shadow-elevation1',
            p.id === auth.profile?.id ? 'ring-2 ring-accent' : '',
          ]"
        >
          <span class="shrink-0 w-7 h-7 rounded-pill bg-secondary-100 flex items-center justify-center font-bold text-caption">
            {{ i + 1 }}
          </span>
          <AppAvatar :src="p.photo_url" :name="`${p.first_name} ${p.last_name}`" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-small font-medium truncate">{{ p.first_name }} {{ p.last_name }}</p>
          </div>
          <span class="text-small font-semibold text-accent">{{ p.points ?? 0 }} pts</span>
        </article>
      </div>
    </section>
  </div>
</template>
