<script setup lang="ts">
import { computed } from 'vue'
import { SparklesIcon } from '@heroicons/vue/24/outline'

const quotes = [
  { text: 'El crecimiento personal no es un destino, es un camino que recorres rodeada de mujeres que te inspiran.', author: 'Intimas' },
  { text: 'Cada conversación en esta comunidad es una semilla. Riégala con autenticidad y verás florecer conexiones únicas.', author: 'Intimas' },
  { text: 'Tu historia inspira a alguien que todavía no ha leído tu primera publicación.', author: 'Intimas' },
  { text: 'Vender con el corazón no es debilidad, es la mayor fortaleza de una embajadora.', author: 'Intimas' },
  { text: 'Hoy es un buen día para celebrar los pequeños logros que nadie más ve.', author: 'Intimas' },
  { text: 'No necesitas tener todas las respuestas. Solo necesitas estar abierta a aprender juntas.', author: 'Intimas' },
  { text: 'Una comunidad se construye con conversaciones honestas y silencios cómplices.', author: 'Intimas' },
]

const todayQuote = computed(() => {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return quotes[day % quotes.length]
})
</script>

<template>
  <aside class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-700 p-6 text-white">
    <div class="absolute -top-8 -right-8 w-32 h-32 rounded-pill bg-accent/15 blur-2xl" aria-hidden="true" />
    <div class="absolute -bottom-6 -left-6 w-24 h-24 rounded-pill bg-secondary-300/20 blur-2xl" aria-hidden="true" />

    <div class="relative">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-white/10 backdrop-blur-sm mb-3">
        <SparklesIcon class="w-3.5 h-3.5 text-accent-300" />
        <span class="text-caption font-semibold uppercase tracking-wide">Inspiración del día</span>
      </div>

      <blockquote class="font-editorial text-title leading-snug italic">
        "{{ todayQuote.text }}"
      </blockquote>

      <p class="text-caption text-white/60 mt-3">— {{ todayQuote.author }}</p>
    </div>
  </aside>
</template>
