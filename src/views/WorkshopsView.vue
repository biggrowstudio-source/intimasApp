<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import dayjs from '@utils/dayjs'
import { MapPinIcon, UsersIcon, CalendarIcon, LinkIcon, UserGroupIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/vue/24/outline'
import WorkshopDetailModal from '@modules/workshops/components/WorkshopDetailModal.vue'
import AppPageHeader from '@components/base/AppPageHeader.vue'

interface Workshop {
  id: string
  title: string
  description: string | null
  category: string | null
  date: string
  location: string | null
  capacity: number
  status: 'available' | 'full' | 'finished' | 'cancelled'
  image: string | null
}

const auth = useAuthStore()
const ui = useUiStore()
const qc = useQueryClient()
const route = useRoute()
const router = useRouter()

const filter = ref<'all' | 'available' | 'registered'>('all')
const selectedWorkshopId = ref<string | null>(null)
const showDetailModal = ref(false)

onMounted(() => {
  if (route.query.detail) {
    selectedWorkshopId.value = String(route.query.detail)
    showDetailModal.value = true
  }
})

watch(
  () => route.query.detail,
  (newVal) => {
    if (newVal) {
      selectedWorkshopId.value = String(newVal)
      showDetailModal.value = true
    } else {
      showDetailModal.value = false
    }
  }
)

watch(showDetailModal, (isOpen) => {
  if (!isOpen) {
    selectedWorkshopId.value = null
    if (route.query.detail) {
      const query = { ...route.query }
      delete query.detail
      router.replace({ query })
    }
  }
})

function openDetail(workshopId: string) {
  selectedWorkshopId.value = workshopId
  showDetailModal.value = true
  router.replace({ query: { ...route.query, detail: workshopId } })
}

const { data: workshops, isLoading } = useQuery({
  queryKey: ['workshops'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .order('date', { ascending: true })
    if (error) throw error
    return data ?? []
  },
  staleTime: 1000 * 60 * 5,
})

const { data: myRegistrations } = useQuery({
  queryKey: ['workshops', 'my-registrations', auth.user?.id],
  queryFn: async () => {
    if (!auth.user?.id) return []
    const { data, error } = await supabase
      .from('workshop_registrations')
      .select('workshop_id, status')
      .eq('user_id', auth.user.id)
    if (error) throw error
    return data ?? []
  },
  enabled: computed(() => !!auth.user?.id),
})

const register = useMutation({
  mutationFn: async (workshopId: string) => {
    if (!auth.user?.id) throw new Error('No autenticado')
    const { error } = await supabase
      .from('workshop_registrations')
      .insert({ workshop_id: workshopId, user_id: auth.user.id })
    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['workshops'] })
    ui.pushToast({ title: 'Inscripción confirmada', variant: 'success' })
  },
  onError: (e: Error) => ui.pushToast({ title: 'Error', description: e.message, variant: 'error' }),
})

const filtered = computed(() => {
  if (!workshops.value) return []
  if (filter.value === 'registered') {
    const ids = new Set(myRegistrations.value?.map((r) => r.workshop_id) ?? [])
    return workshops.value.filter((w) => ids.has(w.id))
  }
  if (filter.value === 'available') {
    const ids = new Set(myRegistrations.value?.map((r) => r.workshop_id) ?? [])
    return workshops.value.filter((w) => getWorkshopStatus(w) === 'available' && !ids.has(w.id))
  }
  return workshops.value
})

function isRegistered(id: string) {
  return myRegistrations.value?.some((r) => r.workshop_id === id) ?? false
}

function getWorkshopStatus(w: Workshop) {
  if (w.status === 'cancelled') return 'cancelled'
  const wsDate = new Date(w.date)
  const now = new Date()
  if (now.getTime() > wsDate.getTime() + 2 * 60 * 60 * 1000) {
    return 'finished'
  }
  return w.status || 'available'
}

function statusLabel(s: Workshop['status']) {
  return { available: 'Disponible', full: 'Completo', finished: 'Finalizado', cancelled: 'Cancelado' }[s]
}

function statusVariant(s: Workshop['status']): 'success' | 'warning' | 'neutral' | 'error' {
  return ({ available: 'success', full: 'warning', finished: 'neutral', cancelled: 'error' } as const)[s]
}

function getRemainingTimeText(dateStr: string, status: string) {
  if (status === 'cancelled') return 'Cancelado'
  const wsDate = new Date(dateStr)
  const now = new Date()
  const diffTime = wsDate.getTime() - now.getTime()
  if (diffTime < 0) {
    const twoHoursAfter = wsDate.getTime() + 2 * 60 * 60 * 1000
    if (now.getTime() <= twoHoursAfter) return 'En Vivo / Ahora'
    return 'Caducó'
  }
  if (wsDate.toDateString() === now.toDateString()) return 'Hoy más tarde'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (wsDate.toDateString() === tomorrow.toDateString()) return 'Mañana'
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `Faltan ${diffDays} días`
}

function formatExternalUrl(url: string | null | undefined): string {
  if (!url) return '#'
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
</script>

<template>
  <AppPageHeader
    title="Workshops"
    description="Aprende, capacítate y conecta en nuestras sesiones en vivo."
  />

  <div class="space-y-5">
    <AppTabs
      v-model="filter"
      :options="[
        { label: 'Todos', value: 'all' },
        { label: 'Disponibles', value: 'available' },
        { label: 'Mis inscripciones', value: 'registered' },
      ]"
    />

    <div v-if="isLoading" class="space-y-3">
      <AppSkeleton v-for="i in 3" :key="i" height="140px" />
    </div>

    <div v-else-if="!filtered || filtered.length === 0">
      <AppEmptyState title="Sin workshops" description="Pronto publicaremos nuevas capacitaciones." icon-name="calendar" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <article
        v-for="w in filtered"
        :key="w.id"
        class="rounded-2xl bg-surface border shadow-elevation1 hover:shadow-elevation2 transition-all flex flex-col sm:flex-row overflow-hidden group border-divider relative"
        :class="w.status === 'cancelled' ? 'opacity-75 bg-background/50' : ''"
      >
        <!-- Columna de Fecha en la Izquierda (Left Date Badge Homogéneo) -->
        <div
          class="flex sm:flex-col items-center justify-center gap-2 sm:gap-1 px-4 py-3 sm:py-5 min-w-[76px] sm:min-w-[84px] shrink-0 transition-colors"
          :class="[
            isRegistered(w.id)
              ? 'bg-accent text-white font-bold'
              : getWorkshopStatus(w) === 'finished'
              ? 'bg-secondary/15 text-text-secondary'
              : 'bg-blush text-accent border-b sm:border-b-0 sm:border-r border-accent/15'
          ]"
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
              <!-- Badge tiempo restante -->
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

              <!-- Badge estado -->
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
                {{ w.description || 'Sin descripción disponible.' }}
              </p>
            </div>
          </div>

          <!-- Detalles + botones de usuario -->
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
                <span>{{ w.capacity }} cupos</span>
              </div>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <AppButton
                v-if="w.status === 'available' && !isRegistered(w.id)"
                :loading="register.isPending.value"
                @click="register.mutate(w.id)"
              >
                Inscribirme
              </AppButton>
              <AppButton v-else-if="isRegistered(w.id)" variant="outline" disabled>
                Inscrita ✓
              </AppButton>
              <AppButton variant="ghost" @click="openDetail(w.id)">
                Ver detalle
              </AppButton>
            </div>
          </div>
        </div>
      </article>
    </div>

  </div>

  <WorkshopDetailModal
    v-model="showDetailModal"
    :workshop-id="selectedWorkshopId"
  />
</template>
