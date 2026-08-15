import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref, computed, type Ref } from 'vue'
import { libraryService } from '@modules/library/services/library.service'

export function useCategories() {
  return useQuery({
    queryKey: ['library', 'categories'],
    queryFn: () => libraryService.listCategories(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useDocuments(
  filters: Ref<{ search: string; categoryIds: string[] }>,
) {
  return useQuery({
    queryKey: computed(() => ['library', 'documents', filters.value]),
    queryFn: () => {
      const f = filters.value ?? { search: '', categoryIds: [] }
      return libraryService.listDocuments({
        search: f.search || undefined,
        categoryIds: f.categoryIds?.length ? f.categoryIds : undefined,
      })
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['library', 'favorites'],
    queryFn: () => libraryService.listFavoriteIds(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, isFavorite }: { documentId: string; isFavorite: boolean }) =>
      libraryService.toggleFavorite(documentId, isFavorite),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library', 'favorites'] }),
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title: string
      description?: string | null
      content?: string | null
      categoryId?: string | null
      categorySlug?: string | null
      file?: File | null
      thumbnail?: File | null
      isFeatured?: boolean
      link?: string | null
      sku?: string | null
      price?: number | null
      color?: string | null
      size?: string | null
    }) =>
      libraryService.uploadDocument(input.file ?? null, {
        title: input.title,
        description: input.description,
        content: input.content,
        categoryId: input.categoryId,
        categorySlug: input.categorySlug ?? input.categoryId,
        isFeatured: input.isFeatured,
        thumbnail: input.thumbnail,
        link: input.link,
        sku: input.sku,
        price: input.price,
        color: input.color,
        size: input.size,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      qc.invalidateQueries({ queryKey: ['home', 'featured-documents'] })
    },
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      documentId: string
      title: string
      description?: string | null
      content?: string | null
      categoryId?: string | null
      categorySlug?: string | null
      file?: File | null
      thumbnail?: File | null
      isFeatured?: boolean
      link?: string | null
      sku?: string | null
      price?: number | null
      color?: string | null
      size?: string | null
    }) =>
      libraryService.updateDocument(
        input.documentId,
        {
          title: input.title,
          description: input.description,
          content: input.content,
          categoryId: input.categoryId,
          categorySlug: input.categorySlug ?? input.categoryId,
          isFeatured: input.isFeatured,
          link: input.link,
          sku: input.sku,
          price: input.price,
          color: input.color,
          size: input.size,
        },
        input.file ?? null,
        input.thumbnail ?? null,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
      qc.invalidateQueries({ queryKey: ['home', 'featured-documents'] })
    },
  })
}

export function useDocumentFilters() {
  const search = ref('')
  const categoryIds = ref<string[]>([])
  return { search, categoryIds }
}
