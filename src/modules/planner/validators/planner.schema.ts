import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  description: z.string().max(500).optional().nullable(),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().optional().nullable(),
  type: z.enum(['personal', 'workshop', 'meeting', 'reminder']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  link: z
    .string()
    .trim()
    .url('Debe ser una URL válida (https://...)')
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
})

export const taskSchema = z.object({
  title: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional().nullable(),
})

export type EventFormValues = z.infer<typeof eventSchema>
export type TaskFormValues = z.infer<typeof taskSchema>
