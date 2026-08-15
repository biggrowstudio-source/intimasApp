<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  BookOpenIcon,
  CalendarDaysIcon,
  UsersIcon,
  AcademicCapIcon,
  TrophyIcon,
} from '@heroicons/vue/24/outline'

interface Action {
  to: string
  label: string
  icon: typeof BookOpenIcon
  bgClass: string
}

const actions: Action[] = [
  { to: '/biblioteca', label: 'Biblioteca', icon: BookOpenIcon, bgClass: 'bg-peach-pastel' },
  { to: '/planeador', label: 'Planeador', icon: CalendarDaysIcon, bgClass: 'bg-sage' },
  { to: '/comunidad', label: 'Comunidad', icon: UsersIcon, bgClass: 'bg-rose-pastel' },
  { to: '/workshops', label: 'Workshops', icon: AcademicCapIcon, bgClass: 'bg-blush' },
  { to: '/reconocimientos', label: 'Mis logros', icon: TrophyIcon, bgClass: 'bg-mint' },
]
</script>

<template>
  <section>
    <header class="flex items-center justify-between mb-4 px-1">
      <h2 class="text-title font-semibold text-text-primary">Accesos rápidos</h2>
      <RouterLink to="/biblioteca" class="text-small text-accent font-medium hover:underline">
        Ver todos
      </RouterLink>
    </header>

    <div class="grid grid-cols-5 gap-2 tablet:gap-3">
      <RouterLink
        v-for="action in actions"
        :key="action.to"
        :to="action.to"
        class="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
      >
        <span
          :class="[
            'w-14 h-14 tablet:w-16 tablet:h-16 rounded-2xl flex items-center justify-center transition-transform duration-base group-hover:scale-105 group-active:scale-95',
            action.bgClass,
          ]"
        >
          <component :is="action.icon" class="w-6 h-6 tablet:w-7 tablet:h-7 text-text-primary" />
        </span>
        <span class="text-caption font-medium text-text-primary text-center leading-tight">
          {{ action.label }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>
