import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { plannerService } from '@modules/planner/services/planner.service'
import type { PlannerEventInput, TaskInput } from '@modules/planner/types/planner.types'

export const PLANNER_QUERY_KEYS = {
  events: ['planner', 'events'] as const,
  tasks: ['planner', 'tasks'] as const,
}

export const HOME_QUERY_KEYS = {
  plannerEvents: 'planner-events',
  plannerTasks: 'planner-tasks',
}

export function useEvents(range?: MaybeRefOrGetter<{ from?: string; to?: string; source?: 'admin' | 'personal' | 'all' }>) {
  return useQuery({
    queryKey: computed(() => [...PLANNER_QUERY_KEYS.events, toValue(range) ?? {}]),
    queryFn: () => plannerService.listEvents(toValue(range)),
    staleTime: 1000 * 30,
  })
}

export function useAdminEvents() {
  return useQuery({
    queryKey: [...PLANNER_QUERY_KEYS.events, { source: 'admin' }],
    queryFn: () => plannerService.listEvents({ source: 'admin' }),
    staleTime: 1000 * 60,
  })
}

export function useTasks() {
  return useQuery({
    queryKey: PLANNER_QUERY_KEYS.tasks,
    queryFn: () => plannerService.listTasks(),
    staleTime: 1000 * 60,
  })
}

function invalidateHomeAndPlanner(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: PLANNER_QUERY_KEYS.events })
  qc.invalidateQueries({ queryKey: ['home', HOME_QUERY_KEYS.plannerEvents] })
  qc.invalidateQueries({ queryKey: ['home', 'upcoming-workshops-v2'] })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PlannerEventInput) => plannerService.createEvent(input),
    onSuccess: () => invalidateHomeAndPlanner(qc),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PlannerEventInput> }) =>
      plannerService.updateEvent(id, input),
    onSuccess: () => invalidateHomeAndPlanner(qc),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => plannerService.deleteEvent(id),
    onSuccess: () => invalidateHomeAndPlanner(qc),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInput) => plannerService.createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANNER_QUERY_KEYS.tasks })
      qc.invalidateQueries({ queryKey: ['home', HOME_QUERY_KEYS.plannerTasks] })
    },
  })
}

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      plannerService.toggleTask(id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANNER_QUERY_KEYS.tasks })
      qc.invalidateQueries({ queryKey: ['home', HOME_QUERY_KEYS.plannerTasks] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => plannerService.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANNER_QUERY_KEYS.tasks })
      qc.invalidateQueries({ queryKey: ['home', HOME_QUERY_KEYS.plannerTasks] })
    },
  })
}

export function usePriorities() {
  return useQuery({
    queryKey: ['planner', 'priorities'],
    queryFn: () => plannerService.listPriorities(),
    staleTime: 1000 * 60 * 10,
  })
}

export function usePlannerView() {
  const view = ref<'agenda' | 'week' | 'month'>('agenda')
  return { view }
}
