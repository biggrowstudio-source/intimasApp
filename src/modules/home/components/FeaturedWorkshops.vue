<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import { MapPinIcon, ArrowRightIcon, ClockIcon } from '@heroicons/vue/24/outline'
import type { UpcomingWorkshop } from '@modules/home/composables/useUpcomingWorkshops'

const props = defineProps<{
  workshops: UpcomingWorkshop[]
  registeredIds?: string[]
}>()

function isRegistered(id: string) {
  return props.registeredIds?.includes(id) ?? false
}

const formatted = computed(() => {
  return props.workshops.map((w, i) => ({
    ...w,
    isFirst: i === 0,
    dayShort: dayjs(w.date).format('ddd').toUpperCase(),
    dayNum: dayjs(w.date).format('D'),
    month: dayjs(w.date).format('MMM'),
    time: dayjs(w.date).format('HH:mm'),
  }))
})
</script>

<template>
  <section v-if="formatted.length > 0">
    <div class="flex items-center justify-between mb-4 px-1">
      <div>
        <h2 class="text-title font-semibold text-text-primary">Próximos workshops</h2>
        <p class="text-caption text-text-secondary mt-0.5">Capacitaciones pensadas para ti</p>
      </div>
      <RouterLink
        to="/workshops"
        class="text-small text-accent font-semibold flex items-center gap-1 hover:gap-2 transition-all"
      >
        Ver todos
        <ArrowRightIcon class="w-4 h-4" />
      </RouterLink>
    </div>

    <div class="space-y-3">
      <RouterLink
        v-for="w in formatted"
        :key="w.id"
        :to="`/full/workshop/${w.id}`"
        class="group block rounded-xl bg-surface shadow-elevation1 hover:shadow-elevation2 active:scale-[0.99] transition-all overflow-hidden"
      >
        <div class="flex items-stretch">
          <!-- Date badge -->
          <div
            :class="[
              'flex flex-col items-center justify-center min-w-[72px] px-3 py-4',
              w.isFirst ? 'bg-accent text-white' : 'bg-blush text-accent',
            ]"
          >
            <span class="text-caption font-semibold uppercase tracking-wider leading-none">{{ w.dayShort }}</span>
            <span class="text-h2 font-editorial font-bold leading-none my-1">{{ w.dayNum }}</span>
            <span class="text-caption font-semibold uppercase leading-none">{{ w.month }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 p-3.5 flex flex-col justify-center gap-1">
            <div class="flex items-center gap-2">
              <h3 class="text-title font-editorial font-semibold text-text-primary leading-snug line-clamp-2">
                {{ w.title }}
              </h3>
              <span
                v-if="w.isFirst"
                class="shrink-0 inline-flex items-center gap-1 bg-accent/10 text-accent text-caption font-semibold px-2 py-0.5 rounded-pill"
              >
                Destacado
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span class="inline-flex items-center gap-1">
                <ClockIcon class="w-3.5 h-3.5" />
                {{ w.time }}
              </span>
              <span v-if="w.location" class="inline-flex items-center gap-1">
                <MapPinIcon class="w-3.5 h-3.5" />
                {{ w.location }}
              </span>
              <span v-if="isRegistered(w.id)" class="inline-flex items-center gap-1 font-semibold text-accent">
                Inscrita ✓
              </span>
              <span
                v-else
                :class="[
                  'inline-flex items-center gap-1 font-semibold',
                  w.status === 'full' ? 'text-error' : 'text-success',
                ]"
              >
                {{ w.status === 'full' ? 'Lleno' : 'Disponible' }}
              </span>
            </div>
          </div>

          <!-- Chevron -->
          <div class="flex items-center pr-3.5 text-text-secondary">
            <ArrowRightIcon class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </RouterLink>
    </div>
  </section>
</template>
