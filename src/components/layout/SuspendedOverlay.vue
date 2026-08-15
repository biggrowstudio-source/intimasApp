<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { NoSymbolIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth.store'

const auth = useAuthStore()

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

async function handleSignOut() {
  await auth.signOut()
  window.location.href = '/auth/login'
}
</script>

<template>
  <div class="fixed inset-0 z-[99999] h-[100dvh] w-screen bg-surface flex flex-col items-center justify-center p-6 text-center overflow-hidden touch-none select-none backdrop-blur-xl animate-in fade-in duration-300">
    <div class="max-w-md w-full bg-surface border border-error/30 rounded-3xl p-8 shadow-elevation2 space-y-6 flex flex-col items-center">
      <!-- Icono de Bloqueo -->
      <div class="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center border border-error/30 shadow-inner">
        <NoSymbolIcon class="w-10 h-10 animate-pulse" />
      </div>

      <!-- Encabezado -->
      <div class="space-y-2">
        <h1 class="text-h2 font-editorial font-extrabold text-text-primary tracking-tight">
          Cuenta Suspendida
        </h1>
        <p class="text-small text-text-secondary leading-relaxed">
          Has sido suspendido/a de la plataforma <strong class="text-text-primary font-bold">ÍNTIMAS BY LORENA</strong>. Tu acceso a la comunidad, biblioteca y funciones del sistema ha sido bloqueado por el equipo de administración.
        </p>
      </div>

      <!-- Caja de Información de Soporte -->
      <div class="w-full p-4 rounded-2xl bg-background border border-divider text-caption text-text-secondary text-left space-y-2">
        <p class="font-bold text-text-primary">¿Crees que es un error?</p>
        <p>
          Si consideras que la suspensión es un malentendido o deseas solicitar la reactivación de tu cuenta, por favor comunícate directamente con soporte o administración.
        </p>
      </div>

      <!-- Acciones de Usuario -->
      <div class="w-full space-y-3 pt-2">
        <a
          href="mailto:soporte@intimas.app?subject=Solicitud%20de%20Reactivaci%C3%B3n%20de%20Cuenta"
          class="w-full h-11 rounded-pill bg-accent text-white font-bold text-caption flex items-center justify-center gap-2 transition-all shadow-sm hover:bg-accent-600 active:scale-95"
        >
          <ChatBubbleLeftRightIcon class="w-4 h-4" />
          <span>Contactar a Soporte</span>
        </a>

        <button
          type="button"
          class="w-full h-11 rounded-pill bg-background border border-divider text-text-primary hover:bg-surface font-bold text-caption flex items-center justify-center gap-2 transition-all active:scale-95"
          @click="handleSignOut"
        >
          <ArrowRightOnRectangleIcon class="w-4 h-4 text-text-secondary" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  </div>
</template>
