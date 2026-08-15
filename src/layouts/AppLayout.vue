<script setup lang="ts">
import { watch } from 'vue'
import { useSwipeTabs } from '@composables/useSwipeTabs'
import { useRoute, useRouter } from 'vue-router'
import {
  PlusIcon,
  ShoppingBagIcon,
  CalendarIcon,
  TagIcon,
} from '@heroicons/vue/24/outline'
import AppSidebar from '@components/layout/AppSidebar.vue'
import { useUiStore } from '@stores/ui.store'

const { el } = useSwipeTabs()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

// Cerrar menús al cambiar de ruta
watch(() => route.fullPath, () => {
  ui.closeMobileMenus()
})

function navigateTo(path: string) {
  ui.closeMobileMenus()
  router.push(path)
}
</script>

<template>
  <div ref="el" class="min-h-screen bg-background touch-pan-y relative flex w-full">
    <!-- Sidebar en pantallas de escritorio -->
    <AppSidebar class="hidden desktop:flex shrink-0" />

    <!-- Contenedor del contenido principal -->
    <div class="flex-1 flex flex-col min-w-0 w-full desktop:pl-64">
      <main class="container-app py-5 tablet:py-6 overflow-hidden pb-36 tablet:pb-40 desktop:pb-12">
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <RouterView :key="route.fullPath" />
        </Transition>
      </main>
    </div>

    <!-- Overlay de fondo oscuro traslúcido cuando el FAB o Más está abierto -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="ui.activeMobileMenu !== 'none'"
        class="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs tablet:hidden"
        @click="ui.closeMobileMenus()"
      />
    </Transition>

    <!-- Botón de Acción Flotante (FAB) Premium -->
    <div
      class="fixed bottom-24 right-4 flex flex-col items-end gap-2.5 tablet:hidden transition-all duration-200"
      :class="ui.activeMobileMenu === 'more' ? 'z-30 opacity-40 pointer-events-none' : 'z-50 opacity-100'"
    >
      <!-- Opciones del FAB en un contenedor unificado -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-3 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-3 scale-95"
      >
        <div
          v-if="ui.activeMobileMenu === 'fab'"
          class="w-52 bg-surface border border-divider shadow-elevation3 rounded-2xl p-1.5 space-y-1 mb-1"
        >
          <!-- Opción: Nuevo Pedido -->
          <button
            type="button"
            class="flex items-center gap-3 w-full p-2.5 rounded-xl text-caption font-extrabold text-text-primary hover:bg-light transition-all duration-200 active:scale-[0.98] text-left"
            @click="navigateTo('/ordenes?action=new')"
          >
            <div class="w-8 h-8 rounded-xl bg-mint/60 text-success flex items-center justify-center shrink-0">
              <ShoppingBagIcon class="w-4 h-4" />
            </div>
            <span>Nuevo Pedido</span>
          </button>

          <!-- Opción: Nuevo Evento -->
          <button
            type="button"
            class="flex items-center gap-3 w-full p-2.5 rounded-xl text-caption font-extrabold text-text-primary hover:bg-light transition-all duration-200 active:scale-[0.98] text-left"
            @click="navigateTo('/planeador?action=new')"
          >
            <div class="w-8 h-8 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
              <CalendarIcon class="w-4 h-4" />
            </div>
            <span>Nuevo Evento</span>
          </button>

          <!-- Opción: Ver Catálogo -->
          <button
            type="button"
            class="flex items-center gap-3 w-full p-2.5 rounded-xl text-caption font-extrabold text-text-primary hover:bg-light transition-all duration-200 active:scale-[0.98] text-left"
            @click="navigateTo('/biblioteca')"
          >
            <div class="w-8 h-8 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0">
              <TagIcon class="w-4 h-4" />
            </div>
            <span>Ver Productos</span>
          </button>
        </div>
      </Transition>

      <!-- Botón Disparador Principal con Animación de Rotación -->
      <button
        type="button"
        class="w-12 h-12 rounded-full bg-accent hover:bg-accent/90 text-white shadow-elevation3 flex items-center justify-center transition-all duration-300 active:scale-90"
        :class="{ 'ring-4 ring-accent/20 scale-105': ui.activeMobileMenu === 'fab' }"
        @click="ui.toggleFab()"
      >
        <PlusIcon
          class="w-5 h-5 transition-transform duration-300"
          :class="{ 'rotate-[135deg]': ui.activeMobileMenu === 'fab' }"
        />
      </button>
    </div>



    <!-- Navegación inferior en móvil/tablet -->
    <AppBottomNav class="desktop:hidden" />
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s ease;
}

.slide-left-enter-from {
  transform: translateX(40%);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-40%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-40%);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(40%);
  opacity: 0;
}
</style>
