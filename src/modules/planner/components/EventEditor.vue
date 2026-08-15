<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { LinkIcon, XMarkIcon, MapPinIcon, UsersIcon, VideoCameraIcon } from '@heroicons/vue/24/outline'
import dayjs from '@utils/dayjs'
import type {
  EventPriority,
  PlannerEvent,
  PlannerEventInput,
  PlannerModality,
} from '@modules/planner/types/planner.types'
import { usePriorities } from '@modules/planner/composables/usePlanner'
import { eventSchema } from '@modules/planner/validators/planner.schema'

const props = withDefaults(defineProps<{
  embedded?: boolean
  eventToEdit?: PlannerEvent | null
  defaultSource?: 'admin' | 'personal'
}>(), {
  embedded: false,
  eventToEdit: null,
  defaultSource: 'personal',
})

const emit = defineEmits<{
  submit: [input: PlannerEventInput]
  update: [id: string, input: PlannerEventInput]
  close: []
}>()

const { data: priorities } = usePriorities()

const form = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  type: 'meeting' as PlannerEventInput['type'],
  status: 'pending' as PlannerEventInput['status'],
  priorityId: '' as string,
  link: '',
  modality: '' as '' | PlannerModality,
  location: '',
  maxCapacity: '' as '' | number,
})
const errors = ref<Record<string, string>>({})

const isEditMode = ref(!!props.eventToEdit)
const isAdminEvent = computed(() => {
  if (isEditMode.value && props.eventToEdit) {
    return props.eventToEdit.source === 'admin'
  }
  return props.defaultSource === 'admin'
})

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return dayjs(iso).format('YYYY-MM-DDTHH:mm')
}

function fillFormFromEvent(ev: PlannerEvent) {
  form.title = ev.title
  form.description = ev.description ?? ''
  form.startDate = isoToLocalInput(ev.startDate)
  form.endDate = isoToLocalInput(ev.endDate)
  form.type = ev.type
  form.status = ev.status
  form.priorityId = ev.priorityId ?? ''
  form.link = ev.link ?? ''
  form.modality = ev.modality ?? ''
  form.location = ev.location ?? ''
  form.maxCapacity = ev.maxCapacity ?? ''
  errors.value = {}
}

function getDefaultPriorityId() {
  const mid = priorities.value?.find((p: EventPriority) => p.name === 'Media')
  return mid?.id ?? priorities.value?.[1]?.id ?? ''
}

function reset() {
  form.title = ''
  form.description = ''
  form.startDate = ''
  form.endDate = ''
  form.type = isAdminEvent.value ? 'meeting' : 'personal'
  form.status = 'pending'
  form.priorityId = getDefaultPriorityId()
  form.link = ''
  form.modality = ''
  form.location = ''
  form.maxCapacity = ''
  errors.value = {}
}

watch(
  () => props.eventToEdit,
  (newEvent) => {
    if (newEvent) {
      fillFormFromEvent(newEvent)
      isEditMode.value = true
    } else {
      reset()
      isEditMode.value = false
    }
  },
  { immediate: true },
)

function toUtcIso(localDateTime: string): string {
  if (!localDateTime) return ''
  const d = new Date(localDateTime)
  if (Number.isNaN(d.getTime())) return localDateTime
  return d.toISOString()
}

function close() {
  emit('close')
  reset()
}

function submit() {
  const result = eventSchema.safeParse({
    title: form.title,
    description: form.description || null,
    startDate: form.startDate,
    type: form.type,
    status: form.status,
    link: form.link || null,
  })
  if (!result.success) {
    errors.value = Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
    return
  }

  const data: PlannerEventInput = {
    title: result.data.title,
    description: result.data.description ?? null,
    startDate: toUtcIso(result.data.startDate),
    endDate: toUtcIso(form.endDate) || null,
    type: result.data.type,
    status: result.data.status,
    priorityId: form.priorityId || null,
    link: result.data.link ?? null,
  }

  if (isAdminEvent.value) {
    data.source = 'admin'
    data.modality = (form.modality || null) as PlannerModality | null
    data.location = form.location || null
    data.maxCapacity = form.maxCapacity === '' ? null : Number(form.maxCapacity)
  }

  if (isEditMode.value && props.eventToEdit) {
    emit('update', props.eventToEdit.id, data)
  } else {
    emit('submit', data)
  }
  reset()
}
</script>

<template>
  <form
    :class="[
      'space-y-4',
      embedded ? '' : 'p-4 rounded-xl bg-surface shadow-elevation1 border border-secondary-100',
    ]"
    @submit.prevent="submit"
  >
    <div v-if="!embedded" class="flex items-center justify-between">
      <h3 class="text-title font-semibold">
        {{ isEditMode ? 'Editar evento' : (isAdminEvent ? 'Nuevo evento administrativo' : 'Nuevo evento personal') }}
      </h3>
      <button
        type="button"
        class="w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
        aria-label="Cerrar"
        @click="close"
      >
        <XMarkIcon class="w-5 h-5" />
      </button>
    </div>

    <AppInput v-model="form.title" label="Título" placeholder="Reunión con equipo" :error="errors.title" required />
    <AppTextarea v-model="form.description" label="Descripción (opcional)" :rows="2" :error="errors.description" />

    <div class="grid grid-cols-2 gap-3">
      <AppInput v-model="form.startDate" type="datetime-local" label="Inicio" :error="errors.startDate" required />
      <AppInput v-model="form.endDate" type="datetime-local" label="Fin (opcional)" />
    </div>

    <AppInput
      v-model="form.link"
      type="url"
      label="Enlace de la reunión (opcional)"
      placeholder="https://meet.google.com/abc-defg-hij"
      :error="errors.link"
    >
      <template #iconLeft>
        <LinkIcon class="w-4 h-4" />
      </template>
    </AppInput>

    <div class="grid grid-cols-3 gap-3">
      <AppSelect
        v-model="form.priorityId"
        label="Prioridad"
        :options="(priorities ?? []).map((p) => ({ label: p.name, value: p.id }))"
      />
      <AppSelect
        v-model="form.type"
        label="Tipo"
        :options="[
          { label: 'Personal', value: 'personal' },
          { label: 'Capacitación', value: 'workshop' },
          { label: 'Reunión', value: 'meeting' },
          { label: 'Recordatorio', value: 'reminder' },
        ]"
      />
      <AppSelect
        v-model="form.status"
        label="Estado"
        :options="[
          { label: 'Pendiente', value: 'pending' },
          { label: 'En progreso', value: 'in_progress' },
          { label: 'Completado', value: 'completed' },
          { label: 'Cancelado', value: 'cancelled' },
        ]"
      />
    </div>

    <div v-if="isAdminEvent" class="space-y-3 pt-2 border-t border-divider">
      <p class="text-caption font-semibold text-text-secondary uppercase tracking-wide">
        Configuración del evento
      </p>

      <div class="grid grid-cols-2 gap-3">
        <AppSelect
          v-model="form.modality"
          label="Modalidad"
          placeholder="Selecciona"
          :options="[
            { label: 'Presencial', value: 'presencial' },
            { label: 'Online', value: 'online' },
          ]"
        />
        <AppInput
          v-model.number="form.maxCapacity"
          type="number"
          label="Capacidad (opcional)"
          placeholder="Sin límite"
          min="1"
        />
      </div>

      <AppInput
        v-if="form.modality === 'presencial'"
        v-model="form.location"
        label="Ubicación"
        placeholder="Av. Reforma 123, CDMX"
      >
        <template #iconLeft>
          <MapPinIcon class="w-4 h-4" />
        </template>
      </AppInput>

      <p
        v-if="form.modality === 'online' && !form.link"
        class="text-caption text-text-secondary"
      >
        💡 Añade el enlace arriba para que las embajadoras puedan unirse.
      </p>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <AppButton variant="ghost" type="button" @click="close">Cancelar</AppButton>
      <AppButton type="submit">{{ isEditMode ? 'Guardar cambios' : 'Crear evento' }}</AppButton>
    </div>
  </form>
</template>
