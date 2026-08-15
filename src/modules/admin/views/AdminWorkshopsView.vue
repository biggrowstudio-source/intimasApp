<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'
import dayjs from '@utils/dayjs'
import AppSelect from '@components/base/AppSelect.vue'
import WorkshopDetailModal from '@modules/workshops/components/WorkshopDetailModal.vue'
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  NoSymbolIcon,
  TagIcon,
  ChevronLeftIcon,
  PencilIcon,
  LinkIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'


const ui = useUiStore()
const qc = useQueryClient()

const activeAttendanceWorkshop = ref<any | null>(null)
const attendanceTab = ref<'current' | 'history'>('current')
const selectedDetailId = ref<string | null>(null)
const showDetailModal = ref(false)

function openDetailModal(workshopId: string) {
  selectedDetailId.value = workshopId
  showDetailModal.value = true
}

const openAttendance = (w: any) => {
  activeAttendanceWorkshop.value = w
  attendanceTab.value = 'current'
}

const closeAttendance = () => {
  activeAttendanceWorkshop.value = null
}

const { data: workshops, isLoading } = useQuery({
  queryKey: ['admin', 'workshops'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('workshops')
      .select(`
        *,
        workshop_registrations (
          id,
          status,
          user_id,
          reason
        )
      `)
      .order('date', { ascending: true })
    if (error) throw error
    return data ?? []
  },
})

const { data: ambassadors } = useQuery({
  queryKey: ['admin', 'ambassadors-list'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, photo_url')
      .eq('role', 'ambassador')
    if (error) throw error
    return data ?? []
  },
})

const showCreate = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ title: '', description: '', category: '', date: '', location: '', capacity: 20, status: 'available' })

const openCreate = () => {
  editingId.value = null
  form.value = { title: '', description: '', category: '', date: '', location: '', capacity: 20, status: 'available' }
  showCreate.value = true
}

const editWorkshop = (w: any) => {
  editingId.value = w.id
  const formattedDate = w.date ? dayjs(w.date).format('YYYY-MM-DDTHH:mm') : ''
  form.value = {
    title: w.title,
    description: w.description || '',
    category: w.category || '',
    date: formattedDate,
    location: w.location || '',
    capacity: w.capacity || 20,
    status: w.status || 'available'
  }
  showCreate.value = true
}

const save = useMutation({
  mutationFn: async () => {
    if (editingId.value) {
      // Editar
      const { error } = await supabase
        .from('workshops')
        .update({
          title: form.value.title,
          description: form.value.description || null,
          category: form.value.category || null,
          date: new Date(form.value.date).toISOString(),
          location: form.value.location || null,
          capacity: form.value.capacity,
          status: form.value.status,
        })
        .eq('id', editingId.value)
      if (error) throw error
    } else {
      // Crear
      const { data: newWorkshop, error } = await supabase
        .from('workshops')
        .insert({
          title: form.value.title,
          description: form.value.description || null,
          category: form.value.category || null,
          date: new Date(form.value.date).toISOString(),
          location: form.value.location || null,
          capacity: form.value.capacity,
          status: 'available',
        })
        .select('id, title')
        .single()
      
      if (error) throw error

      if (newWorkshop) {
        try {
          // Obtener todos los perfiles no administradores para notificarles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .neq('role', 'admin')
          
          if (profiles && profiles.length > 0) {
            const notifs = profiles.map((p) => ({
              user_id: p.user_id,
              type: 'workshop',
              title: 'Nuevo Workshop Disponible',
              body: `Se ha publicado el taller: "${newWorkshop.title}". ¡Inscríbete ya!`,
              data: { workshopId: newWorkshop.id },
            }))
            await supabase.from('notifications').insert(notifs)
          }
        } catch (err) {
          console.error('Error al notificar nuevo workshop:', err)
        }
      }
    }
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'workshops'] })
    ui.pushToast({ 
      title: editingId.value ? 'Workshop actualizado con éxito' : 'Workshop creado con éxito', 
      variant: 'success' 
    })
    showCreate.value = false
    editingId.value = null
    form.value = { title: '', description: '', category: '', date: '', location: '', capacity: 20, status: 'available' }
  },
})

const cancel = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('workshops').update({ status: 'cancelled' }).eq('id', id)
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'workshops'] })
    ui.pushToast({ title: 'Workshop cancelado', variant: 'info' })
  },
})

const getWorkshopStatus = (w: any) => {
  if (w.status === 'cancelled') return 'cancelled'
  const wsDate = new Date(w.date)
  const now = new Date()
  if (now.getTime() > wsDate.getTime() + 2 * 60 * 60 * 1000) {
    return 'finished'
  }
  return w.status || 'available'
}

const getRemainingTimeText = (dateStr: string, status: string) => {
  if (status === 'cancelled') return 'Cancelado'
  
  const wsDate = new Date(dateStr)
  const now = new Date()
  
  const diffTime = wsDate.getTime() - now.getTime()
  
  if (diffTime < 0) {
    const twoHoursAfter = wsDate.getTime() + 2 * 60 * 60 * 1000
    if (now.getTime() <= twoHoursAfter) {
      return 'En Vivo / Ahora'
    }
    return 'Caducó'
  }
  
  // Calculate difference in full calendar days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (wsDate.toDateString() === now.toDateString()) {
    return 'Hoy más tarde'
  }
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (wsDate.toDateString() === tomorrow.toDateString()) {
    return 'Mañana'
  }
  
  return `Faltan ${diffDays} días`
}

const getAttending = (w: any) => {
  return w.workshop_registrations?.filter((r: any) => r.status === 'registered') ?? []
}

const getRejected = (w: any) => {
  return w.workshop_registrations?.filter((r: any) => r.status === 'cancelled') ?? []
}

const getPending = (w: any) => {
  if (!ambassadors.value) return []
  const registeredUserIds = new Set(w.workshop_registrations?.map((r: any) => r.user_id) ?? [])
  return ambassadors.value.filter((amb: any) => !registeredUserIds.has(amb.user_id))
}

const formatExternalUrl = (url: string | null | undefined): string => {
  if (!url) return '#'
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const getUserProfile = (userId: string) => {
  return ambassadors.value?.find((a: any) => a.user_id === userId) || null
}

const { data: allInteractionLogs } = useQuery({
  queryKey: ['admin', 'workshop-logs'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, created_at, title, body, data, user_id')
      .eq('type', 'workshop')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
})

const activeWorkshopLogs = computed(() => {
  if (!activeAttendanceWorkshop.value || !allInteractionLogs.value) return []
  return allInteractionLogs.value.filter((log: any) => {
    const logData = log.data as any
    return logData && logData.workshop_id === activeAttendanceWorkshop.value.id
  })
})
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- CABECERA DE LA PÁGINA (ESTILO EDITORIAL PREMIUM) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <RouterLink
            to="/admin"
            class="p-2 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors active:scale-95"
          >
            <ChevronLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-title sm:text-h2 font-editorial font-extrabold text-text-primary tracking-tight">
            Gestión de Workshops
          </h1>
        </div>
        <p class="text-caption text-text-secondary pl-9">
          Publica, edita, cancela y administra las aulas y capacitaciones para tu red de embajadoras.
        </p>
      </div>

      <button
        type="button"
        class="px-5 py-2.5 rounded-pill bg-primary text-white hover:bg-primary-900 font-bold text-caption flex items-center gap-2 transition-all shadow-md active:scale-95 pl-4 ml-9 sm:ml-0"
        @click="openCreate()"
      >
        <PlusIcon class="w-4 h-4" />
        <span>Nuevo Workshop</span>
      </button>
    </div>

    <!-- CONTENEDOR PRINCIPAL / GRID DE TARJETAS -->
    <div class="space-y-4">
      <div v-if="isLoading" class="flex flex-col items-center justify-center p-12 space-y-3">
        <div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span class="text-caption text-text-secondary font-medium">Cargando talleres activos...</span>
      </div>

      <div v-else-if="!workshops || workshops.length === 0">
        <AppEmptyState title="No hay talleres creados todavía" icon-name="calendar" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="w in workshops"
          :key="w.id"
          class="rounded-2xl bg-surface border shadow-elevation1 hover:shadow-elevation2 transition-all flex flex-col sm:flex-row overflow-hidden group border-divider relative"
          :class="w.status === 'cancelled' ? 'opacity-75 bg-background/50 animate-[pulse_3s_infinite]' : ''"
        >
          <!-- Columna de Fecha en la Izquierda (Left Date Badge Homogéneo) -->
          <div
            class="flex sm:flex-col items-center justify-center gap-2 sm:gap-1 px-4 py-3 sm:py-5 min-w-[76px] sm:min-w-[84px] shrink-0 transition-colors bg-blush text-accent border-b sm:border-b-0 sm:border-r border-accent/15"
          >
            <span class="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none">
              {{ dayjs(w.date).format('ddd.') }}
            </span>
            <span class="text-h3 sm:text-h1 font-editorial font-black leading-none my-0.5 sm:my-1">
              {{ dayjs(w.date).format('D') }}
            </span>
            <span class="text-[10px] sm:text-[11px] font-extrabold uppercase leading-none">
              {{ dayjs(w.date).format('MMM') }}
            </span>
          </div>

          <!-- Cuerpo del Workshop -->
          <div class="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <!-- Badge de Tiempo Restante -->
                <span
                  class="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border"
                  :class="{
                    'bg-red-500 text-white border-red-400 animate-pulse': getRemainingTimeText(w.date, getWorkshopStatus(w)) === 'En Vivo / Ahora',
                    'bg-accent text-white border-accent-300': ['Hoy más tarde', 'Mañana'].includes(getRemainingTimeText(w.date, getWorkshopStatus(w))),
                    'bg-secondary/20 text-text-primary border-secondary-300': getRemainingTimeText(w.date, getWorkshopStatus(w)).startsWith('Faltan'),
                    'bg-background text-text-secondary border-divider': ['Caducó', 'Cancelado'].includes(getRemainingTimeText(w.date, getWorkshopStatus(w)))
                  }"
                >
                  {{ getRemainingTimeText(w.date, getWorkshopStatus(w)) }}
                </span>

                <!-- Badge de Estado -->
                <span
                  class="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  :class="{
                    'bg-mint text-success': getWorkshopStatus(w) === 'available',
                    'bg-error/15 text-error': getWorkshopStatus(w) === 'cancelled',
                    'bg-warning/15 text-warning': getWorkshopStatus(w) === 'finished'
                  }"
                >
                  {{ getWorkshopStatus(w) === 'available' ? 'Disponible' : getWorkshopStatus(w) === 'cancelled' ? 'Cancelado' : 'Finalizado' }}
                </span>
              </div>

              <div class="space-y-1">
                <h3
                  class="font-bold text-subtitle sm:text-title font-editorial group-hover:text-accent transition-colors line-clamp-1"
                  :class="{
                    'text-error line-through opacity-60': getWorkshopStatus(w) === 'cancelled',
                    'text-text-secondary italic': getWorkshopStatus(w) === 'finished',
                    'text-text-primary': getWorkshopStatus(w) === 'available'
                  }"
                >
                  {{ w.title }}
                </h3>

                <div v-if="w.category" class="text-[11px] text-accent font-semibold truncate flex items-center gap-1">
                  <LinkIcon class="w-3.5 h-3.5 shrink-0" />
                  <a :href="formatExternalUrl(w.category)" target="_blank" rel="noopener noreferrer" class="hover:underline truncate" @click.stop>
                    {{ w.category }}
                  </a>
                </div>

                <p class="text-caption text-text-secondary line-clamp-2 leading-relaxed">
                  {{ w.description || 'Sin descripción detallada para este taller.' }}
                </p>
              </div>
            </div>

            <!-- Detalles y Acciones -->
            <div class="pt-3 border-t border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3.5 text-caption text-text-secondary font-medium flex-wrap">
                <div class="flex items-center gap-1.5">
                  <ClockIcon class="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{{ dayjs(w.date).format('HH:mm') }} hrs</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <MapPinIcon class="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{{ w.location ?? 'Online' }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <UserGroupIcon class="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Cap: {{ w.capacity }}</span>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  class="px-3.5 py-1.5 rounded-pill border border-divider text-text-primary hover:bg-background font-bold text-caption flex items-center gap-1.5 transition-colors active:scale-95 shadow-2xs bg-surface"
                  @click.stop="openDetailModal(w.id)"
                >
                  Ver detalle
                </button>

                <button
                  type="button"
                  class="px-3.5 py-1.5 rounded-pill border border-divider text-text-primary hover:bg-background font-bold text-caption flex items-center gap-1.5 transition-colors active:scale-95 shadow-2xs bg-surface"
                  @click.stop="openAttendance(w)"
                >
                  <UserGroupIcon class="w-4 h-4 text-text-secondary" />
                  <span>Asistencia</span>
                </button>

                <button
                  type="button"
                  class="px-3.5 py-1.5 rounded-pill border border-divider text-text-primary hover:bg-background font-bold text-caption flex items-center gap-1.5 transition-colors active:scale-95 shadow-2xs bg-surface"
                  @click.stop="editWorkshop(w)"
                >
                  <PencilIcon class="w-4 h-4 text-text-secondary" />
                  <span>Editar</span>
                </button>

                <button
                  v-if="getWorkshopStatus(w) === 'available'"
                  type="button"
                  class="px-3.5 py-1.5 rounded-pill border border-error/30 text-error hover:bg-error/10 font-bold text-caption flex items-center gap-1.5 transition-colors active:scale-95 shadow-2xs bg-surface"
                  @click="cancel.mutate(w.id)"
                >
                  <NoSymbolIcon class="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        </article>

      </div>
    </div>

    <!-- MODAL DE CREACIÓN / EDICIÓN PREMIUM -->
    <AppModal v-model="showCreate" :title="editingId ? 'Editar Workshop' : 'Crear Nuevo Workshop'" size="md">
      <form class="space-y-4" @submit.prevent="save.mutate()">
        <AppInput
          v-model="form.title"
          label="Título del Workshop"
          placeholder="Ej. Estrategias de Ventas que Conectan"
          required
        />

        <AppTextarea
          v-model="form.description"
          label="Descripción o Temario"
          placeholder="Escribe los temas principales que se abordarán en la sesión..."
          :rows="3"
        />

        <AppInput
          v-model="form.category"
          label="Enlace / URL del Workshop (Zoom, Meet, Youtube, etc.)"
          placeholder="https://us02web.zoom.us/j/..."
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="form.date"
            type="datetime-local"
            label="Fecha y Hora de la Sesión"
            required
          />
          <AppInput
            v-model.number="form.capacity"
            type="number"
            label="Cupos de Capacidad"
            placeholder="20"
          />
        </div>

        <AppInput
          v-model="form.location"
          label="Ubicación / Plataforma de referencia"
          placeholder="Ej. Zoom Online, Sala de juntas, Presencial - CDMX"
        />

        <!-- Selector de Estado (Solo visible al Editar para poder reactivar cancelados o finalizar) -->
        <div v-if="editingId" class="pt-2">
          <AppSelect
            v-model="form.status"
            label="Estado del Workshop"
            :options="[
              { value: 'available', label: 'Disponible' },
              { value: 'cancelled', label: 'Cancelado' },
              { value: 'finished', label: 'Finalizado' }
            ]"
          />
        </div>
      </form>

      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <AppButton variant="ghost" @click="showCreate = false">
            Descartar
          </AppButton>
          <AppButton
            :loading="save.isPending.value"
            @click="save.mutate()"
          >
            {{ editingId ? 'Guardar Cambios' : 'Publicar Taller' }}
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- MODAL DE ASISTENCIA Y HISTORIAL DE INTERACCIONES -->
    <AppModal
      v-if="activeAttendanceWorkshop"
      v-model="activeAttendanceWorkshop"
      :title="`Asistencia: ${activeAttendanceWorkshop.title}`"
      size="md"
      @close="closeAttendance"
    >
      <div class="space-y-4">
        <!-- Pestañas (Tabs) -->
        <div class="flex border-b border-divider">
          <button
            type="button"
            class="flex-1 py-2.5 text-center font-bold text-caption transition-colors border-b-2"
            :class="attendanceTab === 'current' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'"
            @click="attendanceTab = 'current'"
          >
            Confirmaciones Actuales
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 text-center font-bold text-caption transition-colors border-b-2"
            :class="attendanceTab === 'history' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'"
            @click="attendanceTab = 'history'"
          >
            Historial de Cambios
          </button>
        </div>

        <!-- Contenido de Pestaña 1: Confirmaciones Actuales -->
        <div v-if="attendanceTab === 'current'" class="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          <!-- Asistirán -->
          <div class="space-y-1.5">
            <span class="font-bold text-success flex items-center gap-1.5 text-caption">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              Asistirán ({{ getAttending(activeAttendanceWorkshop).length }})
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
              <div
                v-for="reg in getAttending(activeAttendanceWorkshop)"
                :key="reg.id"
                class="flex items-center gap-2 p-2 rounded-xl bg-success/5 border border-success/15"
              >
                <img
                  v-if="getUserProfile(reg.user_id)?.photo_url"
                  :src="getUserProfile(reg.user_id)?.photo_url"
                  class="w-6 h-6 rounded-full object-cover border border-success/30 shrink-0"
                  alt=""
                />
                <div v-else class="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                  {{ getUserProfile(reg.user_id)?.first_name ? getUserProfile(reg.user_id)?.first_name[0] : 'E' }}
                </div>
                <span class="text-caption font-semibold text-text-primary truncate">
                  {{ getUserProfile(reg.user_id) ? `${getUserProfile(reg.user_id).first_name} ${getUserProfile(reg.user_id).last_name || ''}`.trim() : 'Embajadora' }}
                </span>
              </div>
              <span v-if="getAttending(activeAttendanceWorkshop).length === 0" class="text-text-secondary italic text-caption pl-1 block col-span-2">
                Nadie ha confirmado asistencia todavía.
              </span>
            </div>
          </div>

          <!-- Rechazaron -->
          <div class="space-y-1.5 pt-2 border-t border-divider/60">
            <span class="font-bold text-error flex items-center gap-1.5 text-caption">
              <span class="w-2 h-2 rounded-full bg-error"></span>
              Rechazaron ({{ getRejected(activeAttendanceWorkshop).length }})
            </span>
            <div class="space-y-2 pl-3">
              <div
                v-for="reg in getRejected(activeAttendanceWorkshop)"
                :key="reg.id"
                class="flex items-start gap-2.5 p-2 rounded-xl bg-error/5 border border-error/15 max-w-lg"
              >
                <img
                  v-if="getUserProfile(reg.user_id)?.photo_url"
                  :src="getUserProfile(reg.user_id)?.photo_url"
                  class="w-7 h-7 rounded-full object-cover border border-error/30 shrink-0 mt-0.5"
                  alt=""
                />
                <div v-else class="w-7 h-7 rounded-full bg-error/20 text-error flex items-center justify-center text-xs font-black shrink-0 uppercase mt-0.5">
                  {{ getUserProfile(reg.user_id)?.first_name ? getUserProfile(reg.user_id)?.first_name[0] : 'E' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-error text-caption truncate">
                    {{ getUserProfile(reg.user_id) ? `${getUserProfile(reg.user_id).first_name} ${getUserProfile(reg.user_id).last_name || ''}`.trim() : 'Embajadora' }}
                  </div>
                  <div v-if="reg.reason" class="text-text-secondary italic text-[10px] mt-0.5 leading-relaxed">
                    Motivo: "{{ reg.reason }}"
                  </div>
                </div>
              </div>
              <span v-if="getRejected(activeAttendanceWorkshop).length === 0" class="text-text-secondary italic text-caption pl-1 block">
                No hay rechazos registrados.
              </span>
            </div>
          </div>

          <!-- Pendientes -->
          <div class="space-y-1.5 pt-2 border-t border-divider/60">
            <span class="font-bold text-warning flex items-center gap-1.5 text-caption">
              <span class="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
              Falta por confirmar ({{ getPending(activeAttendanceWorkshop).length }})
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
              <div
                v-for="amb in getPending(activeAttendanceWorkshop)"
                :key="amb.id"
                class="flex items-center gap-2 p-2 rounded-xl bg-warning/5 border border-warning/15"
              >
                <img
                  v-if="amb.photo_url"
                  :src="amb.photo_url"
                  class="w-6 h-6 rounded-full object-cover border border-warning/30 shrink-0"
                  alt=""
                />
                <div v-else class="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                  {{ amb.first_name ? amb.first_name[0] : 'E' }}
                </div>
                <span class="text-caption font-semibold text-text-primary truncate">
                  {{ `${amb.first_name} ${amb.last_name || ''}`.trim() }}
                </span>
              </div>
              <span v-if="getPending(activeAttendanceWorkshop).length === 0" class="text-text-secondary italic text-caption pl-1 block col-span-2">
                Todas las embajadoras han respondido.
              </span>
            </div>
          </div>
        </div>

        <!-- Contenido de Pestaña 2: Historial de Cambios -->
        <div v-else class="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          <div v-if="activeWorkshopLogs.length === 0" class="text-center py-8 text-text-secondary italic text-caption">
            No se registran cambios de estado ni interacciones históricas para este evento.
          </div>
          <div v-else class="relative border-l border-divider pl-4 ml-2 space-y-4">
            <div
              v-for="log in activeWorkshopLogs"
              :key="log.id"
              class="relative"
            >
              <!-- Punto en la línea de tiempo -->
              <span 
                class="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-surface"
                :class="{
                  'bg-success': log.title.includes('Confirmada'),
                  'bg-error': log.title.includes('Rechazada'),
                  'bg-text-secondary': log.title.includes('Eliminada')
                }"
              ></span>
              
              <div class="flex items-start gap-2.5">
                <img
                  v-if="getUserProfile(log.user_id)?.photo_url"
                  :src="getUserProfile(log.user_id)?.photo_url"
                  class="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                  alt=""
                />
                <div v-else class="w-6 h-6 rounded-full bg-secondary/10 text-text-secondary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {{ getUserProfile(log.user_id)?.first_name ? getUserProfile(log.user_id)?.first_name[0] : 'E' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-medium text-text-primary">
                    <strong class="font-bold">
                      {{ getUserProfile(log.user_id) ? `@${getUserProfile(log.user_id).first_name} ${getUserProfile(log.user_id).last_name || ''}`.trim() : 'Embajadora' }}
                    </strong>
                    <span class="ml-1" :class="{
                      'text-success font-semibold': log.title.includes('Confirmada'),
                      'text-error font-semibold': log.title.includes('Rechazada'),
                      'text-text-secondary': log.title.includes('Eliminada')
                    }">
                      {{ log.title.includes('Confirmada') ? 'confirmó asistencia' : log.title.includes('Rechazada') ? 'no podrá asistir' : 'eliminó su asistencia' }}
                    </span>
                  </div>
                  <div v-if="log.data?.reason" class="text-[10px] text-text-secondary italic mt-0.5">
                    razón: "{{ log.data.reason }}"
                  </div>
                  <div class="text-[9px] text-text-secondary mt-1">
                    {{ dayjs(log.created_at).format('D MMMM, YYYY · HH:mm:ss') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end w-full">
          <AppButton variant="ghost" @click="closeAttendance">
            Cerrar
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>

  <WorkshopDetailModal
    v-model="showDetailModal"
    :workshop-id="selectedDetailId"
  />
</template>
