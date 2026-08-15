<script setup lang="ts">
import { computed } from 'vue'
import dayjs from '@utils/dayjs'
import { ChevronDownIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/vue/24/outline'
import type { PlannerEvent } from '@modules/planner/types/planner.types'

const props = defineProps<{
  events: PlannerEvent[]
  selectedDate: string
  baseDate: string
}>()

const emit = defineEmits<{
  'update:selectedDate': [value: string]
}>()

interface DayCell {
  iso: string | null
  day: number | null
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  eventCount: number
}

const monthLabel = computed(() => dayjs(props.baseDate).format('MMMM YYYY'))

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const weeks = computed<DayCell[][]>(() => {
  const base = dayjs(props.baseDate)
  const start = base.startOf('month')
  const end = base.endOf('month')
  const startWeekday = (start.day() + 6) % 7
  const totalDays = end.date()

  const cells: DayCell[] = []

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ iso: null, day: null, isCurrentMonth: false, isToday: false, isSelected: false, eventCount: 0 })
  }

  for (let d = 1; d <= totalDays; d++) {
    const dDate = start.date(d)
    const iso = dDate.format('YYYY-MM-DD')
    const isToday = dDate.isSame(dayjs(), 'day')
    const isSelected = iso === props.selectedDate
    const eventCount = props.events.filter((e) => dayjs(e.startDate).format('YYYY-MM-DD') === iso).length
    cells.push({ iso, day: d, isCurrentMonth: true, isToday, isSelected, eventCount })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, day: null, isCurrentMonth: false, isToday: false, isSelected: false, eventCount: 0 })
  }

  const grouped: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7))
  return grouped
})

const selectedDayEvents = computed(() => {
  return props.events
    .filter((e) => dayjs(e.startDate).format('YYYY-MM-DD') === props.selectedDate)
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
})

function selectDay(iso: string | null) {
  if (!iso) return
  emit('update:selectedDate', iso)
}

const typeBg: Record<string, string> = {
  workshop: 'bg-blush',
  reminder: 'bg-sage',
  meeting: 'bg-mint',
  personal: 'bg-secondary-100',
}
</script>

<template>
  <section>
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

      <div class="grid grid-cols-7 gap-0.5 px-2 pb-2">
        <button
          v-for="(cell, i) in weeks.flat()"
          :key="i"
          type="button"
          :disabled="!cell.iso"
          :aria-label="cell.iso ? `Seleccionar ${cell.iso}` : undefined"
          class="relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all"
          :class="
            !cell.iso
              ? 'cursor-default'
              : cell.isSelected
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
                ? 'text-accent-500'
                : cell.isToday
                ? 'text-accent-500 font-bold'
                : 'text-text-primary',
            ]"
          >
            {{ cell.day }}
          </span>

          <span
            v-if="cell.isToday && !cell.isSelected"
            class="absolute bottom-1 w-1 h-1 rounded-pill bg-accent"
            aria-hidden="true"
          />

          <span
            v-if="cell.eventCount > 0"
            class="absolute bottom-1.5 flex gap-0.5"
            aria-hidden="true"
          >
            <span
              v-for="i in Math.min(cell.eventCount, 3)"
              :key="i"
              :class="[
                'w-1 h-1 rounded-pill',
                cell.isSelected ? 'bg-accent' : 'bg-success',
              ]"
            />
          </span>
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-[600px]"
      leave-from-class="opacity-100 translate-y-0 max-h-[600px]"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <div
        v-if="selectedDayEvents.length > 0"
        class="overflow-hidden"
      >
        <div class="mt-4 space-y-2.5">
          <h3 class="text-title font-semibold text-text-primary px-1">
            Eventos del {{ dayjs(selectedDate).format('D [de] MMMM') }}
          </h3>
          <article
            v-for="event in selectedDayEvents"
            :key="event.id"
            class="flex items-center gap-3 p-3 rounded-xl bg-surface shadow-elevation1"
          >
            <div
              :class="[
                'shrink-0 flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-lg',
                typeBg[event.type] ?? 'bg-secondary-100',
              ]"
            >
              <span class="text-caption font-bold text-text-primary leading-none">
                {{ dayjs(event.startDate).format('HH:mm') }}
              </span>
            </div>
            <div class="flex-1 min-w-0 border-l border-divider pl-3">
              <h4 class="text-small font-semibold text-text-primary leading-snug line-clamp-1">
                {{ event.title }}
              </h4>
              <p
                v-if="event.description"
                class="text-caption text-text-secondary mt-0.5 line-clamp-1"
              >
                {{ event.description }}
              </p>
              <p
                v-else-if="event.endDate"
                class="text-caption text-text-secondary mt-0.5 inline-flex items-center gap-1"
              >
                <ClockIcon class="w-3 h-3" />
                {{ dayjs(event.startDate).format('HH:mm') }} – {{ dayjs(event.endDate).format('HH:mm') }}
              </p>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="overflow-hidden">
        <div class="mt-4 p-5 rounded-xl bg-surface shadow-elevation1 text-center">
          <CalendarIcon class="w-10 h-10 mx-auto text-text-secondary opacity-40 mb-2" />
          <p class="text-small font-semibold text-text-primary">Día libre</p>
          <p class="text-caption text-text-secondary mt-1">
            No tienes eventos el {{ dayjs(selectedDate).format('D [de] MMMM') }}.
          </p>
        </div>
      </div>
    </Transition>
  </section>
</template>
