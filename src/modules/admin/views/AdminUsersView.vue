<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  PhoneIcon,
  MapPinIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  SparklesIcon,
  ChevronDownIcon,
  CheckIcon,
  UserPlusIcon,
  EnvelopeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  KeyIcon,
  ChartBarIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'
import { onMounted, onUnmounted } from 'vue'
import dayjs from '@utils/dayjs'
import AppTopBar from '@components/base/AppTopBar.vue'
import AppAvatar from '@components/base/AppAvatar.vue'
import AppButton from '@components/base/AppButton.vue'
import AppSkeleton from '@components/base/AppSkeleton.vue'
import AppModal from '@components/base/AppModal.vue'
import CreateAmbassadorModal from '../components/CreateAmbassadorModal.vue'
import EditAmbassadorModal from '../components/EditAmbassadorModal.vue'
import AmbassadorEmailModal from '../components/AmbassadorEmailModal.vue'
import { adminUsersService, generateRandomPassword, type AmbassadorCredentialsInfo } from '../services/admin-users.service'

const ui = useUiStore()
const qc = useQueryClient()
const search = ref('')
const roleFilter = ref<string>('all')
const openRoleDropdownId = ref<string | null>(null)
const openMenuUserId = ref<string | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const userToEdit = ref<any | null>(null)

const showEmailModal = ref(false)
const activeCredentials = ref<AmbassadorCredentialsInfo | null>(null)
const activeEmailTemplateType = ref<'welcome' | 'password_reminder'>('welcome')

const showDeleteModal = ref(false)
const userToDelete = ref<any | null>(null)

function closeDropdowns() {
  openRoleDropdownId.value = null
  openMenuUserId.value = null
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdowns)
})

const { data: users, isLoading } = useQuery({
  queryKey: ['admin', 'users'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
})

function handleAmbassadorCreated(credentials: AmbassadorCredentialsInfo) {
  qc.invalidateQueries({ queryKey: ['admin', 'users'] })
  activeCredentials.value = credentials
  activeEmailTemplateType.value = 'welcome'
  showEmailModal.value = true
}

function openEditUser(u: any) {
  userToEdit.value = u
  showEditModal.value = true
  openMenuUserId.value = null
}

function openEmailTemplateForUser(u: any, type: 'welcome' | 'password_reminder' = 'welcome') {
  openMenuUserId.value = null
  activeEmailTemplateType.value = type
  activeCredentials.value = {
    firstName: u.first_name || 'Embajadora',
    lastName: u.last_name || '',
    email: u.email || `${(u.first_name || 'embajadora').toLowerCase().replace(/\s+/g, '')}@intimas.com`,
    password: generateRandomPassword(),
    ambassadorCode: u.ambassador_code || 'INT-REG',
    loginUrl: `${window.location.origin}/auth/login`,
  }
  showEmailModal.value = true
}

function confirmDelete(u: any) {
  openMenuUserId.value = null
  if (u.role === 'admin' || u.role === 'super_admin') {
    ui.pushToast({
      title: 'Acción no permitida',
      description: 'No se puede eliminar a un usuario administrador.',
      variant: 'error',
    })
    return
  }
  userToDelete.value = u
  showDeleteModal.value = true
}

const deleteUserMutation = useMutation({
  mutationFn: async (profileId: string) => {
    await adminUsersService.deleteUser(profileId)
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    ui.pushToast({ title: 'Usuaria eliminada correctamente', variant: 'success' })
    showDeleteModal.value = false
    userToDelete.value = null
  },
  onError: (err: any) => {
    ui.pushToast({ title: 'Error al eliminar usuaria', description: err.message, variant: 'error' })
  },
})

const updateUser = useMutation({
  mutationFn: async ({ id, role }: { id: string; role: 'ambassador' | 'moderator' | 'admin' | 'super_admin' }) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    ui.pushToast({ title: 'Rol de usuario actualizado', variant: 'success' })
  },
  onError: (err: any) => {
    ui.pushToast({ title: 'Error al cambiar rol', description: err.message, variant: 'error' })
  },
})

function handleSuspend(u: any) {
  openMenuUserId.value = null
  if (u.role === 'admin' || u.role === 'super_admin') {
    ui.pushToast({
      title: 'Acción no permitida',
      description: 'No se puede suspender a usuarios administradores.',
      variant: 'error',
    })
    return
  }
  toggleSuspend.mutate({ id: u.id, suspended: !u.is_suspended })
}

const toggleSuspend = useMutation({
  mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
    const { error } = await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    ui.pushToast({ title: 'Estado del usuario actualizado', variant: 'success' })
  },
  onError: (err: any) => {
    ui.pushToast({ title: 'Error al cambiar estado', description: err.message, variant: 'error' })
  },
})

const filtered = computed(() => {
  if (!users.value) return []
  return users.value.filter((u) => {
    let matchesRole = roleFilter.value === 'all'
    if (roleFilter.value === 'ambassador') matchesRole = u.role === 'ambassador'
    if (roleFilter.value === 'admin') matchesRole = u.role === 'admin' || u.role === 'super_admin'
    if (roleFilter.value === 'moderator') matchesRole = u.role === 'moderator'
    const s = search.value.toLowerCase().trim()
    const matchesQuery = !s || `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''} ${u.city || ''} ${u.phone || ''} ${u.ambassador_code || ''}`.toLowerCase().includes(s)
    return matchesRole && matchesQuery
  })
})

const roleBadges: Record<string, { label: string; class: string }> = {
  ambassador: { label: 'Embajadora', class: 'bg-accent-50 text-accent border-accent/20' },
  moderator: { label: 'Moderadora', class: 'bg-warning/15 text-warning border-warning/30' },
  admin: { label: 'Administrador', class: 'bg-mint text-success border-success/30' },
  super_admin: { label: 'Super Admin', class: 'bg-blush text-accent-500 border-accent/30 font-bold' },
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <AppTopBar title="Gestión de Usuarios & Embajadoras" :back="true" />

    <!-- ENCABEZADO EDITORIAL -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-b border-divider pb-4">
      <div>
        <h1 class="text-display font-editorial text-text-primary leading-none mb-1">
          Red de Embajadoras & Usuarios
        </h1>
        <p class="text-small text-text-secondary">
          Administra roles, accesos y estado de la comunidad Intimas por Lorena.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <span class="px-3 py-1 rounded-full bg-accent-50 text-accent font-bold text-caption border border-accent/20">
          {{ users?.length ?? 0 }} Usuarias Registradas
        </span>

        <!-- BOTÓN PRINCIPAL REGISTRAR EMBAJADORA -->
        <AppButton
          variant="primary"
          size="sm"
          class="shadow-xs active:scale-95 transition-transform"
          @click="showCreateModal = true"
        >
          <UserPlusIcon class="w-4 h-4 mr-1.5" />
          Registrar Embajadora
        </AppButton>
      </div>
    </header>

    <!-- BARRA DE BÚSQUEDA Y FILTROS -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Input de Búsqueda con Icono -->
      <div class="relative flex-1">
        <MagnifyingGlassIcon class="w-5 h-5 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, email, ciudad, WhatsApp o código..."
          class="w-full h-11 pl-10 pr-4 rounded-pill bg-surface border border-divider text-small focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-2xs"
        />
      </div>

      <!-- Filtro por Rol -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="r in [
            { key: 'all', label: 'Todos' },
            { key: 'ambassador', label: 'Embajadoras' },
            { key: 'admin', label: 'Administradores' },
            { key: 'moderator', label: 'Moderadoras' },
          ]"
          :key="r.key"
          type="button"
          class="px-3.5 py-1.5 rounded-pill text-caption font-bold transition-all border shrink-0 active:scale-95"
          :class="roleFilter === r.key ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:border-accent/40 hover:text-text-primary'"
          @click="roleFilter = r.key"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <!-- LISTA Y TABLA DE USUARIOS -->
    <div v-if="isLoading" class="space-y-3">
      <AppSkeleton v-for="i in 5" :key="i" height="72px" />
    </div>

    <div v-else-if="filtered.length === 0" class="p-8 rounded-2xl bg-surface border border-divider text-center text-text-secondary shadow-elevation1">
      No se encontraron usuarios con el criterio de búsqueda.
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="u in filtered"
        :key="u.id"
        class="p-6 rounded-3xl bg-surface border border-divider/70 shadow-elevation1 hover:shadow-elevation2 transition-all space-y-5"
      >
        <!-- SECCIÓN SUPERIOR: Avatar + Nombre + Badges + Datos de Contacto Verticales -->
        <div class="flex items-start gap-4 sm:gap-5">
          <!-- Avatar con halo rosa -->
          <RouterLink
            :to="`/admin/usuarios/${u.id}`"
            class="shrink-0 group cursor-pointer"
          >
            <div class="p-1 rounded-full bg-accent-50/60 border border-accent/20">
              <AppAvatar
                :src="u.photo_url"
                :name="`${u.first_name || ''} ${u.last_name || ''}` || 'Usuario'"
                size="lg"
                class="shrink-0 group-hover:scale-105 transition-transform"
              />
            </div>
          </RouterLink>

          <div class="space-y-2 min-w-0 flex-1">
            <!-- Fila 1: Nombre + Pill de Rol con Maletín -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <RouterLink
                :to="`/admin/usuarios/${u.id}`"
                class="font-bold text-text-primary text-h3 tracking-tight truncate hover:text-accent transition-colors"
              >
                {{ u.first_name }} {{ u.last_name }}
              </RouterLink>

              <span class="px-3 py-1 rounded-full text-caption font-bold bg-accent-50 text-accent border border-accent/20 flex items-center gap-1.5 shrink-0">
                <BriefcaseIcon class="w-4 h-4 text-accent shrink-0" />
                {{ roleBadges[u.role]?.label || u.role }}
              </span>

              <span v-if="u.is_suspended" class="px-2.5 py-0.5 rounded-full bg-error/15 text-error text-caption font-bold flex items-center gap-1 border border-error/30 shrink-0">
                <NoSymbolIcon class="w-3.5 h-3.5" /> Suspendida
              </span>
            </div>

            <!-- Fila 2: Código de Embajadora -->
            <div v-if="u.ambassador_code">
              <span class="font-mono text-caption font-extrabold bg-accent-50/60 text-accent px-3 py-1 rounded-full border border-accent/20 inline-block">
                Cód: {{ u.ambassador_code }}
              </span>
            </div>

            <!-- Fila 3, 4, 5: Contacto en lista vertical (Email, Teléfono, Ciudad) -->
            <div class="space-y-1.5 pt-1 text-small font-medium text-text-primary">
              <div v-if="u.email" class="flex items-center gap-2.5">
                <EnvelopeIcon class="w-4 h-4 text-accent shrink-0" />
                <span class="truncate">{{ u.email }}</span>
              </div>

              <div v-if="u.phone" class="flex items-center gap-2.5">
                <PhoneIcon class="w-4 h-4 text-success shrink-0" />
                <span>{{ u.phone }}</span>
              </div>

              <div v-if="u.city" class="flex items-center gap-2.5">
                <MapPinIcon class="w-4 h-4 text-text-secondary shrink-0" />
                <span>{{ u.city }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN MEDIA: 2 TARJETAS COLOREADAS (Verde: Última actividad | Rosa: Plataforma) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <!-- Tarjeta Verde: Última Actividad -->
          <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-center space-y-1">
            <div class="flex items-center gap-2 text-caption text-text-secondary font-semibold">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="u.last_seen_at ? 'bg-success' : 'bg-text-secondary/40'"></span>
              <span>Última actividad</span>
            </div>
            <div class="flex items-center gap-2 font-extrabold text-text-primary text-small pl-4">
              <CalendarDaysIcon class="w-4 h-4 text-success shrink-0" />
              <span>{{ u.last_seen_at ? dayjs(u.last_seen_at).format('D MMM YYYY, h:mm A') : 'Sin registro' }}</span>
            </div>
          </div>

          <!-- Tarjeta Rosa: Plataforma -->
          <div class="p-3.5 rounded-2xl bg-accent-50/50 border border-accent/15 flex items-center gap-3">
            <GlobeAltIcon class="w-6 h-6 text-accent shrink-0" />
            <div>
              <span class="text-caption text-text-secondary font-semibold block">Plataforma</span>
              <span class="font-extrabold text-accent text-small block">
                {{ u.device_platform === 'android' ? 'Android App' : u.device_platform === 'ios' ? 'iOS App' : 'Web Browser' }}
              </span>
            </div>
          </div>
        </div>

        <!-- SECCIÓN INFERIOR: Barra de Acciones (Boton Clave, Dropdown Rol, Opciones 3 puntos) -->
        <div class="pt-3 border-t border-divider/60 flex items-center gap-2.5">
          <!-- Botón Link / Enviar Pass -->
          <button
            type="button"
            class="w-11 h-11 rounded-2xl border border-divider bg-surface text-accent hover:bg-background flex items-center justify-center shadow-2xs transition-all active:scale-95 shrink-0"
            title="Enviar o revisar contraseña"
            @click="openEmailTemplateForUser(u, 'password_reminder')"
          >
            <KeyIcon class="w-5 h-5 text-accent" />
          </button>

          <!-- Dropdown Selector de Rol (Pastilla grande con icono) -->
          <div class="relative flex-1 sm:flex-none">
            <button
              type="button"
              class="w-full sm:w-auto h-11 px-4 rounded-2xl border bg-surface text-text-primary font-bold text-small hover:border-accent/40 flex items-center justify-between gap-2.5 shadow-2xs transition-all active:scale-95"
              :class="openRoleDropdownId === u.id ? 'border-accent ring-2 ring-accent/20' : 'border-divider'"
              @click.stop="openRoleDropdownId = openRoleDropdownId === u.id ? null : u.id"
            >
              <div class="flex items-center gap-2">
                <BriefcaseIcon class="w-4 h-4 text-accent shrink-0" />
                <span>{{ roleBadges[u.role]?.label || u.role }}</span>
              </div>
              <ChevronDownIcon class="w-4 h-4 text-text-secondary transition-transform" :class="openRoleDropdownId === u.id ? 'rotate-180 text-accent' : ''" />
            </button>

            <!-- Menú Rol -->
            <div
              v-if="openRoleDropdownId === u.id"
              class="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-48 bg-surface border border-divider rounded-2xl shadow-elevation3 p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150"
              @click.stop
            >
              <button
                v-for="roleOpt in [
                  { value: 'ambassador', label: 'Embajadora' },
                  { value: 'moderator', label: 'Moderadora' },
                  { value: 'admin', label: 'Administrador' },
                  { value: 'super_admin', label: 'Super Admin' },
                ]"
                :key="roleOpt.value"
                type="button"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-bold flex items-center justify-between transition-colors hover:bg-background"
                :class="u.role === roleOpt.value ? 'bg-accent/10 text-accent font-extrabold' : 'text-text-primary'"
                @click="
                  updateUser.mutate({ id: u.id, role: roleOpt.value as any });
                  openRoleDropdownId = null;
                "
              >
                <span class="truncate">{{ roleOpt.label }}</span>
                <CheckIcon v-if="u.role === roleOpt.value" class="w-4 h-4 text-accent shrink-0 ml-2" />
              </button>
            </div>
          </div>

          <!-- MENÚ DE 3 PUNTOS (...) -->
          <div class="relative">
            <button
              type="button"
              class="w-11 h-11 rounded-2xl flex items-center justify-center border border-divider bg-surface text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors shadow-2xs active:scale-95 shrink-0"
              :class="openMenuUserId === u.id ? 'border-accent ring-2 ring-accent/20 text-accent' : ''"
              title="Opciones de usuaria"
              @click.stop="openMenuUserId = openMenuUserId === u.id ? null : u.id"
            >
              <EllipsisVerticalIcon class="w-5 h-5" />
            </button>

            <!-- Menú Desplegable de Opciones (...) -->
            <div
              v-if="openMenuUserId === u.id"
              class="absolute right-0 top-full mt-1.5 w-60 bg-surface border border-divider rounded-2xl shadow-elevation3 p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150"
              @click.stop
            >
              <!-- Ver Historial & Desempeño -->
              <RouterLink
                :to="`/admin/usuarios/${u.id}`"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-bold text-accent hover:bg-accent-50/50 flex items-center gap-2 transition-colors"
                @click="openMenuUserId = null"
              >
                <ChartBarIcon class="w-4 h-4 text-accent" />
                <span>Ver Historial & Desempeño</span>
              </RouterLink>

              <div class="border-t border-divider my-1"></div>

              <!-- Enviar Recordatorio de Pass -->
              <button
                type="button"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-semibold text-text-primary hover:bg-background flex items-center gap-2 transition-colors"
                @click="
                  openEmailTemplateForUser(u, 'password_reminder');
                  openMenuUserId = null;
                "
              >
                <KeyIcon class="w-4 h-4 text-accent" />
                <span>Enviar Recordatorio de Pass</span>
              </button>

              <!-- Enviar Bienvenida -->
              <button
                type="button"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-semibold text-text-primary hover:bg-background flex items-center gap-2 transition-colors"
                @click="
                  openEmailTemplateForUser(u, 'welcome');
                  openMenuUserId = null;
                "
              >
                <EnvelopeIcon class="w-4 h-4 text-accent" />
                <span>Enviar Bienvenida</span>
              </button>

              <div class="border-t border-divider my-1"></div>

              <!-- Editar Perfil -->
              <button
                type="button"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-semibold text-text-primary hover:bg-background flex items-center gap-2 transition-colors"
                @click="
                  openEditUser(u);
                  openMenuUserId = null;
                "
              >
                <PencilSquareIcon class="w-4 h-4 text-accent" />
                <span>Editar Detalles del Perfil</span>
              </button>

              <!-- Suspender / Reactivar -->
              <button
                v-if="u.role !== 'admin' && u.role !== 'super_admin'"
                type="button"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-semibold flex items-center gap-2 transition-colors"
                :class="u.is_suspended ? 'text-success hover:bg-mint/20' : 'text-warning hover:bg-warning/10'"
                @click="
                  handleSuspend(u);
                  openMenuUserId = null;
                "
              >
                <component :is="u.is_suspended ? CheckCircleIcon : NoSymbolIcon" class="w-4 h-4" />
                <span>{{ u.is_suspended ? 'Reactivar Usuaria' : 'Suspender Acceso' }}</span>
              </button>

              <div class="border-t border-divider my-1"></div>

              <!-- Eliminar Usuaria -->
              <button
                v-if="u.role !== 'admin' && u.role !== 'super_admin'"
                type="button"
                class="w-full text-left px-3 py-2 rounded-xl text-caption font-bold text-error hover:bg-error/10 flex items-center gap-2 transition-colors"
                @click="
                  confirmDelete(u);
                  openMenuUserId = null;
                "
              >
                <TrashIcon class="w-4 h-4 text-error" />
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- MODAL REGISTRO DE EMBAJADORA -->
    <CreateAmbassadorModal
      v-model="showCreateModal"
      @created="handleAmbassadorCreated"
    />

    <!-- MODAL EDITAR EMBAJADORA -->
    <EditAmbassadorModal
      v-model="showEditModal"
      :user="userToEdit"
      @updated="qc.invalidateQueries({ queryKey: ['admin', 'users'] })"
    />

    <!-- MODAL PLANTILLA DE EMAIL -->
    <AmbassadorEmailModal
      v-model="showEmailModal"
      :credentials="activeCredentials"
      :template-type="activeEmailTemplateType"
    />

    <!-- DIÁLOGO DE CONFIRMACIÓN DE BORRADO -->
    <AppModal
      v-model="showDeleteModal"
      title="¿Eliminar usuaria?"
      description="Esta acción eliminará el perfil de la plataforma."
      size="sm"
    >
      <div v-if="userToDelete" class="space-y-4 pt-2">
        <div class="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3">
          <ExclamationTriangleIcon class="w-6 h-6 text-error shrink-0 mt-0.5" />
          <div class="text-small text-text-primary">
            <p class="font-bold mb-1">Confirmar eliminación permanentemente</p>
            <p class="text-caption text-text-secondary">
              ¿Estás segura de que deseas borrar a <strong>{{ userToDelete.first_name }} {{ userToDelete.last_name }}</strong>? Se perderá el acceso de esta embajadora a la plataforma.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-divider">
          <AppButton variant="outline" size="sm" @click="showDeleteModal = false">
            Cancelar
          </AppButton>

          <AppButton
            variant="primary"
            size="sm"
            class="!bg-error hover:!bg-error/90 !text-white border-none"
            :loading="deleteUserMutation.isPending.value"
            @click="deleteUserMutation.mutate(userToDelete.id)"
          >
            Eliminar Definitivamente
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
