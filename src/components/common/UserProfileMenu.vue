<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth.store'
import { useOnlineUsers } from '@composables/useOnlineUsers'
import { UserCircleIcon, PencilSquareIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const router = useRouter()
const { onlineUsers } = useOnlineUsers()

const isOpen = ref(false)

const firstName = computed(() => auth.profile?.firstName || (auth.profile as any)?.first_name || 'Embajadora')
const lastName = computed(() => auth.profile?.lastName || (auth.profile as any)?.last_name || '')
const photoUrl = computed(() => auth.profile?.photoUrl || (auth.profile as any)?.photo_url || null)
const role = computed(() => auth.profile?.role ?? 'ambassador')

function roleLabel(r: string | null) {
  if (r === 'admin' || r === 'super_admin') return 'Administradora'
  if (r === 'moderator') return 'Moderadora'
  return 'Embajadora'
}

function goToProfile() {
  isOpen.value = false
  router.push('/perfil')
}

function goToEditProfile() {
  isOpen.value = false
  router.push('/perfil/editar')
}
</script>

<template>
  <div class="relative user-profile-menu-container">
    <!-- Avatar de Perfil con Indicador Verde e Interacción -->
    <button
      type="button"
      class="relative flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-accent/30 transition-all focus:outline-none"
      aria-label="Menú de perfil y usuarias en línea"
      @click.stop="isOpen = !isOpen"
    >
      <div class="relative w-10 h-10 rounded-full border-2 border-accent/20 overflow-hidden bg-accent-50 shrink-0">
        <img
          v-if="photoUrl"
          :src="photoUrl"
          :alt="firstName"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center font-extrabold text-accent bg-blush text-caption">
          {{ firstName.charAt(0) }}
        </div>
        <!-- Punto verde "En línea" en la esquina de la foto -->
        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-surface" />
      </div>

      <ChevronDownIcon class="w-3.5 h-3.5 text-text-secondary transition-transform" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Menú Desplegable Flotante Premium (z-[80]) -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 top-12 z-[80] w-80 bg-surface border border-divider shadow-elevation3 rounded-3xl p-4 space-y-4"
        @click.stop
      >
        <!-- Header de Mi Perfil -->
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-background border border-divider/60">
          <div class="relative w-12 h-12 rounded-full overflow-hidden bg-accent-50 border border-accent/30 shrink-0">
            <img v-if="photoUrl" :src="photoUrl" :alt="firstName" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center font-extrabold text-accent bg-blush text-body">
              {{ firstName.charAt(0) }}
            </div>
            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success ring-2 ring-surface" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-small font-extrabold text-text-primary truncate">
              {{ firstName }} {{ lastName }}
            </h3>
            <p class="text-[11px] text-accent font-bold uppercase tracking-wider">
              {{ roleLabel(role) }}
            </p>
            <p class="text-[10px] text-success font-medium flex items-center gap-1 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>Conectada en línea</span>
            </p>
          </div>
        </div>

        <!-- Accesos directos a mi perfil -->
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent-50 text-accent font-bold text-caption hover:bg-accent hover:text-white transition-colors"
            @click="goToProfile"
          >
            <UserCircleIcon class="w-4 h-4" />
            <span>Mi Perfil</span>
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-background border border-divider text-text-primary font-bold text-caption hover:bg-surface transition-colors"
            @click="goToEditProfile"
          >
            <PencilSquareIcon class="w-4 h-4 text-text-secondary" />
            <span>Editar</span>
          </button>
        </div>

        <hr class="border-divider" />

        <!-- Sección de Usuarias Conectadas en Tiempo Real -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
              <span class="text-caption font-extrabold text-text-primary">En línea ahora</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-success/15 text-success font-mono text-[10px] font-bold">
              {{ onlineUsers.length }} {{ onlineUsers.length === 1 ? 'activa' : 'activas' }}
            </span>
          </div>

          <!-- Lista con scroll max-h-48 de usuarias conectadas -->
          <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
            <div
              v-for="u in onlineUsers"
              :key="u.user_id"
              class="flex items-center gap-2.5 p-2 rounded-xl bg-background/80 hover:bg-background border border-divider/40 transition-colors"
            >
              <div class="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-accent-50 border border-accent/20">
                <img v-if="u.photoUrl" :src="u.photoUrl" :alt="u.firstName" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-extrabold text-accent bg-blush">
                  {{ u.firstName.charAt(0) }}
                </div>
                <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success ring-1 ring-surface" />
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-caption font-bold text-text-primary truncate">
                  {{ u.firstName }} {{ u.lastName }}
                </p>
                <p class="text-[10px] text-text-secondary truncate leading-none mt-0.5">
                  {{ roleLabel(u.role) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
