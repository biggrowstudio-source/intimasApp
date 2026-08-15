import { supabase } from '~supabase/client'
import type {
  EventPriority,
  PlannerEvent,
  PlannerEventInput,
  Task,
  TaskInput,
} from '@modules/planner/types/planner.types'

const priorityCache = new Map<string, { id: string; name: string; color: string; level: number }>()

async function fetchPriorities() {
  if (priorityCache.size > 0) return
  const { data } = await supabase.from('event_priorities').select('id, name, color, level')
  for (const p of data ?? []) {
    priorityCache.set(p.id, p)
  }
}

function mapEvent(row: Record<string, unknown>): PlannerEvent {
  const pid = row.priority_id as string | null
  const p = pid ? priorityCache.get(pid) ?? null : null
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: row.description as string | null,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    type: row.type as PlannerEvent['type'],
    status: row.status as PlannerEvent['status'],
    priorityId: pid,
    priority: p ? { id: p.id, name: p.name, color: p.color, level: p.level } : null,
    color: row.color as string | null,
    link: row.link as string | null,
    source: row.source as PlannerEvent['source'],
    modality: row.modality as PlannerEvent['modality'] | null,
    location: row.location as string | null,
    maxCapacity: row.max_capacity as number | null,
  }
}

function mapTask(row: {
  id: string
  user_id: string
  title: string
  completed: boolean
  priority: Task['priority']
  due_date: string | null
}): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    completed: row.completed,
    priority: row.priority,
    dueDate: row.due_date,
  }
}

async function getUserId() {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('No autenticado')
  return id
}

export const plannerService = {
  async listEvents(range?: { from?: string; to?: string; source?: 'admin' | 'personal' | 'all' }): Promise<PlannerEvent[]> {
    const userId = await getUserId()
    await fetchPriorities()
    let query = supabase
      .from('planner_events')
      .select('*')
      .order('start_date', { ascending: true })

    if (range?.source === 'admin') {
      query = query.eq('source', 'admin')
    } else if (range?.source === 'personal') {
      query = query.eq('source', 'personal').eq('user_id', userId)
    } else {
      query = query.or(`source.eq.admin,user_id.eq.${userId}`)
    }

    if (range?.from) query = query.gte('start_date', range.from)
    if (range?.to) query = query.lte('start_date', range.to)

    const { data, error } = await query
    if (error) throw error
    const mappedEvents = (data ?? []).map(mapEvent)

    // Cargar TODOS los workshops activos para que aparezcan automáticamente en la agenda de la embajadora
    const { data: allWorkshops } = await supabase
      .from('workshops')
      .select('*')
      .neq('status', 'cancelled')

    // Cargar las inscripciones de todas las embajadoras para los workshops
    const { data: allWorkshopRegs } = await supabase
      .from('workshop_registrations')
      .select(`
        workshop_id,
        user_id,
        status,
        profiles:user_id (id, full_name, first_name, last_name, avatar_url, photo_url)
      `)
      .neq('status', 'cancelled')

    const workshopAttendeesMap: Record<string, { id: string; name: string; avatarUrl: string | null }[]> = {}
    const userRegisteredWorkshopIds = new Set<string>()

    if (allWorkshopRegs) {
      for (const reg of allWorkshopRegs as any[]) {
        const wid = reg.workshop_id
        if (reg.user_id === userId) {
          userRegisteredWorkshopIds.add(wid)
        }
        if (!workshopAttendeesMap[wid]) workshopAttendeesMap[wid] = []
        const prof = Array.isArray(reg.profiles) ? reg.profiles[0] : reg.profiles
        if (prof) {
          const name = prof.full_name || `${prof.first_name || 'Embajadora'} ${prof.last_name || ''}`.trim()
          const avatarUrl = prof.avatar_url || prof.photo_url || null
          workshopAttendeesMap[wid].push({ id: prof.id || reg.user_id, name, avatarUrl })
        }
      }
    }

    const workshopEvents: PlannerEvent[] = []
    if (allWorkshops) {
      for (const w of allWorkshops) {
        if (range?.from && new Date(w.date).getTime() < new Date(range.from).getTime()) continue
        if (range?.to && new Date(w.date).getTime() > new Date(range.to).getTime()) continue

        const isUserInscrita = userRegisteredWorkshopIds.has(w.id)
        const attendees = workshopAttendeesMap[w.id] || []

        workshopEvents.push({
          id: `workshop-${w.id}`,
          userId: userId,
          title: `Capacitación: ${w.title}`,
          description: isUserInscrita ? '¡Estás inscrita en esta capacitación!' : (w.description || 'Workshop oficial disponible'),
          startDate: w.date,
          endDate: w.date,
          type: 'workshop',
          status: isUserInscrita ? 'completed' : 'pending',
          priorityId: null,
          priority: { id: 'p-workshop', name: isUserInscrita ? 'Inscrita' : 'Oficial', color: '#EC4899', level: 3 },
          color: '#EC4899',
          link: `/full/workshop/${w.id}`,
          source: 'admin',
          modality: 'online',
          location: w.location || 'Plataforma Úntimas',
          maxCapacity: w.capacity || null,
          attendees,
          attendeesCount: attendees.length,
          myAttendanceStatus: isUserInscrita ? 'attending' : null,
        })
      }
    }

    // Consultar estado de asistencia propio y asistentes reales para eventos de planner
    const { data: myEventAtts } = await supabase
      .from('event_attendees')
      .select('event_id, status')
      .eq('user_id', userId)

    const myAttMap: Record<string, 'attending' | 'not_attending'> = {}
    if (myEventAtts) {
      for (const a of myEventAtts) {
        myAttMap[a.event_id] = a.status as 'attending' | 'not_attending'
      }
    }

    const plannerEventIds = mappedEvents.map((e) => e.id).filter(Boolean)
    if (plannerEventIds.length > 0) {
      const { data: eAtts } = await supabase
        .from('event_attendees')
        .select(`
          event_id,
          user_id,
          profiles:user_id (id, full_name, first_name, last_name, avatar_url, photo_url)
        `)
        .in('event_id', plannerEventIds)
        .eq('status', 'attending')

      if (eAtts) {
        const eMap: Record<string, { id: string; name: string; avatarUrl: string | null }[]> = {}
        for (const att of eAtts as any[]) {
          const eid = att.event_id
          if (!eMap[eid]) eMap[eid] = []
          const prof = Array.isArray(att.profiles) ? att.profiles[0] : att.profiles
          if (prof) {
            const name = prof.full_name || `${prof.first_name || 'Embajadora'} ${prof.last_name || ''}`.trim()
            const avatarUrl = prof.avatar_url || prof.photo_url || null
            eMap[eid].push({ id: prof.id || att.user_id, name, avatarUrl })
          }
        }
        for (const ev of mappedEvents) {
          if (eMap[ev.id]) {
            ev.attendees = eMap[ev.id]
            ev.attendeesCount = eMap[ev.id].length
          }
          if (myAttMap[ev.id]) {
            ev.myAttendanceStatus = myAttMap[ev.id]
          }
        }
      }
    }

    const allEventsMap = new Map<string, PlannerEvent>()
    for (const ev of mappedEvents) {
      allEventsMap.set(ev.id, ev)
    }
    for (const ev of workshopEvents) {
      allEventsMap.set(ev.id, ev)
    }

    return Array.from(allEventsMap.values()).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
  },




  async getEvent(id: string): Promise<PlannerEvent | null> {
    await fetchPriorities()
    const { data, error } = await supabase
      .from('planner_events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? mapEvent(data) : null
  },

  async createEvent(input: PlannerEventInput): Promise<PlannerEvent> {
    const userId = await getUserId()
    await fetchPriorities()

    const { data: defaultPriority } = await supabase
      .from('event_priorities')
      .select('id')
      .eq('name', 'Media')
      .maybeSingle()

    const { data, error } = await supabase
      .from('planner_events')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        start_date: input.startDate,
        end_date: input.endDate ?? null,
        type: input.type ?? 'personal',
        status: input.status ?? 'pending',
        priority_id: input.priorityId ?? defaultPriority?.id ?? null,
        color: input.color ?? null,
        link: input.link ?? null,
        source: input.source ?? 'personal',
        modality: input.modality ?? null,
        location: input.location ?? null,
        max_capacity: input.maxCapacity ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return mapEvent(data)
  },

  async updateEvent(id: string, input: Partial<PlannerEventInput>): Promise<PlannerEvent> {
    await fetchPriorities()
    const updates: Record<string, unknown> = {}
    if (input.title !== undefined) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.startDate !== undefined) updates.start_date = input.startDate
    if (input.endDate !== undefined) updates.end_date = input.endDate
    if (input.type !== undefined) updates.type = input.type
    if (input.status !== undefined) updates.status = input.status
    if (input.priorityId !== undefined) updates.priority_id = input.priorityId
    if (input.color !== undefined) updates.color = input.color
    if (input.link !== undefined) updates.link = input.link
    if (input.modality !== undefined) updates.modality = input.modality
    if (input.location !== undefined) updates.location = input.location
    if (input.maxCapacity !== undefined) updates.max_capacity = input.maxCapacity

    const { data, error } = await supabase
      .from('planner_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapEvent(data)
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('planner_events').delete().eq('id', id)
    if (error) throw error
  },

  async listTasks(): Promise<Task[]> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapTask)
  },

  async createTask(input: TaskInput): Promise<Task> {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: input.title,
        priority: input.priority ?? 'medium',
        due_date: input.dueDate ?? null,
        completed: false,
      })
      .select()
      .single()
    if (error) throw error
    return mapTask(data)
  },

  async listPriorities(): Promise<EventPriority[]> {
    await fetchPriorities()
    return [...priorityCache.values()].sort((a, b) => b.level - a.level)
  },

  async toggleTask(id: string, completed: boolean): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapTask(data)
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },
}
