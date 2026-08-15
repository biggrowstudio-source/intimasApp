<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  HomeIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  AcademicCapIcon,
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeSolid,
  BookOpenIcon as BookSolid,
  ShoppingBagIcon as ShoppingSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  EllipsisHorizontalIcon as EllipsisSolid,
  CalendarIcon as CalendarSolid,
  AcademicCapIcon as AcademicCapSolid,
  UserCircleIcon as UserSolid,
  BellIcon as BellSolid,
  ShieldCheckIcon as ShieldSolid,
} from '@heroicons/vue/24/solid'
import { useNotifications } from '@composables/useNotifications'
import { useUiStore } from '@stores/ui.store'
import { useAuthStore } from '@stores/auth.store'

const route = useRoute()
const ui = useUiStore()
const auth = useAuthStore()
const { unreadCount } = useNotifications()

const isAdmin = computed(() => auth.role === 'admin' || auth.role === 'super_admin')
const userPhotoUrl = computed(() => auth.profile?.photoUrl || (auth.profile as any)?.photo_url || null)
const userFirstName = computed(() => auth.profile?.firstName || (auth.profile as any)?.first_name || 'Embajadora')

const items = computed(() => [
  { name: 'home', label: 'Inicio', to: '/', Icon: HomeIcon, Active: HomeSolid },
  { name: 'library', label: 'Biblioteca', to: '/biblioteca', Icon: BookOpenIcon, Active: BookSolid },
  { name: 'orders', label: 'Órdenes', to: '/ordenes', Icon: ShoppingBagIcon, Active: ShoppingSolid },
  { name: 'planner', label: 'Planificador', to: '/planeador', Icon: CalendarIcon, Active: CalendarSolid },
])

const dropdownItems = computed(() => [
  { label: 'Notificaciones', to: '/notificaciones', Icon: BellIcon, Active: BellSolid, badge: unreadCount.value },
  { label: 'Workshops', to: '/workshops', Icon: AcademicCapIcon, Active: AcademicCapSolid },
  { label: 'Comunidad', to: '/comunidad', Icon: ChatBubbleLeftRightIcon, Active: ChatSolid },
  { label: 'Mi Perfil', to: '/perfil', Icon: UserCircleIcon, Active: UserSolid },
  ...(isAdmin.value
    ? [{ label: 'Panel Admin', to: '/admin', Icon: ShieldCheckIcon, Active: ShieldSolid, badge: 0, isAdminItem: true }]
    : []),
])

const isDropdownActive = computed(() => {
  return dropdownItems.value.some((item) => isActive(item.to))
})

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-divider safe-bottom desktop:hidden"
    aria-label="Navegación principal"
  >
    <ul class="flex items-center justify-around max-w-[640px] mx-auto px-2 py-1.5 relative">
      <!-- Elementos directos de navegación -->
      <li v-for="item in items" :key="item.name" class="flex-1 flex items-center justify-center px-1">
        <RouterLink
          :to="item.to"
          :class="[
            'flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1.5 rounded-2xl transition-all duration-200',
            isActive(item.to)
              ? 'bg-blush text-accent border border-accent/20 font-extrabold shadow-2xs'
              : 'text-text-secondary hover:text-text-primary active:scale-95 font-medium',
          ]"
          @click="ui.closeMobileMenus()"
        >
          <component
            :is="isActive(item.to) ? item.Active : item.Icon"
            class="w-6 h-6 shrink-0 transition-transform duration-200"
            :class="{ 'scale-105': isActive(item.to) }"
            aria-hidden="true"
          />
          <span class="text-caption truncate leading-none">
            {{ item.label }}
          </span>
        </RouterLink>
      </li>

      <!-- Botón de tres puntos "Más" -->
      <li class="flex-1 flex items-center justify-center px-1 relative">
        <button
          type="button"
          :class="[
            'relative flex flex-col items-center justify-center gap-1 w-full py-2.5 px-1.5 rounded-2xl transition-all duration-200',
            isDropdownActive || ui.activeMobileMenu === 'more'
              ? 'bg-blush text-accent border border-accent/20 font-extrabold shadow-2xs'
              : 'text-text-secondary hover:text-text-primary active:scale-95 font-medium',
          ]"
          @click="ui.toggleMoreMenu()"
        >
          <component
            :is="isDropdownActive || ui.activeMobileMenu === 'more' ? EllipsisSolid : EllipsisHorizontalIcon"
            class="w-6 h-6 shrink-0 transition-transform duration-200"
            :class="{ 'scale-105': isDropdownActive || ui.activeMobileMenu === 'more' }"
            aria-hidden="true"
          />
          <span class="text-caption truncate leading-none">
            Más
          </span>
          <span
            v-if="unreadCount > 0"
            class="absolute top-2 right-4 w-2.5 h-2.5 rounded-full bg-error border border-surface"
          ></span>
        </button>

        <!-- Menú Desplegable Flotante Premium con Prioridad z-[70] -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="ui.activeMobileMenu === 'more'"
            class="absolute bottom-16 right-2 z-[70] w-52 bg-surface border border-divider shadow-elevation3 rounded-2xl p-1.5 space-y-1"
          >
            <RouterLink
              v-for="opt in dropdownItems"
              :key="opt.to"
              :to="opt.to"
              :class="[
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-caption font-extrabold transition-all duration-200',
                (opt as any).isAdminItem
                  ? isActive(opt.to)
                    ? 'bg-violet-500/20 text-violet-600'
                    : 'text-violet-600 hover:bg-violet-50 border border-violet-200/60'
                  : isActive(opt.to)
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-primary hover:bg-light/60',
              ]"
              @click="ui.closeMobileMenus()"
            >
              <div class="flex items-center gap-3">
                <div v-if="opt.to === '/perfil'" class="relative w-5 h-5 rounded-full overflow-hidden bg-accent-50 border border-accent/40 shrink-0">
                  <img v-if="userPhotoUrl" :src="userPhotoUrl" :alt="userFirstName" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center font-extrabold text-accent text-[9px] bg-blush">
                    {{ userFirstName.charAt(0) }}
                  </div>
                </div>
                <component v-else :is="isActive(opt.to) ? opt.Active : opt.Icon" class="w-4 h-4 shrink-0" />
                <span>{{ opt.label }}</span>
              </div>
              <span
                v-if="(opt as any).badge > 0"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error text-white min-w-[18px] text-center"
              >
                {{ (opt as any).badge }}
              </span>
            </RouterLink>
          </div>
        </Transition>
      </li>
    </ul>
  </nav>

</template>
