<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from '@utils/dayjs'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import AppMonthPicker from '@modules/planner/components/AppMonthPicker.vue'

type ViewMode = 'month' | 'week' | 'agenda'

const props = defineProps<{
  selectedDate: string
  viewMode: ViewMode
}>()

const emit = defineEmits<{
  'update:selectedDate': [value: string]
  'update:viewMode': [value: ViewMode]
}>()

const monthLabel = computed(() => dayjs(props.selectedDate).format('MMMM YYYY'))

const weekDays = computed(() => {
  const date = dayjs(props.selectedDate)
  const startOfWeek = date.startOf('week')
  return Array.from({ length: 7 }, (_, i) => {
    const d = startOfWeek.add(i, 'day')
    return {
      iso: d.format('YYYY-MM-DD'),
      weekday: d.format('ddd').replace('.', '').toUpperCase(),
      day: d.format('D'),
      isToday: d.isSame(dayjs(), 'day'),
      hasEvents: false,
    }
  })
})

const pickerOpen = ref(false)

function isSelectedDay(iso: string) {
  return dayjs(props.selectedDate).format('YYYY-MM-DD') === iso
}

function selectDay(iso: string) {
  emit('update:selectedDate', iso)
}

function previousWeek() {
  const newDate = dayjs(props.selectedDate).subtract(7, 'day').format('YYYY-MM-DD')
  emit('update:selectedDate', newDate)
}

function nextWeek() {
  const newDate = dayjs(props.selectedDate).add(7, 'day').format('YYYY-MM-DD')
  emit('update:selectedDate', newDate)
}

function onMonthSelect(date: string) {
  emit('update:selectedDate', date)
  pickerOpen.value = false
}

const viewOptions: { label: string; value: ViewMode }[] = [
  { label: 'Mes', value: 'month' },
  { label: 'Semana', value: 'week' },
  { label: 'Agenda', value: 'agenda' },
]
</script>

<template>
  <div class="rounded-3xl bg-surface border border-divider/60 shadow-elevation1 p-4 sm:p-5 space-y-4">
    <!-- BARRA SUPERIOR: MES Y SEGMENTADO DE VISTAS -->
    <div class="flex items-center justify-between gap-2">
      <!-- Selector de Mes estilo dropdown sutil -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-body sm:text-subtitle font-extrabold text-text-primary hover:text-accent transition-colors capitalize px-1 py-1 rounded-xl"
        @click="pickerOpen = true"
      >
        <span>{{ monthLabel }}</span>
        <ChevronDownIcon class="w-4 h-4 text-text-secondary" />
      </button>

      <!-- Segmentado de Vistas: Mes / Semana / Agenda -->
      <div class="flex items-center p-1 rounded-full bg-background border border-divider/40 gap-0.5">
        <button
          v-for="opt in viewOptions"
          :key="opt.value"
          type="button"
          class="px-3 py-1 rounded-full text-caption font-bold transition-all"
          :class="
            viewMode === opt.value
              ? 'bg-accent-50 text-accent shadow-2xs'
              : 'text-text-secondary hover:text-text-primary'
          "
          @click="emit('update:viewMode', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- TIRA DE DÍAS DE LA SEMANA -->
    <div class="relative flex items-center gap-1">
      <!-- Flecha Semana Anterior -->
      <button
        type="button"
        class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
        aria-label="Semana anterior"
        @click="previousWeek"
      >
        <ChevronLeftIcon class="w-4 h-4" />
      </button>

      <!-- 7 Columnas de Día -->
      <div class="flex-1 grid grid-cols-7 gap-1">
        <button
          v-for="day in weekDays"
          :key="day.iso"
          type="button"
          class="flex flex-col items-center justify-center gap-1.5 py-1 rounded-2xl transition-all group"
          @click="selectDay(day.iso)"
        >
          <!-- Nombre del día (LUN, MAR, MIÉ, etc.) FUERA de la píldora -->
          <span
            class="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-colors"
            :class="isSelectedDay(day.iso) ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'"
          >
            {{ day.weekday }}
          </span>

          <!-- Número del Día (Píldora roja suave SOLO alrededor del número) -->
          <div
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-caption sm:text-body transition-all"
            :class="
              isSelectedDay(day.iso)
                ? 'bg-accent text-white shadow-xs scale-105'
                : 'text-text-primary hover:bg-background/80'
            "
          >
            {{ day.day }}
          </div>

          <!-- Indicador de Eventos / Hoy debajo del número -->
          <div class="h-1.5 flex items-center justify-center">
            <span
              v-if="day.hasEvents || day.isToday"
              class="w-1.5 h-1.5 rounded-full transition-colors"
              :class="
                isSelectedDay(day.iso)
                  ? 'bg-accent'
                  : day.isToday
                  ? 'bg-accent'
                  : 'bg-mint'
              "
            />
          </div>
        </button>
      </div>

      <!-- Flecha Semana Siguiente -->
      <button
        type="button"
        class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
        aria-label="Semana siguiente"
        @click="nextWeek"
      >
        <ChevronRightIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Modal Selector de Mes -->
    <AppMonthPicker
      v-model="pickerOpen"
      :base-date="selectedDate"
      @select="onMonthSelect"
    />
  </div>
</template>
