import { z } from 'zod'

export const postSchema = z.object({
  content: z.string().min(1, 'Escribe algo').max(2000, 'Máximo 2000 caracteres'),
  mood: z.string().nullable().optional(),
  visibility: z.enum(['public', 'ambassadors', 'private']).default('ambassadors'),
})

export const commentSchema = z.object({
  content: z.string().min(1, 'Escribe un comentario').max(500),
})

export type PostFormValues = z.infer<typeof postSchema>
export type CommentFormValues = z.infer<typeof commentSchema>
