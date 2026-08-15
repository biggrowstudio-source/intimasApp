<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from '@utils/dayjs'
import {
  useAdminEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@modules/planner/composables/usePlanner'
import { useUiStore } from '@stores/ui.store'
import { useAuthStore } from '@stores/auth.store'
import {
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  VideoCameraIcon,
  UsersIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
} from '@heroicons/vue/24/outline'
import type { PlannerEvent } from '@modules/planner/types/planner.types'

const ui = useUiStore()
const auth = useAuthStore()
const { data: events, isLoading } = useAdminEvents()
const createEvent = useCreateEvent()
const updateEvent = useUpdateEvent()
const deleteEvent = useDeleteEvent()

const showForm = ref(false)
const editingEvent = ref<PlannerEvent | null>(null)

const grouped = computed(() => {
  if (!events.value) return []
  const groups: Record<string, PlannerEvent[]> = {}
  for (const ev of events.value) {
    const key = dayjs(ev.startDate).format('YYYY-MM')
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }
  return Object.entries(groups).map(([key, evs]) => ({
    label: dayjs(key + '-01').format('MMMM YYYY'),
    events: evs.sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()),
  }))
})

function openCreate() {
  editingEvent.value = null
  showForm.value = true
}

function openEdit(ev: PlannerEvent) {
  editingEvent.value = ev
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingEvent.value = null
}

async function onCreate(input: any) {
  try {
    await createEvent.mutateAsync({ ...input, source: 'admin' })
    ui.pushToast({ title: 'Evento creado', variant: 'success' })
    closeForm()
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onUpdate(id: string, input: any) {
  try {
    await updateEvent.mutateAsync({ id, input: { ...input, source: 'admin' } })
    ui.pushToast({ title: 'Evento actualizado', variant: 'success' })
    closeForm()
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onDelete(id: string) {
  if (!confirm('¿Eliminar este evento? Las respuestas de asistencia también se eliminarán.')) return
  try {
    await deleteEvent.mutateAsync(id)
    ui.pushToast({ title: 'Evento eliminado', variant: 'info' })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

const stats = computed(() => {
  if (!events.value) return { total: 0, presencial: 0, online: 0 }
  return {
    total: events.value.length,
    presencial: events.value.filter((e) => e.modality === 'presencial').length,
    online: events.value.filter((e) => e.modality === 'online').length,
  }
})
</script>

<template>
  <AppTopBar title="Eventos administrativos" :back="true">
    <template #actions>
      <button
        v-if="!showForm"
        class="w-9 h-9 rounded-pill bg-blush text-accent-500 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
        aria-label="Nuevo evento"
        @click="openCreate"
      >
        <PlusIcon class="w-5 h-5" />
      </button>
    </template>
  </AppTopBar>

  <div v-if="showForm" class="mb-4">
    <button
      class="text-small text-accent font-semibold mb-3 inline-flex items-center gap-1"
      @click="closeForm"
    >
      <ChevronLeftIcon class="w-4 h-4" />
      Volver a la lista
    </button>
    <div class="rounded-2xl bg-surface shadow-elevation1 p-4">
      <EventEditor
        :embedded="true"
        :event-to-edit="editingEvent"
        :default-source="'admin'"
        @submit="onCreate"
        @update="onUpdate"
        @close="closeForm"
      />
    </div>
  </div>

  <div v-else>
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="p-3 rounded-xl bg-surface shadow-elevation1 text-center">
        <p class="text-h3 font-editorial text-text-primary">{{ stats.total }}</p>
        <p class="text-caption text-text-secondary">Total</p>
      </div>
      <div class="p-3 rounded-xl bg-surface shadow-elevation1 text-center">
        <p class="text-h3 font-editorial text-primary">{{ stats.presencial }}</p>
        <p class="text-caption text-text-secondary">Presencial</p>
      </div>
      <div class="p-3 rounded-xl bg-surface shadow-elevation1 text-center">
        <p class="text-h3 font-editorial text-accent">{{ stats.online }}</p>
        <p class="text-caption text-text-secondary">Online</p>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-2">
      <AppSkeleton v-for="i in 3" :key="i" height="80px" />
    </div>

    <div v-else-if="grouped.length === 0">
      <AppEmptyState
        title="Sin eventos administrativos"
        description="Crea el primer evento para que las embajadoras puedan confirmar asistencia."
        icon-name="calendar"
        action-label="Crear primer evento"
        @action="openCreate"
      />
    </div>

    <div v-else class="space-y-5">
      <section v-for="group in grouped" :key="group.label">
        <h2 class="text-title font-semibold text-text-primary mb-3 capitalize">
          {{ group.label }}
        </h2>
        <div class="space-y-2.5">
          <article
            v-for="ev in group.events"
            :key="ev.id"
            class="p-4 rounded-xl bg-surface shadow-elevation1"
          >
            <header class="flex items-start gap-3 mb-2">
              <div
                :class="[
                  'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                  ev.modality === 'online' ? 'bg-blush text-accent-500' : 'bg-mint text-success',
                ]"
              >
                <VideoCameraIcon v-if="ev.modality === 'online'" class="w-5 h-5" />
                <MapPinIcon v-else class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-small font-semibold text-text-primary line-clamp-2">
                  {{ ev.title }}
                </h3>
                <p class="text-caption text-text-secondary mt-0.5 capitalize">
                  {{ dayjs(ev.startDate).format('ddd D MMM · HH:mm') }}
                  <span v-if="ev.location"> · {{ ev.location }}</span>
                </p>
              </div>
            </header>

            <p v-if="ev.description" class="text-caption text-text-secondary line-clamp-2 mb-3">
              {{ ev.description }}
            </p>

            <div class="flex items-center gap-1.5 flex-wrap mb-3">
              <AppBadge :variant="ev.modality === 'online' ? 'accent' : 'success'" size="sm">
                {{ ev.modality === 'online' ? 'Online' : 'Presencial' }}
              </AppBadge>
              <AppBadge v-if="ev.maxCapacity" variant="neutral" size="sm">
                <UsersIcon class="w-3 h-3" />
                {{ ev.maxCapacity }} cupos
              </AppBadge>
              <AppBadge v-if="ev.link" variant="primary" size="sm">Con enlace</AppBadge>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-divider">
              <button
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-pill bg-background text-text-primary text-small font-medium hover:bg-secondary-100"
                @click="openEdit(ev)"
              >
                <PencilSquareIcon class="w-4 h-4" />
                Editar
              </button>
              <button
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-pill bg-error/10 text-error text-small font-medium hover:bg-error hover:text-white transition-colors"
                @click="onDelete(ev.id)"
              >
                <TrashIcon class="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
