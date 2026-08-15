<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import dayjs from '@utils/dayjs'
import { CalendarIcon, MapPinIcon, UsersIcon, CheckIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import { useUiStore } from '@stores/ui.store'
import {
  useMyRegistration,
  useSetRegistration,
} from '@modules/workshops/composables/useWorkshopRegistration'

const props = defineProps<{
  modelValue: boolean
  workshopId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const ui = useUiStore()
const showReasonInput = ref(false)
const reason = ref('')

const idRef = computed(() => props.workshopId ?? '')

const { data: workshop, isLoading } = useQuery({
  queryKey: ['workshop', idRef],
  queryFn: async () => {
    if (!idRef.value) return null
    const { data, error } = await supabase.from('workshops').select('*').eq('id', idRef.value).single()
    if (error) throw error
    return data
  },
  enabled: computed(() => !!idRef.value),
})

const myRegistration = useMyRegistration(idRef)
const setRegistration = useSetRegistration()

const showCancelInput = ref(false)
const cancelReason = ref('')

const myStatus = computed(() => myRegistration.data.value?.status ?? null)

// Watch workshopId to reset states and refetch myRegistration
watch(idRef, (newId) => {
  showReasonInput.value = false
  reason.value = ''
  showCancelInput.value = false
  cancelReason.value = ''
  if (newId) {
    myRegistration.refetch()
  }
})

function onAttend() {
  if (!idRef.value) return
  setRegistration.mutate({ workshopId: idRef.value, status: 'registered' })
  ui.pushToast({ title: 'Asistiré al workshop', variant: 'success' })
}

function onNotAttend() {
  showReasonInput.value = !showReasonInput.value
}

function onConfirmNotAttend() {
  if (!idRef.value) return
  if (!reason.value.trim()) {
    ui.pushToast({ title: 'Cuéntanos por qué no podrás asistir', variant: 'warning' })
    return
  }
  setRegistration.mutate({ workshopId: idRef.value, status: 'cancelled', reason: reason.value })
  ui.pushToast({ title: 'Has confirmado que no asistirás', variant: 'info' })
  showReasonInput.value = false
  reason.value = ''
}

function onRemove() {
  // Mostrar formulario de cancelación con nota (mismo flujo que "No asistiré")
  showCancelInput.value = true
  cancelReason.value = ''
}

function onConfirmCancel() {
  if (!idRef.value) return
  setRegistration.mutate({
    workshopId: idRef.value,
    status: 'cancelled',
    reason: cancelReason.value.trim() || undefined,
  })
  ui.pushToast({ title: 'Asistencia cancelada', variant: 'info' })
  showCancelInput.value = false
  cancelReason.value = ''
}

function onCancelFormClose() {
  showCancelInput.value = false
  cancelReason.value = ''
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="isLoading" class="py-8 space-y-4">
      <AppSkeleton height="200px" />
      <AppSkeleton height="32px" width="60%" />
      <AppSkeleton height="80px" />
    </div>

    <div v-else-if="workshop" class="space-y-6">
      <img
        v-if="workshop.image"
        :src="workshop.image"
        :alt="workshop.title"
        class="w-full h-56 object-cover rounded-lg"
      />

      <div>
        <h2 class="text-h2 font-editorial text-primary mb-3">{{ workshop.title }}</h2>
        <div class="flex flex-wrap gap-4 mb-6 text-small text-text-secondary">
          <span class="inline-flex items-center gap-2">
            <CalendarIcon class="w-5 h-5" />
            {{ dayjs(workshop.date).format('dddd D [de] MMMM, HH:mm') }}
          </span>
          <span v-if="workshop.location" class="inline-flex items-center gap-2">
            <MapPinIcon class="w-5 h-5" />
            {{ workshop.location }}
          </span>
          <span class="inline-flex items-center gap-2">
            <UsersIcon class="w-5 h-5" />
            {{ workshop.capacity }} cupos
          </span>
        </div>
        <p v-if="workshop.description" class="text-body text-text-primary whitespace-pre-wrap leading-relaxed">
          {{ workshop.description }}
        </p>
      </div>

      <!-- Sección de asistencia: ocultar botones si ya confirmó -->
      <div class="rounded-xl bg-secondary-50 p-4 space-y-3">
        <p class="text-caption font-semibold text-text-secondary uppercase tracking-wide">Tu asistencia</p>

        <!-- Sin registro: mostrar botones de Asistiré / No asistiré -->
        <template v-if="!myStatus">
          <div class="grid grid-cols-2 gap-2">
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
                showReasonInput ? 'bg-error text-white' : 'bg-error/15 text-error hover:bg-error hover:text-white',
              ]"
              @click="onNotAttend"
            >
              <XCircleIcon class="w-5 h-5" />
              No asistiré
            </button>
          </div>

          <div v-if="showReasonInput" class="space-y-2">
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
        </template>

        <!-- Ya confirmó asistencia: solo mostrar estado + enlace, sin botones -->
        <div v-else-if="myStatus === 'registered'" class="space-y-3">
          <!-- Confirmación amigable -->
          <div class="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
            <div class="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
              <CheckIcon class="w-5 h-5 text-success" />
            </div>
            <div>
              <p class="font-semibold text-success text-small">¡Asistiré a este evento!</p>
              <p class="text-caption text-text-secondary mt-0.5">Tu asistencia está confirmada.</p>
            </div>
          </div>

          <!-- Enlace al taller si hay URL -->
          <a
            v-if="workshop.category && (workshop.category.startsWith('http://') || workshop.category.startsWith('https://'))"
            :href="workshop.category"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full h-11 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Ingresar al Taller</span>
          </a>

          <!-- Botón de retroceder / cancelar -->
          <div v-if="!showCancelInput">
            <button
              type="button"
              class="w-full h-9 rounded-xl border border-divider text-caption text-text-secondary hover:text-error hover:border-error/40 hover:bg-error/5 font-medium transition-all active:scale-[0.98]"
              @click="onRemove"
            >
              Cancelar mi asistencia
            </button>
          </div>

          <!-- Formulario de razón al cancelar -->
          <div v-else class="space-y-2">
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

        <!-- Canceló: mostrar estado con opción de cambiar -->
        <div v-else-if="myStatus === 'cancelled'" class="p-3 rounded-lg bg-error/10 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <XCircleIcon class="w-5 h-5 text-error" />
              <span class="text-small font-medium text-error">No asistirás</span>
            </div>
            <button
              v-if="!showCancelInput"
              class="text-caption text-text-secondary hover:text-accent"
              @click="setRegistration.mutate({ workshopId: idRef, status: 'registered' }); ui.pushToast({ title: 'Asistencia restaurada', variant: 'success' })"
            >Cambiar a Asistiré</button>
          </div>
          <p v-if="myRegistration.data.value?.reason" class="text-caption text-text-secondary mt-1.5 pl-7 italic">
            "{{ myRegistration.data.value.reason }}"
          </p>
        </div>
      </div>
    </div>
  </AppModal>
</template>
