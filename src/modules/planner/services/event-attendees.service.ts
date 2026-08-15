import { supabase } from '~supabase/client'
import type {
  EventAttendee,
  EventAttendeeWithProfile,
  AttendanceStatus,
} from '@modules/planner/types/planner.types'

type Row = {
  id: string
  event_id: string
  user_id: string
  status: AttendanceStatus
  reason: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: Row): EventAttendee {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const eventAttendeesService = {
  async setAttendance(
    eventId: string,
    status: AttendanceStatus,
    reason: string | null = null,
  ): Promise<EventAttendee> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) throw new Error('No autenticado')

    // Obtener nombre de la embajadora
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()

    const ambassadorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Una embajadora'

    const now = new Date()
    const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

    if (eventId.startsWith('workshop-')) {
      const rawId = eventId.replace('workshop-', '')
      const regStatus = status === 'attending' ? 'registered' : 'cancelled'

      const { data, error } = await supabase
        .from('workshop_registrations')
        .upsert(
          {
            workshop_id: rawId,
            user_id: userId,
            status: regStatus,
          },
          { onConflict: 'workshop_id,user_id' }
        )
        .select()
        .single()

      if (error) throw error

      // Obtener nombre del workshop
      const { data: workshopData } = await supabase
        .from('workshops')
        .select('title, date')
        .eq('id', rawId)
        .maybeSingle()

      const workshopTitle = (workshopData as any)?.title || 'un workshop'
      const workshopDate = (workshopData as any)?.date
        ? new Date((workshopData as any).date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
        : ''

      // Notificar a todos los admins
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .in('role', ['admin', 'super_admin'])

        if (admins && admins.length > 0) {
          const isAttending = status === 'attending'
          const notifTitle = isAttending
            ? `${ambassadorName} asistirá al workshop`
            : `${ambassadorName} no asistirá al workshop`
          const notifBody = isAttending
            ? `${ambassadorName} ha confirmado su asistencia al workshop "${workshopTitle}"${workshopDate ? ` (${workshopDate})` : ''}. Respondió a las ${hora}.`
            : `${ambassadorName} no podrá asistir al workshop "${workshopTitle}"${workshopDate ? ` (${workshopDate})` : ''}.${reason ? ` Motivo: ${reason}` : ''} Respondió a las ${hora}.`

          const adminNotifs = admins.map((adm: any) => ({
            user_id: adm.user_id,
            type: 'workshop',
            title: notifTitle,
            body: notifBody,
            data: { link: `/admin/workshops/${rawId}`, workshopId: rawId, ambassadorId: userId },
          }))
          await supabase.from('notifications').insert(adminNotifs)
        }
      } catch (err) {
        console.error('Error al enviar notificación de asistencia a workshop:', err)
      }

      return {
        id: data.id,
        eventId: eventId,
        userId: userId,
        status: status,
        reason: reason ?? null,
        createdAt: data.created_at,
        updatedAt: data.created_at,
      }
    }

    // Evento de planner regular
    const { data, error } = await supabase
      .from('event_attendees')
      .upsert(
        { event_id: eventId, user_id: userId, status, reason },
        { onConflict: 'event_id,user_id' },
      )
      .select()
      .single()
    if (error) throw error

    // Obtener título del evento
    const { data: eventData } = await supabase
      .from('planner_events')
      .select('title, start_date')
      .eq('id', eventId)
      .maybeSingle()

    const eventTitle = (eventData as any)?.title || 'un evento'
    const eventDate = (eventData as any)?.start_date
      ? new Date((eventData as any).start_date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
      : ''

    // Notificar a admins solo si es evento admin (source = 'admin')
    try {
      const { data: eventCheck } = await supabase
        .from('planner_events')
        .select('source')
        .eq('id', eventId)
        .maybeSingle()

      if ((eventCheck as any)?.source === 'admin') {
        const { data: admins } = await supabase
          .from('profiles')
          .select('user_id')
          .in('role', ['admin', 'super_admin'])

        if (admins && admins.length > 0) {
          const isAttending = status === 'attending'
          const notifTitle = isAttending
            ? `${ambassadorName} asistirá al evento`
            : `${ambassadorName} no asistirá al evento`
          const notifBody = isAttending
            ? `${ambassadorName} confirmó asistencia a "${eventTitle}"${eventDate ? ` (${eventDate})` : ''}. Respondió a las ${hora}.`
            : `${ambassadorName} no podrá asistir a "${eventTitle}"${eventDate ? ` (${eventDate})` : ''}.${reason ? ` Motivo: ${reason}` : ''} Respondió a las ${hora}.`

          const adminNotifs = admins.map((adm: any) => ({
            user_id: adm.user_id,
            type: 'event',
            title: notifTitle,
            body: notifBody,
            data: { link: '/planeador', eventId },
          }))
          await supabase.from('notifications').insert(adminNotifs)
        }
      }
    } catch (err) {
      console.error('Error al enviar notificación de asistencia a evento:', err)
    }

    return mapRow(data)
  },


  async getMyAttendance(eventId: string): Promise<EventAttendee | null> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return null

    if (eventId.startsWith('workshop-')) {
      const rawId = eventId.replace('workshop-', '')
      const { data: wReg, error } = await supabase
        .from('workshop_registrations')
        .select('*')
        .eq('workshop_id', rawId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      if (wReg) {
        return {
          id: wReg.id,
          eventId: eventId,
          userId: userId,
          status: wReg.status === 'cancelled' ? 'not_attending' : 'attending',
          reason: wReg.reason ?? null,
          createdAt: wReg.created_at,
          updatedAt: wReg.created_at,
        }
      }
      return null
    }

    const { data, error } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data ? mapRow(data) : null
  },

  async listAttendees(eventId: string): Promise<EventAttendeeWithProfile[]> {
    if (eventId.startsWith('workshop-')) {
      const rawId = eventId.replace('workshop-', '')

      // Fetch registrations first
      const { data: wRegs, error } = await supabase
        .from('workshop_registrations')
        .select('id, user_id, status, reason, created_at')
        .eq('workshop_id', rawId)

      if (error) throw error
      if (!wRegs || wRegs.length === 0) return []

      // Fetch profiles separately for robustness
      const userIds = wRegs.map((r: any) => r.user_id)
      const { data: profileRows, error: profError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, photo_url')
        .in('user_id', userIds)

      if (profError) console.error('[listAttendees] profiles error:', profError)
      console.log('[listAttendees] userIds:', userIds, 'profiles found:', profileRows?.length ?? 0, profileRows)

      const profileMap = new Map<string, any>()
      for (const p of profileRows ?? []) {
        profileMap.set(p.user_id, p)
      }

      const list: EventAttendeeWithProfile[] = []
      for (const reg of wRegs as any[]) {
        const prof = profileMap.get(reg.user_id)
        const status: AttendanceStatus = reg.status === 'cancelled' ? 'not_attending' : 'attending'
        list.push({
          id: reg.id,
          eventId: eventId,
          userId: reg.user_id,
          status,
          reason: reg.reason ?? null,
          createdAt: reg.created_at,
          updatedAt: reg.created_at,
          profile: {
            firstName: prof?.first_name || '',
            lastName: prof?.last_name || '',
            photoUrl: prof?.photo_url || prof?.avatar_url || null,
          },
        })
      }
      return list
    }

    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        *,
        profile:profiles!event_attendees_user_id_fkey(first_name, last_name, photo_url, full_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
      return {
        ...mapRow(row),
        profile: {
          firstName: profile?.first_name || profile?.full_name?.split(' ')[0] || 'Embajadora',
          lastName: profile?.last_name || profile?.full_name?.split(' ').slice(1).join(' ') || '',
          photoUrl: profile?.photo_url || profile?.avatar_url || null,
        },
      }
    })
  },

  async getAttendeesCount(eventId: string): Promise<{ attending: number; not_attending: number }> {
    const list = await this.listAttendees(eventId)
    const counts = { attending: 0, not_attending: 0 }
    for (const row of list) {
      if (row.status === 'attending') counts.attending++
      else if (row.status === 'not_attending') counts.not_attending++
    }
    return counts
  },

  async removeAttendance(eventId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) throw new Error('No autenticado')

    if (eventId.startsWith('workshop-')) {
      const rawId = eventId.replace('workshop-', '')
      const { error } = await supabase
        .from('workshop_registrations')
        .delete()
        .eq('workshop_id', rawId)
        .eq('user_id', userId)

      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) throw error
  },
}
