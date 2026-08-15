<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { animate } from 'motion'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { useUpcomingEvents, useLatestPosts } from '@modules/home/composables/useHome'
import { useUpcomingWorkshops } from '@modules/home/composables/useUpcomingWorkshops'

import GreetingCard from '@modules/home/components/GreetingCard.vue'
import OnlineUsersBar from '@components/common/OnlineUsersBar.vue'
import HeroBanner from '@modules/home/components/HeroBanner.vue'
import QuickActions from '@modules/home/components/QuickActions.vue'
import UpcomingEvents from '@modules/home/components/UpcomingEvents.vue'
import FeaturedWorkshops from '@modules/home/components/FeaturedWorkshops.vue'
import CommunityPulse from '@modules/home/components/CommunityPulse.vue'
import FeaturedForYou from '@modules/home/components/FeaturedForYou.vue'

import { CalendarIcon, PlusIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const { data: events, isLoading: eventsLoading } = useUpcomingEvents()
const { data: posts } = useLatestPosts()
const { data: workshops } = useUpcomingWorkshops()

const { data: myRegistrations } = useQuery({
  queryKey: ['workshops', 'my-registrations', auth.user?.id],
  queryFn: async () => {
    if (!auth.user?.id) return []
    const { data, error } = await supabase
      .from('workshop_registrations')
      .select('workshop_id')
      .eq('user_id', auth.user.id)
    if (error) throw error
    return data ?? []
  },
  enabled: computed(() => !!auth.user?.id),
})

const registeredIds = computed(() => myRegistrations.value?.map((r) => r.workshop_id) ?? [])

onMounted(() => {
  animate(
    '.home-section',
    { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
    { duration: 0.4, delay: 0.05, easing: 'ease-out' },
  )
})
</script>

<template>
  <div class="space-y-6">
    <GreetingCard />

    <HeroBanner class="home-section" />

    <QuickActions class="home-section" />

    <hr class="border-divider mx-1 my-12" />

    <FeaturedWorkshops
      v-if="workshops && workshops.length > 0"
      :workshops="workshops"
      :registered-ids="registeredIds"
      class="home-section"
    />

    <section class="home-section">
      <header class="flex items-center justify-between mb-3 px-1">
        <h2 class="text-title font-semibold text-text-primary">Próximos eventos</h2>
        <RouterLink to="/planeador" class="text-small text-accent font-medium hover:underline">
          Ver planeador
        </RouterLink>
      </header>

      <div v-if="eventsLoading" class="space-y-2.5">
        <AppSkeleton v-for="i in 2" :key="i" height="76px" />
      </div>

      <div v-else-if="!events || events.length === 0">
        <RouterLink
          to="/planeador"
          class="block p-5 rounded-xl bg-surface shadow-elevation1 text-center hover:shadow-elevation2 transition-shadow"
        >
          <div class="w-12 h-12 mx-auto rounded-pill bg-blush flex items-center justify-center mb-2">
            <CalendarIcon class="w-6 h-6 text-accent" />
          </div>
          <p class="text-small font-semibold text-text-primary">Tu semana está libre</p>
          <p class="text-caption text-text-secondary mt-1 mb-3">Crea tu primer evento para organizar tu agenda.</p>
          <span class="inline-flex items-center gap-1.5 px-4 h-9 rounded-pill bg-primary text-white text-caption font-semibold">
            <PlusIcon class="w-4 h-4" />
            Crear evento
          </span>
        </RouterLink>
      </div>

      <UpcomingEvents v-else :events="events" />
    </section>

    <CommunityPulse
      v-if="posts && posts.length > 0"
      :posts="posts.slice(0, 1)"
      class="home-section"
    />

    <FeaturedForYou class="home-section" />
  </div>
</template>
