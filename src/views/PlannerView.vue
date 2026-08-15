<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from '@utils/dayjs'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import {
  useEvents,
  useTasks,
  useCreateEvent,
  useUpdateEvent,
  useCreateTask,
  useToggleTask,
  useDeleteTask,
  useDeleteEvent,
} from '@modules/planner/composables/usePlanner'
import { useUiStore } from '@stores/ui.store'
import { useAuthStore } from '@stores/auth.store'

import PlannerHeader from '@modules/planner/components/PlannerHeader.vue'
import WeekSelector from '@modules/planner/components/WeekSelector.vue'
import AgendaTimeline from '@modules/planner/components/AgendaTimeline.vue'
import EventDetailModal from '@modules/planner/components/EventDetailModal.vue'
import MonthAgenda from '@modules/planner/components/MonthAgenda.vue'
import TaskListItem from '@modules/planner/components/TaskListItem.vue'
import WeeklyProgress from '@modules/planner/components/WeeklyProgress.vue'
import EventEditor from '@modules/planner/components/EventEditor.vue'
import TaskEditor from '@modules/planner/components/TaskEditor.vue'

import type { PlannerEventInput, TaskInput } from '@modules/planner/types/planner.types'
import { MapPinIcon, ClockIcon, CalendarIcon, UsersIcon } from '@heroicons/vue/24/outline'
import { ArrowRightIcon } from '@heroicons/vue/24/outline'

interface Workshop {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  capacity: number
  status: 'available' | 'full' | 'finished' | 'cancelled'
  image: string | null
}

const route = useRoute()
const ui = useUiStore()
const auth = useAuthStore()
const activeTab = ref<'agenda' | 'tasks' | 'workshops'>('agenda')
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const viewMode = ref<'month' | 'week' | 'agenda'>('week')
const taskFilter = ref<'pending' | 'in_progress' | 'completed'>('pending')

// Detectar ?action=new desde la URL para abrir el editor de eventos directamente desde el FAB
watch(
  () => route.query.action,
  (action) => {
    if (action === 'new') {
      activeTab.value = 'agenda'
      showEventEditor.value = true
    }
  },
  { immediate: true }
)


const monthRange = computed(() => ({
  from: dayjs(selectedDate.value).startOf('month').toISOString(),
  to: dayjs(selectedDate.value).endOf('month').toISOString(),
}))

const { data: events, isLoading: eventsLoading } = useEvents(monthRange)
const { data: tasks } = useTasks()
const createEvent = useCreateEvent()
const updateEvent = useUpdateEvent()
const createTask = useCreateTask()
const toggleTask = useToggleTask()
const deleteTask = useDeleteTask()
const deleteEvent = useDeleteEvent()

const { data: workshops, isLoading: workshopsLoading } = useQuery({
  queryKey: ['planner', 'workshops'],
  queryFn: async (): Promise<Workshop[]> => {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .order('date', { ascending: true })
    if (error) throw error
    return data ?? []
  },
  staleTime: 1000 * 60 * 2,
})

const { data: myRegistrations } = useQuery({
  queryKey: ['planner', 'my-registrations', auth.user?.id],
  queryFn: async (): Promise<{ workshop_id: string; status: string }[]> => {
    if (!auth.user?.id) return []
    const { data, error } = await supabase
      .from('workshop_registrations')
      .select('workshop_id, status')
      .eq('user_id', auth.user.id)
    if (error) throw error
    return data ?? []
  },
  enabled: !!auth.user?.id,
  staleTime: 1000 * 60 * 2,
})

const pendingTasks = computed(() => tasks.value?.filter((t) => !t.completed) ?? [])
const completedTasks = computed(() => tasks.value?.filter((t) => t.completed) ?? [])

const filteredTasks = computed(() => {
  if (!tasks.value) return []
  if (taskFilter.value === 'pending') return pendingTasks.value
  if (taskFilter.value === 'completed') return completedTasks.value
  return tasks.value.filter((t) => t.status === 'in_progress')
})

const weeklyStats = computed(() => {
  const total = (events.value?.length ?? 0) + (tasks.value?.length ?? 0)
  const done = (events.value?.filter((e) => e.status === 'completed').length ?? 0) +
    completedTasks.value.length
  return { completed: done, total }
})

const upcomingWorkshops = computed(() => {
  const now = new Date().toISOString()
  return workshops.value?.filter((w) => w.date >= now && w.status !== 'cancelled') ?? []
})

const registeredIds = computed(() => new Set(myRegistrations.value?.map((r) => r.workshop_id) ?? []))

function isRegistered(workshopId: string) {
  return registeredIds.value.has(workshopId)
}

function workshopStatusText(w: Workshop) {
  if (w.status === 'cancelled') return 'Cancelado'
  if (w.status === 'finished') return 'Finalizado'
  if (w.status === 'full') return 'Lleno'
  if (isRegistered(w.id)) return 'Inscrita'
  return 'Disponible'
}

function workshopStatusClass(w: Workshop) {
  if (w.status === 'cancelled') return 'text-error'
  if (w.status === 'finished') return 'text-text-secondary'
  if (w.status === 'full') return 'text-error'
  if (isRegistered(w.id)) return 'text-accent font-semibold'
  return 'text-success'
}

const showEventEditor = ref(false)
const selectedEventId = ref<string | null>(null)
const editingEventId = ref<string | null>(null)

const selectedEvent = computed(() => {
  if (!selectedEventId.value) return null
  return events.value?.find((e) => e.id === selectedEventId.value) ?? null
})

const editingEvent = computed(() => {
  if (!editingEventId.value) return null
  return events.value?.find((e) => e.id === editingEventId.value) ?? null
})

async function onCreateEvent(input: PlannerEventInput) {
  try {
    await createEvent.mutateAsync(input)
    ui.pushToast({ title: 'Evento creado', variant: 'success' })
    showEventEditor.value = false
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onUpdateEvent(id: string, input: PlannerEventInput) {
  try {
    await updateEvent.mutateAsync({ id, input })
    ui.pushToast({ title: 'Evento actualizado', variant: 'success' })
    editingEventId.value = null
    showEventEditor.value = false
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onCreateTask(input: TaskInput) {
  try {
    await createTask.mutateAsync(input)
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onToggleTask(id: string, completed: boolean) {
  try {
    await toggleTask.mutateAsync({ id, completed })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onDeleteTask(id: string) {
  try {
    await deleteTask.mutateAsync(id)
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

async function onDeleteEvent(id: string) {
  try {
    await deleteEvent.mutateAsync(id)
    selectedEventId.value = null
    ui.pushToast({ title: 'Evento eliminado', variant: 'info' })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}

function onSelectEvent(id: string) {
  selectedEventId.value = id
}

function onCloseDetail() {
  selectedEventId.value = null
}

function onCloseEditor() {
  showEventEditor.value = false
  editingEventId.value = null
}

function onEditEvent(id: string) {
  selectedEventId.value = null
  editingEventId.value = id
  showEventEditor.value = true
}
</script>

<template>
  <div class="space-y-5">
    <PlannerHeader :show-new-event="activeTab === 'agenda'" @new-event="showEventEditor = true" />

    <!-- Tabs -->
    <div class="flex rounded-2xl bg-background border border-divider/60 p-1">
      <button
        v-for="tab in [
          { key: 'agenda', label: 'Agenda' },
          { key: 'tasks', label: 'Mis Tareas' },
          { key: 'workshops', label: 'Workshops' },
        ] as const"
        :key="tab.key"
        type="button"
        :class="[
          'flex-1 h-10 rounded-xl text-caption sm:text-small font-extrabold transition-all',
          activeTab === tab.key
            ? 'bg-surface text-accent shadow-elevation1'
            : 'text-text-secondary hover:text-text-primary',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Mis Tareas -->
    <div v-if="activeTab === 'tasks'" class="space-y-5">
      <div class="rounded-2xl bg-surface border border-divider/60 shadow-elevation1 overflow-hidden">
        <div class="flex items-center gap-1 px-3 pt-2.5 border-b border-divider overflow-x-auto overflow-y-hidden no-scrollbar scrollbar-hide max-w-full">

          <button
            v-for="tab in [
              { key: 'pending', label: 'Pendientes', count: pendingTasks.length },
              { key: 'in_progress', label: 'En progreso', count: tasks?.filter((t) => t.status === 'in_progress').length ?? 0 },
              { key: 'completed', label: 'Completadas', count: completedTasks.length },
            ]"
            :key="tab.key"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 px-3 h-10 text-small font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              taskFilter === tab.key
                ? 'text-accent border-accent'
                : 'text-text-secondary border-transparent hover:text-text-primary',
            ]"
            @click="taskFilter = tab.key as 'pending' | 'in_progress' | 'completed'"
          >
            {{ tab.label }}
            <span
              :class="[
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill text-caption font-bold',
                taskFilter === tab.key ? 'bg-accent-50 text-accent-500' : 'bg-background text-text-secondary',
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <div class="divide-y divide-divider">
          <TaskListItem
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            @toggle="onToggleTask"
            @delete="onDeleteTask"
          />
          <div v-if="filteredTasks.length === 0" class="p-6 text-center text-text-secondary text-small">
            Sin tareas en esta categoría.
          </div>
        </div>

        <div class="border-t border-divider p-3">
          <TaskEditor @submit="onCreateTask" />
        </div>
      </div>

      <WeeklyProgress
        :completed="weeklyStats.completed"
        :total="Math.max(weeklyStats.total, 12)"
      />
    </div>

    <!-- Tab: Agenda -->
    <div v-if="activeTab === 'agenda'" class="space-y-5">
      <WeekSelector
        :selected-date="selectedDate"
        :view-mode="viewMode"
        @update:selected-date="(v: string) => (selectedDate = v)"
        @update:view-mode="(v: 'month' | 'week' | 'agenda') => (viewMode = v)"
      />

      <Transition
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <MonthAgenda
          v-if="viewMode === 'month'"
          :events="events ?? []"
          :selected-date="selectedDate"
          :base-date="selectedDate"
          @update:selected-date="(v: string) => (selectedDate = v)"
        />

        <AgendaTimeline
          v-else
          :events="events ?? []"
          @select="onSelectEvent"
        />
      </Transition>

      <AppModal
        :model-value="showEventEditor"
        :title="editingEventId ? 'Editar evento' : 'Nuevo evento'"
        size="md"
        @update:model-value="(v: boolean) => onCloseEditor()"
      >
        <EventEditor
          :embedded="true"
          :event-to-edit="editingEvent"
          @submit="onCreateEvent"
          @update="onUpdateEvent"
          @close="onCloseEditor"
        />
      </AppModal>

      <EventDetailModal
        :event="selectedEvent"
        @close="onCloseDetail"
        @edit="onEditEvent"
        @delete="onDeleteEvent"
      />
    </div>

    <!-- Tab: Workshops -->
    <div v-if="activeTab === 'workshops'" class="space-y-4">
      <div v-if="workshopsLoading" class="space-y-3">
        <AppSkeleton v-for="i in 3" :key="i" height="88px" />
      </div>

      <div v-else-if="upcomingWorkshops.length === 0" class="text-center py-12">
        <p class="text-body text-text-secondary">No hay workshops disponibles por ahora.</p>
      </div>

      <RouterLink
        v-for="(w, i) in upcomingWorkshops"
        :key="w.id"
        :to="`/full/workshop/${w.id}`"
        class="group block rounded-xl bg-surface shadow-elevation1 hover:shadow-elevation2 active:scale-[0.99] transition-all overflow-hidden"
      >
        <div class="flex items-stretch">
          <div
            :class="[
              'flex flex-col items-center justify-center min-w-[72px] px-3 py-4',
              i === 0 ? 'bg-accent text-white' : 'bg-blush text-accent',
            ]"
          >
            <span class="text-caption font-semibold uppercase tracking-wider leading-none">{{ dayjs(w.date).format('ddd').toUpperCase() }}</span>
            <span class="text-h2 font-editorial font-bold leading-none my-1">{{ dayjs(w.date).format('D') }}</span>
            <span class="text-caption font-semibold uppercase leading-none">{{ dayjs(w.date).format('MMM') }}</span>
          </div>

          <div class="flex-1 min-w-0 p-3.5 flex flex-col justify-center gap-1">
            <div class="flex items-center gap-2">
              <h3 class="text-title font-editorial font-semibold text-text-primary leading-snug line-clamp-2">
                {{ w.title }}
              </h3>
              <span
                v-if="i === 0"
                class="shrink-0 inline-flex items-center gap-1 bg-accent/10 text-accent text-caption font-semibold px-2 py-0.5 rounded-pill"
              >
                Destacado
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span class="inline-flex items-center gap-1">
                <ClockIcon class="w-3.5 h-3.5" />
                {{ dayjs(w.date).format('HH:mm') }}
              </span>
              <span v-if="w.location" class="inline-flex items-center gap-1">
                <MapPinIcon class="w-3.5 h-3.5" />
                {{ w.location }}
              </span>
              <span class="inline-flex items-center gap-1" :class="workshopStatusClass(w)">
                {{ workshopStatusText(w) }}
              </span>
            </div>
          </div>

          <div class="flex items-center pr-3.5 text-text-secondary">
            <ArrowRightIcon class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
