import { type Ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'

export interface WorkshopRegistration {
  id: string
  workshopId: string
  userId: string
  status: 'registered' | 'cancelled'
  reason: string | null
}

export function useMyRegistration(workshopId: Ref<string> | string) {
  return useQuery({
    queryKey: ['workshop', workshopId, 'my-registration'],
    queryFn: async () => {
      const id = typeof workshopId === 'string' ? workshopId : workshopId.value
      if (!id) return null
      const { data } = await supabase
        .from('workshop_registrations')
        .select('id, workshop_id, user_id, status, reason')
        .eq('workshop_id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle()
      if (!data) return null
      return {
        id: data.id,
        workshopId: data.workshop_id,
        userId: data.user_id,
        status: data.status as 'registered' | 'cancelled',
        reason: data.reason,
      } as WorkshopRegistration
    },
    enabled: typeof workshopId === 'string' ? !!workshopId : () => !!workshopId.value,
  })
}

export function useSetRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      workshopId,
      status,
      reason,
    }: {
      workshopId: string
      status: 'registered' | 'cancelled'
      reason?: string
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('workshop_registrations')
        .select('id')
        .eq('workshop_id', workshopId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('workshop_registrations')
          .update({ status, reason: reason ?? null })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workshop_registrations')
          .insert({ workshop_id: workshopId, user_id: userId, status, reason: reason ?? null })
        if (error) throw error
      }

      // Obtener nombre de la embajadora
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .maybeSingle()
      const ambassadorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Una embajadora'

      // Obtener nombre del workshop
      const { data: workshop } = await supabase
        .from('workshops')
        .select('title, date')
        .eq('id', workshopId)
        .maybeSingle()
      const workshopTitle = (workshop as any)?.title || 'un workshop'
      const workshopDate = (workshop as any)?.date
        ? new Date((workshop as any).date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
        : ''

      const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      const isAttending = status === 'registered'

      // Notificar a todos los admins
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .in('role', ['admin', 'super_admin'])

        if (admins && admins.length > 0) {
          const notifTitle = isAttending
            ? `${ambassadorName} asistirá al workshop`
            : `${ambassadorName} no asistirá al workshop`
          const notifBody = isAttending
            ? `${ambassadorName} ha confirmado su asistencia al workshop "${workshopTitle}"${workshopDate ? ` (${workshopDate})` : ''}. Respondió a las ${hora}.`
            : `${ambassadorName} no podrá asistir al workshop "${workshopTitle}"${workshopDate ? ` (${workshopDate})` : ''}.${reason ? ` Motivo: ${reason}` : ''} Respondió a las ${hora}.`

          await supabase.from('notifications').insert(
            admins.map((adm: any) => ({
              user_id: adm.user_id,
              type: 'workshop',
              title: notifTitle,
              body: notifBody,
              data: { link: `/admin/workshops/${workshopId}`, workshopId, ambassadorId: userId },
            }))
          )
        }
      } catch (err) {
        console.error('Error al notificar admins:', err)
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['workshop', vars.workshopId, 'my-registration'] })
      qc.invalidateQueries({ queryKey: ['workshop', vars.workshopId] })
      qc.invalidateQueries({ queryKey: ['admin', 'workshop-logs'] })
      qc.invalidateQueries({ queryKey: ['workshops'] })
      qc.invalidateQueries({ queryKey: ['planner', 'events'] })
      qc.invalidateQueries({ queryKey: ['home', 'planner-events'] })
    },
  })
}

export function useRemoveRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (workshopId: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('workshop_registrations')
        .delete()
        .eq('workshop_id', workshopId)
        .eq('user_id', userId)
      if (error) throw error

      // Obtener nombre de la embajadora
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .maybeSingle()
      const ambassadorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Una embajadora'

      const { data: workshop } = await supabase
        .from('workshops')
        .select('title')
        .eq('id', workshopId)
        .maybeSingle()
      const workshopTitle = (workshop as any)?.title || 'un workshop'
      const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .in('role', ['admin', 'super_admin'])

        if (admins && admins.length > 0) {
          await supabase.from('notifications').insert(
            admins.map((adm: any) => ({
              user_id: adm.user_id,
              type: 'workshop',
              title: `${ambassadorName} canceló su asistencia al workshop`,
              body: `${ambassadorName} ha eliminado su inscripción al workshop "${workshopTitle}". A las ${hora}.`,
              data: { link: `/admin/workshops/${workshopId}`, workshopId, ambassadorId: userId },
            }))
          )
        }
      } catch (err) {
        console.error('Error al notificar admins de cancelación:', err)
      }
    },
    onSuccess: (_data, workshopId) => {
      qc.invalidateQueries({ queryKey: ['workshop', workshopId, 'my-registration'] })
      qc.invalidateQueries({ queryKey: ['workshop', workshopId] })
      qc.invalidateQueries({ queryKey: ['admin', 'workshop-logs'] })
      qc.invalidateQueries({ queryKey: ['workshops'] })
      qc.invalidateQueries({ queryKey: ['planner', 'events'] })
      qc.invalidateQueries({ queryKey: ['home', 'planner-events'] })
    },
  })
}

