<script setup lang="ts">
defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <!-- 1. Feliz / Smiling Face -->
  <svg
    v-if="name === 'feliz' || name === '😊'"
    class="shrink-0 text-amber-500 fill-amber-400/20 stroke-amber-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="2.5" />
    <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="2.5" />
  </svg>

  <!-- 2. Motivada / Fire -->
  <svg
    v-else-if="name === 'motivada' || name === '🔥'"
    class="shrink-0 text-rose-500 fill-rose-500/20 stroke-rose-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3" />
  </svg>

  <!-- 3. Inspirada / Sparkles -->
  <svg
    v-else-if="name === 'inspirada' || name === '✨'"
    class="shrink-0 text-amber-400 fill-amber-400/20 stroke-amber-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
  </svg>

  <!-- 4. Amorosa / Heart Face -->
  <svg
    v-else-if="name === 'amorosa' || name === '💖' || name === '🥰'"
    class="shrink-0 text-pink-500 fill-pink-500/20 stroke-pink-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>

  <!-- 5. Radiante / Sun -->
  <svg
    v-else-if="name === 'radiante' || name === '🌟' || name === '🌻'"
    class="shrink-0 text-yellow-500 fill-yellow-400/20 stroke-yellow-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>

  <!-- 6. Fuerte / Bolt -->
  <svg
    v-else-if="name === 'fuerte' || name === '💪'"
    class="shrink-0 text-purple-500 fill-purple-500/20 stroke-purple-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>

  <!-- 7. Agradecida / Star -->
  <svg
    v-else-if="name === 'agradecida' || name === '🙏'"
    class="shrink-0 text-teal-500 fill-teal-500/20 stroke-teal-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>

  <!-- 8. Encantada / Heart Glasses Face -->
  <svg
    v-else-if="name === 'encantada' || name === '😍'"
    class="shrink-0 text-rose-500 fill-rose-400/20 stroke-rose-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9l.01 0M15 9l.01 0" />
    <path d="M8 13.5a4 4 0 0 0 8 0" />
  </svg>

  <!-- 9. Tranquila / Relaxed Face -->
  <svg
    v-else-if="name === 'tranquila' || name === '😌'"
    class="shrink-0 text-cyan-500 fill-cyan-400/20 stroke-cyan-500"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 9.5c.5-.5 1.5-.5 2 0M14 9.5c.5-.5 1.5-.5 2 0" />
    <path d="M9 14.5s1 1.5 3 1.5 3-1.5 3-1.5" />
  </svg>

  <!-- 10. Default / Smile -->
  <svg
    v-else
    class="shrink-0 text-accent fill-accent/20 stroke-accent"
    :class="size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="2.5" />
    <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="2.5" />
  </svg>
</template>
