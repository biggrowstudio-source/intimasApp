<script setup lang="ts">
import { ref } from 'vue'
import { useOnlineUsers } from '@composables/useOnlineUsers'
import { UsersIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { onlineUsers } = useOnlineUsers()
const showModal = ref(false)

function roleLabel(role: string | null) {
  if (role === 'admin' || role === 'super_admin') return 'Administradora'
  if (role === 'moderator') return 'Moderadora'
  return 'Embajadora'
}
</script>

<template>
  <div class="relative inline-block">
    <!-- Botón compacto de Usuarias en línea con icono y contador -->
    <button
      type="button"
      class="relative shrink-0 h-10 px-3 rounded-pill bg-surface shadow-elevation1 flex items-center gap-1.5 hover:shadow-elevation2 transition-all border border-divider hover:border-accent/40 group cursor-pointer"
      aria-label="Usuarias en línea"
      @click="showModal = true"
    >
      <!-- Punto verde pulsante -->
      <span class="relative flex h-2.5 w-2.5 shrink-0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
      </span>

      <!-- Icono de Usuarios -->
      <UsersIcon class="w-4.5 h-4.5 text-text-primary group-hover:text-accent transition-colors" />

      <!-- Número de usuarias conectadas -->
      <span class="text-caption font-extrabold font-mono text-text-primary group-hover:text-accent transition-colors">
        {{ onlineUsers.length }}
      </span>
    </button>

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
            <!-- Header del Modal -->
            <div class="flex items-center justify-between p-4 border-b border-divider bg-background">
              <div class="flex items-center gap-2">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
                <h3 class="text-title font-extrabold text-text-primary">Usuarias en Línea</h3>
                <span class="px-2.5 py-0.5 rounded-full bg-success/15 text-success font-mono text-caption font-bold">
                  {{ onlineUsers.length }} {{ onlineUsers.length === 1 ? 'activa' : 'activas' }}
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
