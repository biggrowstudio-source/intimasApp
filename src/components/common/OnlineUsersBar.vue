<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOnlineUsers } from '@composables/useOnlineUsers'
import { UserIcon, XMarkIcon, SparklesIcon } from '@heroicons/vue/24/outline'

const { onlineUsers } = useOnlineUsers()

const showModal = ref(false)

const displayedUsers = computed(() => onlineUsers.value.slice(0, 5))
const remainingCount = computed(() => Math.max(0, onlineUsers.value.length - 5))

function roleLabel(role: string | null) {
  if (role === 'admin' || role === 'super_admin') return 'Administradora'
  if (role === 'moderator') return 'Moderadora'
  return 'Embajadora'
}
</script>

<template>
  <div v-if="onlineUsers.length > 0" class="w-full">
    <!-- Tarjeta / Barra Flotante Premium de Usuarias Conectadas -->
    <div
      class="group relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-surface via-blush/30 to-surface border border-accent/20 shadow-elevation1 hover:shadow-elevation2 hover:border-accent/40 transition-all cursor-pointer overflow-hidden"
      @click="showModal = true"
    >
      <!-- Halo decorativo suave -->
      <span class="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-accent/10 blur-xl pointer-events-none" aria-hidden="true" />

      <!-- Lado Izquierdo: Estado Verde + Contador -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="relative flex items-center justify-center">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-caption font-extrabold text-text-primary">Conectadas en vivo</span>
            <span class="px-2 py-0.5 rounded-full bg-success/15 text-success font-mono text-[11px] font-extrabold">
              {{ onlineUsers.length }} {{ onlineUsers.length === 1 ? 'activa' : 'activas' }}
            </span>
          </div>
          <p class="text-[11px] text-text-secondary truncate">Toca para ver quiénes están en línea</p>
        </div>
      </div>

      <!-- Lado Derecho: Avatares con Punto Verde individual -->
      <div class="flex items-center -space-x-2 shrink-0">
        <div
          v-for="user in displayedUsers"
          :key="user.user_id"
          class="relative inline-block w-8 h-8 rounded-full border-2 border-surface bg-accent-50 overflow-hidden shadow-xs"
        >
          <img
            v-if="user.photoUrl"
            :src="user.photoUrl"
            :alt="user.firstName"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-extrabold text-accent bg-blush">
            {{ user.firstName.charAt(0) }}
          </div>
          <!-- Punto indicador verde en cada foto -->
          <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success ring-1 ring-surface" />
        </div>

        <div
          v-if="remainingCount > 0"
          class="w-8 h-8 rounded-full border-2 border-surface bg-accent text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
        >
          +{{ remainingCount }}
        </div>
      </div>
    </div>

    <!-- Modal Modal Lista Completa de Usuarias en Línea -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showModal"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showModal = false"
        >
          <div class="w-full max-w-md bg-surface border border-divider shadow-elevation3 rounded-3xl overflow-hidden flex flex-col max-h-[80vh]">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-4 border-b border-divider bg-background">
              <div class="flex items-center gap-2">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
                <h3 class="text-title font-extrabold text-text-primary">Usuarias en Línea</h3>
                <span class="px-2 py-0.5 rounded-full bg-success/15 text-success font-mono text-caption font-bold">
                  {{ onlineUsers.length }}
                </span>
              </div>
              <button
                type="button"
                class="w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                @click="showModal = false"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Lista de Usuarias Conectadas -->
            <div class="p-3 overflow-y-auto space-y-2 flex-1">
              <div
                v-for="u in onlineUsers"
                :key="u.user_id"
                class="flex items-center gap-3 p-3 rounded-2xl bg-background hover:bg-surface border border-divider/60 transition-colors"
              >
                <div class="relative shrink-0 w-11 h-11 rounded-full overflow-hidden bg-accent-50 border border-accent/20">
                  <img v-if="u.photoUrl" :src="u.photoUrl" :alt="u.firstName" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-small font-extrabold text-accent bg-blush">
                    {{ u.firstName.charAt(0) }}
                  </div>
                  <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success ring-2 ring-surface" />
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="text-small font-bold text-text-primary truncate">
                    {{ u.firstName }} {{ u.lastName }}
                  </h4>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] font-semibold text-accent uppercase tracking-wider">
                      {{ roleLabel(u.role) }}
                    </span>
                    <span class="text-[10px] text-success font-medium">• En línea ahora</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
