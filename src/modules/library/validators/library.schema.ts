import { z } from 'zod'

export const documentCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
})

export const documentUploadSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(120),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  isFeatured: z.boolean().optional(),
})

export type DocumentCategoryInput = z.infer<typeof documentCategorySchema>
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>
