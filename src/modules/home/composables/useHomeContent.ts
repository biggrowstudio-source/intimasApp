import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { homeContentService } from '@modules/home/services/home-content.service'
import type {
  HomeContentInput,
  HomeContentSlot,
} from '@modules/home/types/home-content.types'

export const HOME_CONTENT_KEYS = {
  all: ['home-content'] as const,
  bySlot: (slot: HomeContentSlot) => ['home-content', slot] as const,
}

export function useHomeContentBySlot(slot: HomeContentSlot) {
  return useQuery({
    queryKey: HOME_CONTENT_KEYS.bySlot(slot),
    queryFn: () => homeContentService.listBySlot(slot),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAllHomeContent() {
  return useQuery({
    queryKey: HOME_CONTENT_KEYS.all,
    queryFn: () => homeContentService.listAll(),
    staleTime: 1000 * 60,
  })
}

export function useUpdateHomeContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: HomeContentInput }) =>
      homeContentService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOME_CONTENT_KEYS.all })
    },
  })
}

export function useCreateHomeContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: HomeContentInput & { slot: HomeContentSlot; variant?: string }) =>
      homeContentService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOME_CONTENT_KEYS.all })
    },
  })
}

export function useDeleteHomeContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => homeContentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOME_CONTENT_KEYS.all })
    },
  })
}

export function useUploadHomeImage() {
  return useMutation({
    mutationFn: (file: File) => homeContentService.uploadImage(file),
  })
}
