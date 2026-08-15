<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import {
  HomeIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  AcademicCapIcon,
  UserCircleIcon,
  ArrowLeftStartOnRectangleIcon,
  ShieldCheckIcon,
  BellIcon,
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeSolid,
  BookOpenIcon as BookSolid,
  ShoppingBagIcon as ShoppingSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  CalendarIcon as CalendarSolid,
  AcademicCapIcon as AcademicCapSolid,
  UserCircleIcon as UserSolid,
  ShieldCheckIcon as ShieldSolid,
  BellIcon as BellSolid,
} from '@heroicons/vue/24/solid'
import { useNotifications } from '@composables/useNotifications'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const { unreadCount } = useNotifications()

const items = computed(() => {
  const list = [
    { name: 'home', label: 'Inicio', to: '/', Icon: HomeIcon, Active: HomeSolid },
    { name: 'library', label: 'Biblioteca', to: '/biblioteca', Icon: BookOpenIcon, Active: BookSolid },
    { name: 'orders', label: 'Órdenes', to: '/ordenes', Icon: ShoppingBagIcon, Active: ShoppingSolid },
    { name: 'community', label: 'Comunidad', to: '/comunidad', Icon: ChatBubbleLeftRightIcon, Active: ChatSolid },
    { name: 'workshops', label: 'Workshops', to: '/workshops', Icon: AcademicCapIcon, Active: AcademicCapSolid },
    { name: 'planner', label: 'Planificador', to: '/planeador', Icon: CalendarIcon, Active: CalendarSolid },
    { name: 'notifications', label: 'Notificaciones', to: '/notificaciones', Icon: BellIcon, Active: BellSolid, badge: unreadCount.value },
    { name: 'profile', label: 'Mi Perfil', to: '/perfil', Icon: UserCircleIcon, Active: UserSolid },
  ]
  return list
})

const isAdmin = computed(() => auth.role === 'admin' || auth.role === 'super_admin')

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

async function handleLogout() {
  try {
    await auth.signOut()
    ui.pushToast({ title: 'Sesión cerrada', variant: 'info' })
    router.push('/auth/login')
  } catch (e) {
    ui.pushToast({ title: 'Error al cerrar sesión', description: (e as Error).message, variant: 'error' })
  }
}
</script>

<template>
  <aside class="w-64 h-screen bg-surface border-r border-divider flex flex-col justify-between fixed top-0 left-0 z-30">
    <div class="flex flex-col flex-1 min-h-0">
      <!-- Logo Brand -->
      <div class="h-16 px-6 flex items-center border-b border-divider shrink-0">
        <span class="font-editorial text-h3 font-black text-accent tracking-tight leading-none uppercase">
          ÍNTIMAS
        </span>
        <span class="text-[10px] uppercase font-bold tracking-widest text-text-secondary ml-1.5 pt-1">
          By Lorena
        </span>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        <RouterLink
          v-for="item in items"
          :key="item.name"
          :to="item.to"
          :class="[
            'flex items-center justify-between px-4 py-3 rounded-xl text-small font-bold transition-all duration-200',
            isActive(item.to)
              ? 'bg-accent/10 text-accent font-extrabold shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-light/60',
          ]"
        >
          <div class="flex items-center gap-3">
            <component :is="isActive(item.to) ? item.Active : item.Icon" class="w-5 h-5 shrink-0" />
            <span>{{ item.label }}</span>
          </div>
          <span
            v-if="item.badge > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error text-white min-w-[18px] text-center"
          >
            {{ item.badge }}
          </span>
        </RouterLink>

        <!-- Acceso rápido al panel administrativo para administradores -->
        <RouterLink
          v-if="isAdmin"
          to="/admin"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl text-small font-bold transition-all duration-200 border border-dashed border-success/30 mt-4',
            route.path.startsWith('/admin')
              ? 'bg-success/10 text-success font-extrabold'
              : 'text-success/90 hover:text-success hover:bg-success/5',
          ]"
        >
          <component :is="route.path.startsWith('/admin') ? ShieldSolid : ShieldCheckIcon" class="w-5 h-5 shrink-0" />
          <span>Panel Admin</span>
        </RouterLink>
      </nav>
    </div>

    <!-- User Profile & Log out Card -->
    <div class="p-4 border-t border-divider bg-light/30 shrink-0 space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-caption shrink-0">
          {{ auth.profile?.firstName?.[0]?.toUpperCase() || 'E' }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-caption font-bold text-text-primary truncate leading-tight">
            {{ auth.profile?.firstName }} {{ auth.profile?.lastName }}
          </p>
          <p class="text-[10px] text-text-secondary truncate uppercase font-semibold tracking-wider mt-0.5">
            {{ (auth.role === 'admin' || auth.role === 'super_admin') ? 'Administrador' : 'Embajadora' }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="w-full h-10 px-4 rounded-xl bg-error/10 text-error hover:bg-error hover:text-white text-caption font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        @click="handleLogout"
      >
        <ArrowLeftStartOnRectangleIcon class="w-5 h-5 shrink-0" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>
