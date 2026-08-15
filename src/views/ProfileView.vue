<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import { useCommissionStats } from '@modules/orders/composables/useOrders'
import {
  UserIcon,
  TrophyIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import dayjs from '@utils/dayjs'
import AppPageHeader from '@components/base/AppPageHeader.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const viewedUserId = computed(() => route.params.userId as string | undefined)
const isOwnProfile = computed(() => !viewedUserId.value || viewedUserId.value === auth.user?.id)
const profile = computed(() => (isOwnProfile.value ? auth.profile : viewedProfile.value))

const isAdminUser = computed(() => auth.role === 'admin' || auth.role === 'super_admin')

const { data: stats } = useCommissionStats()

const { data: viewedProfile } = useQuery({
  queryKey: ['profile', viewedUserId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, photo_url, city, bio, ambassador_code, role')
      .eq('user_id', viewedUserId.value!)
      .single()
    if (error) throw error
    return {
      photoUrl: data.photo_url,
      firstName: data.first_name,
      lastName: data.last_name,
      city: data.city,
      bio: data.bio,
      ambassadorCode: data.ambassador_code,
      role: data.role,
    }
  },
  enabled: !!viewedUserId.value && !isOwnProfile.value,
})

const { data: userPosts } = useQuery({
  queryKey: ['profile-posts', viewedUserId],
  queryFn: async () => {
    const userId = viewedUserId.value ?? auth.user?.id
    if (!userId) return []
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, likes_count, comments_count, created_at')
      .eq('author_id', userId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data ?? []
  },
  enabled: !!viewedUserId.value || !!auth.user?.id,
})

async function logout() {
  await auth.signOut()
  router.push('/auth/login')
}
</script>

<template>
  <template v-if="isOwnProfile">
    <AppPageHeader
      title="Perfil"
      description="Gestiona tu cuenta, tus accesos y preferencias de la plataforma."
    />

    <div class="space-y-5">
      <header class="flex flex-col items-center text-center pt-2 pb-4">
        <AppAvatar
          :src="profile?.photoUrl"
          :name="`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`"
          size="xl"
        />
        <h1 class="text-h3 font-semibold mt-3">
          {{ profile?.firstName }} {{ profile?.lastName }}
        </h1>
        <p class="text-small text-text-secondary font-medium">
          {{ isAdminUser ? 'Administradora de la Plataforma' : profile?.city ?? 'Embajadora' }}
        </p>

        <span
          v-if="isAdminUser"
          class="mt-2 inline-block px-3 py-1 rounded-full bg-accent/15 text-accent text-caption font-black uppercase tracking-wider border border-accent/20"
        >
          Administradora
        </span>
        <span
          v-else
          class="mt-2 inline-block px-3 py-1 rounded-full bg-accent-50 text-accent font-mono text-caption font-bold border border-accent/20"
        >
          Código: {{ auth.userProfile?.ambassador_code || `EMB-${(auth.user?.id || '').substring(0, 6).toUpperCase()}` }}
        </span>

        <p v-if="profile?.bio" class="text-small text-text-primary mt-2 max-w-md">{{ profile.bio }}</p>
      </header>

      <!-- SECCIÓN SOLO PARA EMBAJADORAS: COMISIONES RETENIDAS -->
      <div
        v-if="!isAdminUser"
        class="p-5 rounded-2xl bg-gradient-to-br from-blush/80 via-surface to-accent-50/50 border border-blush/60 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent">
              <CurrencyDollarIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-small font-bold text-text-primary">Comisiones Retenidas</h3>
              <p class="text-caption text-text-secondary">Corresponde a tus ventas aprobadas</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-accent text-white text-caption font-bold">
            {{ stats?.commissionRate ?? 25 }}% Comisión
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-1">
          <div class="p-3 rounded-xl bg-white/80 dark:bg-surface/80 border border-divider">
            <span class="text-caption text-text-secondary block">Comisión Retenida:</span>
            <span class="text-title font-extrabold text-accent">${{ (stats?.retainedCommission ?? 0).toFixed(2) }} USD</span>
          </div>
          <div class="p-3 rounded-xl bg-white/80 dark:bg-surface/80 border border-divider">
            <span class="text-caption text-text-secondary block">Ventas Aprobadas:</span>
            <span class="text-title font-bold text-text-primary">${{ (stats?.totalSales ?? 0).toFixed(2) }} USD</span>
          </div>
        </div>

        <RouterLink to="/ordenes" class="w-full py-2.5 px-4 rounded-xl bg-accent text-white font-semibold text-small flex items-center justify-center gap-2 shadow-sm hover:bg-accent-600 transition-colors">
          <ShoppingBagIcon class="w-4 h-4" />
          Ver Mis Pedidos & Crear Nuevo
        </RouterLink>
      </div>

      <!-- SECCIÓN DESTACADA PARA ADMINISTRADORES: ACCESO RÁPIDO DE CONTROL -->
      <div
        v-else
        class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blush/90 via-surface to-accent-50/40 border border-accent/20 shadow-elevation1 space-y-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xs shrink-0">
              <ShieldCheckIcon class="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 class="text-subtitle font-bold text-text-primary leading-tight">Panel de Administración</h3>
              <p class="text-caption text-text-secondary">Gestión de usuarias, pedidos y contenidos</p>
            </div>
          </div>

          <!-- BADGE DE SUPER ADMIN / ADMIN ELEGANTE -->
          <span class="whitespace-nowrap px-3 py-1 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-widest border border-primary-400 shadow-2xs shrink-0">
            {{ auth.role === 'super_admin' ? 'Super Admin' : 'Admin' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2.5 pt-1">
          <RouterLink
            to="/admin/usuarios"
            class="p-3 rounded-2xl bg-surface hover:bg-accent-50/60 border border-divider hover:border-accent/40 transition-all text-text-primary text-caption font-bold flex items-center gap-2.5 shadow-2xs group"
          >
            <div class="w-7 h-7 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              <UserIcon class="w-4 h-4" />
            </div>
            <span>Red & Usuarias</span>
          </RouterLink>

          <RouterLink
            to="/admin/ordenes"
            class="p-3 rounded-2xl bg-surface hover:bg-accent-50/60 border border-divider hover:border-accent/40 transition-all text-text-primary text-caption font-bold flex items-center gap-2.5 shadow-2xs group"
          >
            <div class="w-7 h-7 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              <ShoppingBagIcon class="w-4 h-4" />
            </div>
            <span>Órdenes & Pedidos</span>
          </RouterLink>

          <RouterLink
            to="/biblioteca"
            class="p-3 rounded-2xl bg-surface hover:bg-accent-50/60 border border-divider hover:border-accent/40 transition-all text-text-primary text-caption font-bold flex items-center gap-2.5 shadow-2xs group"
          >
            <div class="w-7 h-7 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              <SparklesIcon class="w-4 h-4" />
            </div>
            <span>Biblioteca & Catálogos</span>
          </RouterLink>

          <RouterLink
            to="/admin/workshops"
            class="p-3 rounded-2xl bg-surface hover:bg-accent-50/60 border border-divider hover:border-accent/40 transition-all text-text-primary text-caption font-bold flex items-center gap-2.5 shadow-2xs group"
          >
            <div class="w-7 h-7 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              <TrophyIcon class="w-4 h-4" />
            </div>
            <span>Workshops</span>
          </RouterLink>
        </div>

        <!-- BOTÓN PRINCIPAL IR AL PANEL DE CONTROL -->
        <RouterLink
          to="/admin"
          class="w-full py-3 px-5 rounded-pill bg-primary text-white font-bold text-small flex items-center justify-center gap-2 shadow-md hover:bg-primary-400 active:scale-98 transition-all border border-primary-400"
        >
          <ShieldCheckIcon class="w-4 h-4 text-secondary" />
          <span>Ir al Panel General de Control</span>
        </RouterLink>
      </div>


      <nav class="rounded-2xl bg-surface shadow-elevation1 divide-y divide-divider overflow-hidden border border-divider">
        <RouterLink v-if="!isAdminUser" to="/ordenes" class="flex items-center gap-3 p-4 hover:bg-background transition-colors">
          <ShoppingBagIcon class="w-5 h-5 text-accent" />
          <span class="flex-1 text-small font-medium">Mis Pedidos y Órdenes</span>
        </RouterLink>
        <RouterLink v-if="isAdminUser" to="/admin" class="flex items-center gap-3 p-4 hover:bg-background transition-colors">
          <ShieldCheckIcon class="w-5 h-5 text-accent" />
          <span class="flex-1 text-small text-accent font-bold">Panel administrativo de control</span>
        </RouterLink>
        <RouterLink to="/perfil/editar" class="flex items-center gap-3 p-4 hover:bg-background transition-colors">
          <UserIcon class="w-5 h-5 text-text-secondary" />
          <span class="flex-1 text-small font-medium">Editar perfil</span>
        </RouterLink>
        <RouterLink to="/perfil/logros" class="flex items-center gap-3 p-4 hover:bg-background transition-colors">
          <TrophyIcon class="w-5 h-5 text-text-secondary" />
          <span class="flex-1 text-small font-medium">Mis logros</span>
        </RouterLink>
        <RouterLink to="/perfil/configuracion" class="flex items-center gap-3 p-4 hover:bg-background transition-colors">
          <Cog6ToothIcon class="w-5 h-5 text-text-secondary" />
          <span class="flex-1 text-small font-medium">Configuración</span>
        </RouterLink>
        <RouterLink to="/perfil/seguridad" class="flex items-center gap-3 p-4 hover:bg-background transition-colors">
          <ShieldCheckIcon class="w-5 h-5 text-text-secondary" />
          <span class="flex-1 text-small font-medium">Seguridad</span>
        </RouterLink>
        <button
          class="w-full flex items-center gap-3 p-4 hover:bg-error/5 transition-colors text-error"
          @click="logout"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          <span class="flex-1 text-left text-small font-semibold">Cerrar sesión</span>
        </button>
      </nav>

      <p class="text-center text-caption text-text-secondary pt-2">Intimas App · v0.1.0</p>
    </div>
  </template>

  <template v-else>
    <header class="flex items-center gap-3 p-3 border-b border-divider">
      <button class="w-10 h-10 rounded-pill flex items-center justify-center hover:bg-surface" aria-label="Volver" @click="router.back()">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <h1 class="text-title font-semibold">Perfil</h1>
    </header>

    <div class="p-5 space-y-5">
      <header class="flex flex-col items-center text-center pt-2 pb-4">
        <AppAvatar
          :src="profile?.photoUrl"
          :name="`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`"
          size="xl"
        />
        <h1 class="text-h3 font-semibold mt-3">
          {{ profile?.firstName }} {{ profile?.lastName }}
        </h1>
        <p class="text-small text-text-secondary font-medium">
          {{ profile?.role === 'admin' || profile?.role === 'super_admin' ? 'Administradora de la Plataforma' : profile?.city ?? 'Embajadora' }}
        </p>

        <span
          v-if="profile?.role === 'admin' || profile?.role === 'super_admin'"
          class="mt-2 inline-block px-3 py-1 rounded-full bg-accent/15 text-accent text-caption font-black uppercase tracking-wider border border-accent/20"
        >
          Administradora
        </span>
        <span
          v-else-if="profile?.ambassadorCode"
          class="mt-2 inline-block px-3 py-1 rounded-full bg-accent-50 text-accent font-mono text-caption font-bold border border-accent/20"
        >
          Código: {{ profile.ambassadorCode }}
        </span>

        <p v-if="profile?.bio" class="text-small text-text-primary mt-2 max-w-md">{{ profile.bio }}</p>
      </header>

      <div class="space-y-3">
        <h2 class="text-title font-semibold text-text-primary">Publicaciones</h2>
        <div v-if="!userPosts || userPosts.length === 0" class="text-center text-small text-text-secondary py-8">
          Aún no ha publicado nada.
        </div>
        <article v-for="post in userPosts" :key="post.id" class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1">
          <p class="text-body text-text-primary whitespace-pre-wrap">{{ post.content }}</p>
          <div class="flex items-center gap-4 mt-3 text-caption text-text-secondary">
            <span class="inline-flex items-center gap-1">
              <HeartIcon class="w-4 h-4" /> {{ post.likes_count }}
            </span>
            <span class="inline-flex items-center gap-1">
              <ChatBubbleLeftIcon class="w-4 h-4" /> {{ post.comments_count }}
            </span>
            <span class="ml-auto">{{ dayjs(post.created_at).fromNow() }}</span>
          </div>
        </article>
      </div>
    </div>
  </template>
</template>
