<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useHomeContentBySlot } from '@modules/home/composables/useHomeContent'

const { data: slides, isLoading } = useHomeContentBySlot('hero')

const active = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function goTo(i: number) {
  active.value = i
}

function next() {
  if (!slides.value || slides.value.length === 0) return
  active.value = (active.value + 1) % slides.value.length
}

const activeSlide = computed(() => slides.value?.[active.value])

onMounted(() => {
  timer = setInterval(next, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section
    v-if="slides && slides.length > 0"
    class="relative overflow-hidden rounded-3xl bg-[#F4D8D5] shadow-elevation1 h-[280px] tablet:h-[320px]"
  >
    <div
      v-for="(slide, i) in slides"
      :key="slide.id"
      :class="[
        'absolute inset-0 transition-opacity duration-slow',
        i === active ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ]"
    >
      <!-- Overlay Degradado en Rosa Pastel #F4D8D5 Sin Oscurecimiento -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#F4D8D5] via-[#F4D8D5]/95 via-60% to-transparent z-10" />
      
      <img
        v-if="slide.imageUrl"
        :src="slide.imageUrl"
        :alt="slide.title ?? ''"
        class="absolute right-0 top-0 h-full w-2/3 object-cover object-center"
        loading="lazy"
      />

      <div class="relative z-20 h-full flex flex-col justify-center p-6 tablet:p-8 text-primary max-w-[65%] sm:max-w-[55%]">
        <p v-if="slide.subtitle" class="text-caption font-extrabold tracking-[0.25em] text-accent uppercase mb-2">
          {{ slide.subtitle }}
        </p>
        <div v-if="slide.title || slide.description">
          <h2 v-if="slide.title" class="text-h2 sm:text-h1 font-editorial font-bold leading-[1.12] tracking-tight mb-3 text-balance text-primary">
            {{ slide.title }}
          </h2>
          <span v-if="slide.title" class="block w-10 h-0.5 bg-accent rounded-full mb-3" aria-hidden="true" />
          <p v-if="slide.description" class="text-small text-text-primary/90 leading-relaxed font-medium">
            {{ slide.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Puntos de Navegación -->
    <div v-if="slides.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      <button
        v-for="(slide, i) in slides"
        :key="`dot-${slide.id}`"
        type="button"
        :aria-label="`Ir al slide ${i + 1}`"
        :aria-current="i === active"
        :class="[
          'h-1.5 rounded-pill transition-all duration-300',
          i === active ? 'w-6 bg-accent' : 'w-1.5 bg-accent/30 hover:bg-accent/60',
        ]"
        @click="goTo(i)"
      />
    </div>
  </section>

  <div
    v-else-if="isLoading"
    class="rounded-3xl bg-[#F4D8D5]/50 h-[280px] tablet:h-[320px] animate-pulse"
    aria-hidden="true"
  />
</template>
