<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useHomeContentBySlot } from '@modules/home/composables/useHomeContent'
import { ArrowRightIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const { data: features } = useHomeContentBySlot('featured')

function goTo(route: string | null) {
  if (route) router.push(route)
}
</script>

<template>
  <section v-if="features && features.length > 0">
    <header class="mb-3 px-1">
      <h2 class="text-title font-semibold text-text-primary">Destacado para ti</h2>
    </header>

    <div class="grid grid-cols-2 gap-3">
      <article
        v-for="feature in features"
        :key="feature.id"
        :class="[
          'relative overflow-hidden rounded-xl p-4 min-h-[160px] flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform',
          feature.bgClass ?? 'bg-secondary-100',
        ]"
        @click="goTo(feature.ctaRoute)"
      >
        <div class="relative z-10 max-w-[60%]">
          <h3 class="text-subtitle font-editorial text-text-primary leading-tight mb-1">
            {{ feature.title }}
          </h3>
          <p v-if="feature.subtitle" class="text-caption text-text-secondary mb-3">
            {{ feature.subtitle }}
          </p>
          <button
            type="button"
            class="w-9 h-9 rounded-pill bg-text-primary text-surface flex items-center justify-center hover:scale-105 transition-transform"
            :aria-label="`Ir a ${feature.title}`"
            @click.stop="goTo(feature.ctaRoute)"
          >
            <ArrowRightIcon class="w-4 h-4" />
          </button>
        </div>
        <img
          v-if="feature.imageUrl"
          :src="feature.imageUrl"
          :alt="feature.title ?? ''"
          class="absolute -right-2 -bottom-2 w-28 h-28 object-cover rounded-md shadow-elevation1 rotate-3"
          loading="lazy"
        />
      </article>
    </div>
  </section>
</template>
