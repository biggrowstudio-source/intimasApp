import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { eventAttendeesService } from '@modules/planner/services/event-attendees.service'
import type { AttendanceStatus } from '@modules/planner/types/planner.types'

export const ATTENDANCE_KEYS = {
  my: (eventId: string) => ['event-attendance', 'me', eventId] as const,
  list: (eventId: string) => ['event-attendance', 'list', eventId] as const,
  count: (eventId: string) => ['event-attendance', 'count', eventId] as const,
}

export function useMyAttendance(eventId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ATTENDANCE_KEYS.my(toValue(eventId))),
    queryFn: () => eventAttendeesService.getMyAttendance(toValue(eventId)),
    enabled: computed(() => !!toValue(eventId)),
    staleTime: 0,
  })
}

export function useEventAttendees(eventId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ATTENDANCE_KEYS.list(toValue(eventId))),
    queryFn: () => eventAttendeesService.listAttendees(toValue(eventId)),
    enabled: computed(() => !!toValue(eventId)),
    staleTime: 0,
  })
}

export function useAttendeesCount(eventId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ATTENDANCE_KEYS.count(toValue(eventId))),
    queryFn: () => eventAttendeesService.getAttendeesCount(toValue(eventId)),
    enabled: computed(() => !!toValue(eventId)),
    staleTime: 1000 * 5,
  })
}

export function useSetAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, status, reason }: { eventId: string; status: AttendanceStatus; reason?: string | null }) =>
      eventAttendeesService.setAttendance(eventId, status, reason ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-attendance'] })
      qc.invalidateQueries({ queryKey: ['planner', 'events'] })
      qc.invalidateQueries({ queryKey: ['home', 'planner-events'] })
      qc.invalidateQueries({ queryKey: ['workshops'] })
      qc.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useRemoveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventAttendeesService.removeAttendance(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-attendance'] })
      qc.invalidateQueries({ queryKey: ['planner', 'events'] })
      qc.invalidateQueries({ queryKey: ['home', 'planner-events'] })
      qc.invalidateQueries({ queryKey: ['workshops'] })
      qc.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}
