import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import dayjs from '@utils/dayjs'
import { supabase } from '~supabase/client'

export type PlannerEventType = 'personal' | 'workshop' | 'meeting' | 'reminder'

export interface UpcomingEvent {
  id: string
  title: string
  description: string | null
  date: string
  endDate: string | null
  type: PlannerEventType
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export function useUpcomingEvents(userId: MaybeRef<string | undefined>) {
  const idRef = computed(() => unref(userId))
  return useQuery({
    queryKey: computed(() => ['home', 'planner-events', idRef.value]),
    queryFn: async () => {
      if (!idRef.value) return []
      const todayStart = dayjs().startOf('day').toISOString()
      const { data, error } = await supabase
        .from('planner_events')
        .select('id, title, description, start_date, end_date, type, status')
        .eq('user_id', idRef.value)
        .gte('start_date', todayStart)
        .in('status', ['pending', 'in_progress'])
        .order('start_date', { ascending: true })
        .limit(3)
      if (error) throw error
      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.start_date,
        endDate: row.end_date,
        type: row.type as PlannerEventType,
        status: row.status as UpcomingEvent['status'],
      }))
    },
    enabled: computed(() => !!idRef.value),
    staleTime: 1000 * 30,
  })
}
