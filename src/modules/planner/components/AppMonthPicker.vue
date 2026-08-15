<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from '@utils/dayjs'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: boolean
  baseDate: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [date: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const viewYear = ref(dayjs(props.baseDate).year())
const viewMonth = ref(dayjs(props.baseDate).month() + 1)

watch(
  () => props.baseDate,
  (newDate) => {
    viewYear.value = dayjs(newDate).year()
    viewMonth.value = dayjs(newDate).month() + 1
  },
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      viewYear.value = dayjs(props.baseDate).year()
      viewMonth.value = dayjs(props.baseDate).month() + 1
    }
  },
)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const currentYear = dayjs().year()

function previousYear() {
  viewYear.value--
}

function nextYear() {
  viewYear.value++
}

function selectMonth(month: number) {
  const newDate = dayjs()
    .year(viewYear.value)
    .month(month - 1)
    .date(1)
    .format('YYYY-MM-DD')
  emit('select', newDate)
  isOpen.value = false
}

function selectToday() {
  emit('select', dayjs().format('YYYY-MM-DD'))
  isOpen.value = false
}

function close() {
  isOpen.value = false
}
</script>

<template>
  <AppModal :model-value="isOpen" size="sm" @update:model-value="(v: boolean) => (isOpen = v)">
    <div class="space-y-5">
      <header class="flex items-center justify-between">
        <button
          type="button"
          class="w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
          aria-label="Año anterior"
          @click="previousYear"
        >
          <ChevronLeftIcon class="w-5 h-5" />
        </button>
        <span class="text-h3 font-editorial text-text-primary">{{ viewYear }}</span>
        <button
          type="button"
          class="w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
          aria-label="Año siguiente"
          @click="nextYear"
        >
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </header>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="(name, i) in monthNames"
          :key="i"
          type="button"
          :class="[
            'h-12 px-2 rounded-xl text-small font-semibold transition-all active:scale-95',
            viewMonth === i + 1 && viewYear === currentYear
              ? 'bg-accent text-white shadow-elevation1'
              : viewMonth === i + 1
              ? 'bg-blush text-accent-500'
              : 'bg-background text-text-primary hover:bg-secondary-100',
          ]"
          @click="selectMonth(i + 1)"
        >
          {{ name }}
        </button>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-divider">
        <button
          type="button"
          class="text-small text-accent font-semibold hover:underline"
          @click="selectToday"
        >
          Ir a hoy
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 px-3 h-9 rounded-pill bg-background text-text-secondary text-small font-medium hover:bg-secondary-100"
          @click="close"
        >
          <XMarkIcon class="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-title font-semibold">Seleccionar mes</h2>
        <button
          class="w-9 h-9 -mr-2 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
          aria-label="Cerrar"
          @click="close"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </template>
  </AppModal>
</template>
