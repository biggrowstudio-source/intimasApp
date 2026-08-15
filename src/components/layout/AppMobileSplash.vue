<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@stores/auth.store'
import logoSvg from '@/assets/IntimasByLorena_Version_Vector.svg'

const auth = useAuthStore()
const isVisible = ref(false)
const isFading = ref(false)

const dismissSplash = () => {
  if (isFading.value) return
  isFading.value = true
  setTimeout(() => {
    isVisible.value = false
  }, 700)
}

// Esperar a que auth esté inicializado para saber si hay sesión o no
watch(
  () => auth.initialized,
  (ready) => {
    if (!ready) return
    if (!auth.isAuthenticated) {
      // No hay sesión: mostrar splash del logo
      isVisible.value = true
      setTimeout(() => dismissSplash(), 3200)
    }
    // Si hay sesión: no mostrar nada
  },
  { immediate: true }
)
</script>

<template>
  <Transition name="splash-fade">
    <div
      v-if="isVisible"
      :class="[
        'fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 select-none overflow-hidden cursor-pointer transition-opacity duration-700 ease-out',
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100',
      ]"
      style="background: linear-gradient(135deg, #FFF0F4 0%, #FDF2F6 40%, #F7E4EA 75%, #F0D5DF 100%);"
      @click="dismissSplash"
    >
      <!-- Fondos de brillo ambiental flotantes (Glassmorphism & Rose Glow) -->
      <div class="absolute top-1/4 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-blush/40 rounded-full blur-3xl animate-pulse pointer-events-none" style="animation-delay: 1s;" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/30 rounded-full blur-3xl pointer-events-none" />

      <!-- Partículas destellantes rosas (Feminine Sparkles) -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <span class="sparkle sparkle-1" />
        <span class="sparkle sparkle-2" />
        <span class="sparkle sparkle-3" />
        <span class="sparkle sparkle-4" />
        <span class="sparkle sparkle-5" />
      </div>

      <!-- Espaciador superior -->
      <div class="h-6" />

      <!-- Contenido Central: Únicamente el Logo vectorial animado plano y sofisticado -->
      <div class="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-sm w-full my-auto">
        <!-- Logo SVG plano y minimalista -->
        <div class="relative animate-logo-entrance">
          <img
            :src="logoSvg"
            alt="Intimas By Lorena Logo"
            class="relative z-10 w-64 sm:w-80 h-auto object-contain animate-logo-pulse"
          />
        </div>
      </div>

      <!-- Pie de Intro: Barra de progreso sedosa -->
      <div class="relative z-10 flex flex-col items-center w-full max-w-xs pb-6">
        <!-- Indicador de Carga Rosado -->
        <div class="w-36 h-1 bg-accent/15 rounded-full overflow-hidden relative">
          <div class="h-full bg-gradient-to-r from-accent-400 via-accent to-accent-600 rounded-full animate-progress-fill" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Entradas y Animaciones suaves */
@keyframes logoEntrance {
  0% {
    opacity: 0;
    transform: scale(0.82) translateY(18px);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

@keyframes textEntrance {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@keyframes progressFill {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

.animate-logo-entrance {
  animation: logoEntrance 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-text-entrance {
  animation: textEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards;
}

.animate-logo-pulse {
  animation: logoPulse 2.8s ease-in-out infinite 1.1s;
}

.animate-progress-fill {
  animation: progressFill 2.8s ease-out forwards;
}

/* Partículas centelleantes */
.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(224,122,120,0.8) 60%, rgba(255,255,255,0) 100%);
  box-shadow: 0 0 10px rgba(224, 122, 120, 0.8);
  opacity: 0;
  animation: sparkleTwinkle 2.5s infinite ease-in-out;
}

.sparkle-1 { top: 20%; left: 15%; animation-delay: 0.2s; }
.sparkle-2 { top: 35%; right: 18%; animation-delay: 0.8s; }
.sparkle-3 { top: 60%; left: 22%; animation-delay: 1.4s; }
.sparkle-4 { bottom: 25%; right: 25%; animation-delay: 0.5s; }
.sparkle-5 { top: 15%; right: 35%; animation-delay: 1.1s; }

@keyframes sparkleTwinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.3) rotate(0deg);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.4) rotate(45deg);
  }
}
</style>
