import { useQuery } from '@tanstack/vue-query'
import { homeService } from '@modules/home/services/home.service'

export function useFeaturedDocuments() {
  return useQuery({
    queryKey: ['home', 'featured-documents'],
    queryFn: () => homeService.getFeaturedDocuments(),
    staleTime: 1000 * 60 * 30,
  })
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['home', 'upcoming-events'],
    queryFn: () => homeService.getUpcomingEvents(),
    staleTime: 1000 * 60,
  })
}

export function useLatestPosts() {
  return useQuery({
    queryKey: ['home', 'latest-posts'],
    queryFn: () => homeService.getLatestPosts(),
    staleTime: 1000 * 60,
  })
}
