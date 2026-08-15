<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from '@utils/dayjs'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  VideoCameraIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserGroupIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import { useUiStore } from '@stores/ui.store'
import { useAuthStore } from '@stores/auth.store'
import {
  useMyAttendance,
  useEventAttendees,
  useSetAttendance,
  useRemoveAttendance,
} from '@modules/planner/composables/useEventAttendance'
import type {
  PlannerEvent,
  PlannerModality,
  AttendanceStatus,
} from '@modules/planner/types/planner.types'

const props = defineProps<{
  event: PlannerEvent | null
}>()

const emit = defineEmits<{
  close: []
  edit: [id: string]
  delete: [id: string]
}>()

const ui = useUiStore()
const auth = useAuthStore()

const isOpen = computed({
  get: () => props.event !== null,
  set: (v) => { if (!v) emit('close') },
})

const showReasonInput = ref(false)
const reason = ref('')
const showCancelInput = ref(false)
const cancelReason = ref('')

const eventId = computed(() => props.event?.id ?? '')
const isAdminEvent = computed(() => props.event?.source === 'admin' || props.event?.type === 'workshop')
const isAdmin = computed(() => auth.role === 'admin' || auth.role === 'super_admin')

const myAttendance = useMyAttendance(eventId)
const attendees = useEventAttendees(eventId)
const setAttendance = useSetAttendance()
const removeAttendance = useRemoveAttendance()

const isWorkshop = computed(() => props.event?.id?.startsWith('workshop-') || props.event?.type === 'workshop')
const canEditOrDelete = computed(() => {
  if (!props.event) return false
  if (isWorkshop.value) return false
  return true
})


const dateLabel = computed(() => {
  if (!props.event) return ''
  return dayjs(props.event.startDate).format('dddd D [de] MMMM')
})

const timeLabel = computed(() => {
  if (!props.event) return ''
  const start = dayjs(props.event.startDate).format('HH:mm')
  if (props.event.endDate) {
    const end = dayjs(props.event.endDate).format('HH:mm')
    return `${start} – ${end}`
  }
  return start
})

const linkInfo = computed(() => {
  if (!props.event?.link) return null
  try {
    const parsed = new URL(props.event.link)
    const host = parsed.hostname.toLowerCase()
    if (host.includes('meet.google.com')) return { label: 'Unirse a Google Meet', url: props.event.link }
    if (host.includes('zoom.us')) return { label: 'Unirse a Zoom', url: props.event.link }
    if (host.includes('teams.microsoft.com') || host.includes('teams.live.com')) return { label: 'Unirse a Teams', url: props.event.link }
    return { label: 'Abrir enlace', url: props.event.link }
  } catch {
    return null
  }
})

const attendeesByStatus = computed(() => {
  const list = attendees.data.value ?? []
  return {
    attending: list.filter((a) => a.status === 'attending'),
    not_attending: list.filter((a) => a.status === 'not_attending'),
  }
})

const myStatus = computed<AttendanceStatus | null>(() => myAttendance.data.value?.status ?? null)

function onAttend() {
  if (!eventId.value) return
  showReasonInput.value = false
  setAttendance.mutate(
    { eventId: eventId.value, status: 'attending' },
    {
      onSuccess: () => {
        ui.pushToast({ title: '¡Asistencia confirmada!', variant: 'success' })
      },
      onError: (err: any) => {
        console.error('Error al confirmar asistencia:', err)
        ui.pushToast({ title: 'Error al actualizar', description: err?.message || 'Inténtalo de nuevo', variant: 'error' })
      },
    }
  )
}

function onNotAttend() {
  if (!eventId.value) return
  showReasonInput.value = !showReasonInput.value
}

function onConfirmNotAttend() {
  if (!eventId.value) return
  if (!reason.value.trim()) {
    ui.pushToast({ title: 'Justificación requerida', description: 'Cuéntanos por qué no podrás asistir', variant: 'warning' })
    return
  }
  setAttendance.mutate(
    { eventId: eventId.value, status: 'not_attending', reason: reason.value },
    {
      onSuccess: () => {
        ui.pushToast({ title: 'Has confirmado que no asistirás', variant: 'info' })
        showReasonInput.value = false
        reason.value = ''
      },
      onError: (err: any) => {
        console.error('Error al registrar inasistencia:', err)
        ui.pushToast({ title: 'Error al actualizar', description: err?.message || 'Inténtalo de nuevo', variant: 'error' })
      },
    }
  )
}

function onRemove() {
  // Mismo flujo que "No asistiré": muestra textarea con razón (opcional)
  showCancelInput.value = true
  cancelReason.value = ''
}

function onConfirmCancel() {
  if (!eventId.value) return
  setAttendance.mutate(
    { eventId: eventId.value, status: 'not_attending', reason: cancelReason.value.trim() || undefined },
    {
      onSuccess: () => {
        ui.pushToast({ title: 'Asistencia cancelada', variant: 'info' })
        showCancelInput.value = false
        cancelReason.value = ''
      },
      onError: (err: any) => {
        ui.pushToast({ title: 'Error al cancelar', description: err?.message || 'Inténtalo de nuevo', variant: 'error' })
      },
    }
  )
}

function onCancelFormClose() {
  showCancelInput.value = false
  cancelReason.value = ''
}

function onDelete() {
  if (!props.event) return
  if (confirm('¿Eliminar este evento?')) {
    emit('delete', props.event.id)
  }
}

function onEdit() {
  if (!props.event) return
  emit('edit', props.event.id)
}

function openLink() {
  if (!linkInfo.value) return
  window.open(linkInfo.value.url, '_blank', 'noopener,noreferrer')
}

const modalityConfig: Record<PlannerModality, { icon: typeof MapPinIcon; label: string; bgClass: string; textClass: string }> = {
  presencial: { icon: MapPinIcon, label: 'Presencial', bgClass: 'bg-mint', textClass: 'text-success' },
  online: { icon: VideoCameraIcon, label: 'Online', bgClass: 'bg-blush', textClass: 'text-accent-500' },
}
</script>

<template>
  <AppModal
    :model-value="isOpen"
    size="md"
    @update:model-value="(v: boolean) => (isOpen = v)"
  >
    <div v-if="event" class="space-y-4">
      <header class="flex items-start gap-3">
        <div
          :class="[
            'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            event.modality ? modalityConfig[event.modality].bgClass : 'bg-blush',
            event.modality ? modalityConfig[event.modality].textClass : 'text-accent-500',
          ]"
        >
          <VideoCameraIcon v-if="event.modality === 'online'" class="w-6 h-6" />
          <MapPinIcon v-else-if="event.modality === 'presencial'" class="w-6 h-6" />
          <CalendarIcon v-else class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1">
            <AppBadge v-if="isAdminEvent" variant="primary" size="sm">
              <UserGroupIcon class="w-3 h-3" />
              Administrativo
            </AppBadge>
            <AppBadge
              v-if="event.priority"
              size="sm"
              class="!bg-transparent !border-0 text-white"
              :style="{ backgroundColor: event.priority.color }"
            >
              {{ event.priority.name }}
            </AppBadge>
            <AppBadge
              v-if="event.modality"
              :variant="event.modality === 'online' ? 'accent' : 'success'"
              size="sm"
            >
              <component :is="modalityConfig[event.modality].icon" class="w-3 h-3" />
              {{ modalityConfig[event.modality].label }}
            </AppBadge>
          </div>
          <h2 class="text-h3 font-editorial text-text-primary leading-tight">
            {{ event.title }}
          </h2>
        </div>
      </header>

      <div v-if="linkInfo" class="space-y-2">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all"
          @click="openLink"
        >
          <VideoCameraIcon class="w-5 h-5" />
          {{ linkInfo.label }}
          <ArrowTopRightOnSquareIcon class="w-4 h-4 opacity-70" />
        </button>
        <p class="text-caption text-text-secondary truncate text-center">
          {{ linkInfo.url }}
        </p>
      </div>

      <div v-if="isAdminEvent" class="rounded-xl bg-secondary-50 p-3 space-y-2">
        <p class="text-caption font-semibold text-text-secondary uppercase tracking-wide">
          Tu asistencia
        </p>

        <div v-if="!myStatus" class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="h-11 rounded-xl bg-success text-white font-semibold hover:bg-success/90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5"
            @click="onAttend"
          >
            <CheckIcon class="w-5 h-5" />
            Asistiré
          </button>
          <button
            type="button"
            :class="[
              'h-11 rounded-xl font-semibold active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5',
              showReasonInput
                ? 'bg-error text-white'
                : 'bg-error/15 text-error hover:bg-error hover:text-white',
            ]"
            @click="onNotAttend"
          >
            <XCircleIcon class="w-5 h-5" />
            No asistiré
          </button>
        </div>

        <div v-if="showReasonInput && !myStatus" class="space-y-2">
          <AppTextarea
            v-model="reason"
            label="¿Por qué no podrás asistir?"
            placeholder="Cuéntanos el motivo..."
            :rows="2"
          />
          <div class="flex justify-end gap-2">
            <AppButton variant="ghost" size="sm" @click="showReasonInput = false">Cancelar</AppButton>
            <AppButton variant="danger" size="sm" @click="onConfirmNotAttend">Confirmar</AppButton>
          </div>
        </div>

        <div v-else-if="myStatus === 'attending'" class="space-y-2">
          <div class="flex items-center justify-between p-3 rounded-lg bg-success/15">
            <div class="flex items-center gap-2">
              <CheckIcon class="w-5 h-5 text-success" />
              <span class="text-small font-medium text-success">Has confirmado tu asistencia</span>
            </div>
            <button
              v-if="!showCancelInput"
              class="text-caption text-text-secondary hover:text-error"
              @click="onRemove"
            >Quitar</button>
          </div>

          <!-- Formulario de razón al cancelar -->
          <div v-if="showCancelInput" class="space-y-2">
            <AppTextarea
              v-model="cancelReason"
              label="¿Por qué cancelarás tu asistencia?"
              placeholder="Cuéntanos el motivo (opcional)..."
              :rows="2"
            />
            <div class="flex justify-end gap-2">
              <AppButton variant="ghost" size="sm" @click="onCancelFormClose">Volver</AppButton>
              <AppButton variant="danger" size="sm" @click="onConfirmCancel">Confirmar cancelación</AppButton>
            </div>
          </div>
        </div>

        <div v-else-if="myStatus === 'not_attending'" class="p-3 rounded-lg bg-error/10 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <XCircleIcon class="w-5 h-5 text-error" />
              <span class="text-small font-medium text-error">No asistirás</span>
            </div>
            <button
              v-if="!showCancelInput"
              class="text-caption text-text-secondary hover:text-accent"
              @click="onAttend"
            >Cambiar a Asistiré</button>
          </div>
          <p
            v-if="myAttendance.data.value?.reason"
            class="text-caption text-text-secondary mt-1.5 pl-7 italic"
          >
            "{{ myAttendance.data.value.reason }}"
          </p>
        </div>
      </div>

      <div v-if="isAdminEvent" class="rounded-xl bg-secondary-50 p-3 space-y-2">
        <p class="text-caption font-semibold text-text-secondary uppercase tracking-wide">
          Respuestas
          <span class="text-text-secondary normal-case font-normal">
            · {{ attendeesByStatus.attending.length }} asistirán
            · {{ attendeesByStatus.not_attending.length }} no asistirán
          </span>
        </p>

        <details v-if="attendeesByStatus.not_attending.length > 0" class="group">
          <summary class="cursor-pointer text-caption text-text-secondary font-medium flex items-center gap-1">
            Ver {{ attendeesByStatus.not_attending.length }} que no asistirán
          </summary>
          <ul class="mt-2 space-y-1.5">
            <li
              v-for="a in attendeesByStatus.not_attending"
              :key="a.id"
              class="flex items-start gap-2 p-2 rounded-lg bg-error/5"
            >
              <AppAvatar size="xs" :name="`${a.profile.firstName} ${a.profile.lastName}`" :src="a.profile.photoUrl" />
              <div class="flex-1 min-w-0">
                <p class="text-caption font-semibold text-text-primary">
                  {{ a.profile.firstName }} {{ a.profile.lastName }}
                </p>
                <p v-if="a.reason" class="text-caption text-text-secondary italic">
                  "{{ a.reason }}"
                </p>
              </div>
            </li>
          </ul>
        </details>

        <details v-if="attendeesByStatus.attending.length > 0" class="group">
          <summary class="cursor-pointer text-caption text-text-secondary font-medium flex items-center gap-1">
            Ver {{ attendeesByStatus.attending.length }} que asistirán
          </summary>
          <ul class="mt-2 flex flex-wrap gap-1.5">
            <li
              v-for="a in attendeesByStatus.attending"
              :key="a.id"
            >
              <AppAvatar size="xs" :name="`${a.profile.firstName} ${a.profile.lastName}`" :src="a.profile.photoUrl" />
            </li>
          </ul>
        </details>
      </div>

      <div class="h-px bg-divider" />

      <div class="space-y-2.5">
        <div class="flex items-center gap-3 text-small text-text-primary">
          <span class="shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <CalendarIcon class="w-4 h-4 text-text-secondary" />
          </span>
          <span class="capitalize">{{ dateLabel }}</span>
        </div>

        <div class="flex items-center gap-3 text-small text-text-primary">
          <span class="shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <ClockIcon class="w-4 h-4 text-text-secondary" />
          </span>
          <span>{{ timeLabel }}</span>
        </div>

        <div
          v-if="event.location"
          class="flex items-center gap-3 text-small text-text-primary"
        >
          <span class="shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <MapPinIcon class="w-4 h-4 text-text-secondary" />
          </span>
          <span>{{ event.location }}</span>
        </div>

        <div
          v-if="event.priority"
          class="flex items-center gap-3 text-small text-text-primary"
        >
          <span class="shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <CalendarIcon class="w-4 h-4 text-text-secondary" />
          </span>
          <span class="inline-flex items-center gap-1.5">
            Prioridad:
            <span
              class="inline-flex items-center gap-1 px-2.5 h-6 rounded-pill text-caption font-semibold text-white"
              :style="{ backgroundColor: event.priority.color }"
            >
              {{ event.priority.name }}
            </span>
          </span>
        </div>

        <div
          v-if="event.maxCapacity"
          class="flex items-center gap-3 text-small text-text-primary"
        >
          <span class="shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <UserGroupIcon class="w-4 h-4 text-text-secondary" />
          </span>
          <span>Capacidad: {{ event.maxCapacity }} cupos</span>
        </div>

        <div
          v-if="event.description"
          class="flex items-start gap-3 text-small text-text-primary"
        >
          <span class="shrink-0 w-8 h-8 rounded-lg bg-background flex items-center justify-center">
            <CalendarIcon class="w-4 h-4 text-text-secondary" />
          </span>
          <p class="flex-1 whitespace-pre-wrap">{{ event.description }}</p>
        </div>
      </div>

      <div v-if="canEditOrDelete" class="flex items-center gap-2 pt-2 border-t border-divider">
        <AppButton variant="primary" class="flex-1" @click="onEdit">
          <template #icon-left>
            <PencilSquareIcon class="w-4 h-4" />
          </template>
          Editar
        </AppButton>
        <AppButton variant="danger" class="flex-1" @click="onDelete">
          <template #icon-left>
            <TrashIcon class="w-4 h-4" />
          </template>
          Eliminar
        </AppButton>
      </div>
    </div>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-title font-semibold">Detalle del evento</h2>
        <button
          class="w-9 h-9 -mr-2 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
          aria-label="Cerrar"
          @click="emit('close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </template>
  </AppModal>
</template>
