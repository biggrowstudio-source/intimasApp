<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from '@utils/dayjs'
import { useEvents } from '@modules/planner/composables/usePlanner'
import { useUiStore } from '@stores/ui.store'
import type { PlannerEvent, PlannerEventType } from '@modules/planner/types/planner.types'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const ui = useUiStore()

const currentDate = ref(dayjs())
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

const monthRange = computed(() => ({
  from: currentDate.value.startOf('month').toISOString(),
  to: currentDate.value.endOf('month').toISOString(),
}))

const { data: events } = useEvents(monthRange)

const monthLabel = computed(() => currentDate.value.format('MMMM YYYY'))
const today = computed(() => dayjs().format('YYYY-MM-DD'))

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface DayCell {
  iso: string | null
  day: number | null
  isToday: boolean
  isSelected: boolean
  isCurrentMonth: boolean
  eventCount: number
  events: PlannerEvent[]
}

const weeks = computed<DayCell[][]>(() => {
  const start = currentDate.value.startOf('month')
  const end = currentDate.value.endOf('month')
  const startWeekday = (start.day() + 6) % 7
  const totalDays = end.date()

  const cells: DayCell[] = []

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ iso: null, day: null, isToday: false, isSelected: false, isCurrentMonth: false, eventCount: 0, events: [] })
  }

  for (let d = 1; d <= totalDays; d++) {
    const dDate = start.date(d)
    const iso = dDate.format('YYYY-MM-DD')
    const dayEvents = events.value?.filter((e) => dayjs(e.startDate).format('YYYY-MM-DD') === iso) ?? []
    cells.push({
      iso,
      day: d,
      isToday: dDate.isSame(dayjs(), 'day'),
      isSelected: iso === selectedDate.value,
      isCurrentMonth: true,
      eventCount: dayEvents.length,
      events: dayEvents,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, day: null, isToday: false, isSelected: false, isCurrentMonth: false, eventCount: 0, events: [] })
  }

  const grouped: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7))
  return grouped
})

const selectedDayEvents = computed(() => {
  if (!events.value) return []
  return events.value
    .filter((e) => dayjs(e.startDate).format('YYYY-MM-DD') === selectedDate.value)
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
})

const allEventsSorted = computed(() => {
  if (!events.value) return []
  return [...events.value].sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
})

const typeDot: Record<PlannerEventType, string> = {
  workshop: 'bg-accent',
  meeting: 'bg-success',
  reminder: 'bg-warning',
  personal: 'bg-text-secondary',
}

const typeBg: Record<PlannerEventType, string> = {
  workshop: 'bg-blush',
  meeting: 'bg-mint',
  reminder: 'bg-sage',
  personal: 'bg-secondary-100',
}

const typeLabel: Record<PlannerEventType, string> = {
  workshop: 'Workshop',
  meeting: 'Reunión',
  reminder: 'Recordatorio',
  personal: 'Personal',
}

function previousMonth() {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

function nextMonth() {
  currentDate.value = currentDate.value.add(1, 'month')
}

function goToToday() {
  currentDate.value = dayjs()
  selectedDate.value = dayjs().format('YYYY-MM-DD')
}

function selectDay(iso: string | null) {
  if (iso) selectedDate.value = iso
}

function close() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'home' })
}

async function deleteEvent(id: string) {
  if (!confirm('¿Eliminar este evento?')) return
  try {
    const { supabase } = await import('~supabase/client')
    const { error } = await supabase.from('planner_events').delete().eq('id', id)
    if (error) throw error
    ui.pushToast({ title: 'Evento eliminado', variant: 'info' })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}
</script>

<template>
  <div class="fixed inset-0 z-40 bg-background flex flex-col">
    <header class="flex items-center justify-between gap-3 p-3 safe-top shrink-0">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <button
          class="w-10 h-10 rounded-pill bg-surface shadow-elevation1 flex items-center justify-center shrink-0"
          aria-label="Mes anterior"
          @click="previousMonth"
        >
          <ChevronLeftIcon class="w-5 h-5 text-text-primary" />
        </button>

        <h1 class="text-h3 font-editorial text-text-primary capitalize flex-1 text-center truncate">
          {{ monthLabel }}
        </h1>

        <button
          class="w-10 h-10 rounded-pill bg-surface shadow-elevation1 flex items-center justify-center shrink-0"
          aria-label="Mes siguiente"
          @click="nextMonth"
        >
          <ChevronRightIcon class="w-5 h-5 text-text-primary" />
        </button>
      </div>

      <button
        class="w-10 h-10 rounded-pill flex items-center justify-center text-text-secondary hover:bg-surface shrink-0"
        aria-label="Cerrar"
        @click="close"
      >
        <XMarkIcon class="w-6 h-6" />
      </button>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div class="px-3 pb-6 max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-caption text-text-secondary">
              <span class="w-2 h-2 rounded-pill bg-accent" />
              Workshop
            </span>
            <span class="inline-flex items-center gap-1.5 text-caption text-text-secondary">
              <span class="w-2 h-2 rounded-pill bg-success" />
              Reunión
            </span>
            <span class="inline-flex items-center gap-1.5 text-caption text-text-secondary">
              <span class="w-2 h-2 rounded-pill bg-warning" />
              Recordatorio
            </span>
          </div>
          <button
            class="text-caption text-accent font-semibold hover:underline"
            @click="goToToday"
          >
            Hoy
          </button>
        </div>

        <div class="rounded-2xl bg-surface shadow-elevation1 overflow-hidden">
          <div class="grid grid-cols-7 px-2 pt-3 pb-1">
            <div
              v-for="(label, i) in weekdayLabels"
              :key="i"
              class="text-center text-caption font-semibold text-text-secondary uppercase tracking-wide"
            >
              {{ label }}
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1 px-2 pb-2">
            <button
              v-for="(cell, i) in weeks.flat()"
              :key="i"
              type="button"
              :disabled="!cell.iso"
              :aria-label="cell.iso ? `Seleccionar ${cell.iso}` : undefined"
              class="relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all"
              :class="
                !cell.iso
                  ? 'cursor-default'
                  : cell.isSelected
                  ? 'bg-accent text-white'
                  : cell.isToday
                  ? 'bg-accent-50 ring-2 ring-accent'
                  : 'hover:bg-background'
              "
              @click="selectDay(cell.iso)"
            >
              <span
                v-if="cell.day"
                :class="[
                  'text-small font-semibold leading-none',
                  cell.isSelected
                    ? 'text-white'
                    : cell.isToday
                    ? 'text-accent-500 font-bold'
                    : 'text-text-primary',
                ]"
              >
                {{ cell.day }}
              </span>

              <span
                v-if="cell.eventCount > 0 && !cell.isSelected"
                class="absolute bottom-1.5 flex gap-0.5"
                aria-hidden="true"
              >
                <span
                  v-for="ev in cell.events.slice(0, 3)"
                  :key="ev.id"
                  class="w-1.5 h-1.5 rounded-pill"
                  :class="typeDot[ev.type]"
                />
              </span>
            </button>
          </div>
        </div>

        <section v-if="selectedDayEvents.length > 0" class="mt-5">
          <h2 class="text-title font-semibold mb-3 px-1">
            Eventos del {{ dayjs(selectedDate).format('D [de] MMMM') }}
          </h2>
          <div class="space-y-2.5">
            <article
              v-for="ev in selectedDayEvents"
              :key="ev.id"
              :class="['flex items-center gap-3 p-3 rounded-xl shadow-elevation1', typeBg[ev.type]]"
            >
              <div class="shrink-0 flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-lg bg-white/60">
                <span class="text-small font-bold text-text-primary leading-none">
                  {{ dayjs(ev.startDate).format('HH:mm') }}
                </span>
              </div>
              <div class="flex-1 min-w-0 border-l border-divider pl-3">
                <h3 class="text-small font-semibold text-text-primary leading-snug line-clamp-1">
                  {{ ev.title }}
                </h3>
                <p class="text-caption text-text-secondary mt-0.5 inline-flex items-center gap-1">
                  <ClockIcon class="w-3 h-3" />
                  {{ typeLabel[ev.type] }}
                </p>
              </div>
              <button
                class="text-caption text-error font-medium px-2 py-1 hover:bg-white/40 rounded-pill"
                @click="deleteEvent(ev.id)"
              >
                Eliminar
              </button>
            </article>
          </div>
        </section>

        <section v-if="allEventsSorted.length > 0" class="mt-6">
          <h2 class="text-title font-semibold mb-3 px-1">
            Todos los eventos del mes
          </h2>
          <div class="space-y-2.5">
            <article
              v-for="ev in allEventsSorted"
              :key="ev.id"
              class="flex items-center gap-3 p-3 rounded-xl bg-surface shadow-elevation1"
            >
              <div class="shrink-0 flex flex-col items-center justify-center min-w-[44px] py-1.5 px-2 rounded-lg bg-background">
                <span class="text-caption text-text-secondary font-semibold uppercase leading-none">
                  {{ dayjs(ev.startDate).format('MMM') }}
                </span>
                <span class="text-title font-bold text-text-primary leading-none mt-0.5">
                  {{ dayjs(ev.startDate).format('D') }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-small font-semibold text-text-primary leading-snug line-clamp-1">
                  {{ ev.title }}
                </h3>
                <p class="text-caption text-text-secondary mt-0.5 inline-flex items-center gap-1.5">
                  <span :class="['w-1.5 h-1.5 rounded-pill', typeDot[ev.type]]" />
                  {{ typeLabel[ev.type] }} · {{ dayjs(ev.startDate).format('HH:mm') }}
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
