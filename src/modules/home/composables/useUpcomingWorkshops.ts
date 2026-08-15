import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'

export interface UpcomingWorkshop {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  image: string | null
  capacity: number
  status: 'available' | 'full' | 'finished' | 'cancelled'
}

export function useUpcomingWorkshops() {
  return useQuery({
    queryKey: ['home', 'upcoming-workshops'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('workshops')
        .select('id, title, description, date, location, image, capacity, status')
        .gte('date', now)
        .eq('status', 'available')
        .order('date', { ascending: true })
        .limit(6)
      if (error) throw error
      return (data ?? []) as UpcomingWorkshop[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
