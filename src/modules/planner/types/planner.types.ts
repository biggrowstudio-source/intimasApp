export type PlannerEventType = 'personal' | 'workshop' | 'meeting' | 'reminder'
export type PlannerEventSource = 'admin' | 'personal'
export type PlannerModality = 'presencial' | 'online'
export type PlannerStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type AttendanceStatus = 'attending' | 'not_attending'

export interface EventPriority {
  id: string
  name: string
  color: string
  level: number
}

export interface PlannerEvent {
  id: string
  userId: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  type: PlannerEventType
  status: PlannerStatus
  priorityId: string | null
  priority: EventPriority | null
  color: string | null
  link: string | null
  source: PlannerEventSource
  modality: PlannerModality | null
  location: string | null
  maxCapacity: number | null
  attendees?: { id: string; name: string; avatarUrl: string | null }[]
  attendeesCount?: number
  myAttendanceStatus?: 'attending' | 'not_attending' | null
}

export interface Task {
  id: string
  userId: string
  title: string
  completed: boolean
  priority: TaskPriority
  dueDate: string | null
}

export interface PlannerEventInput {
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  type?: PlannerEventType
  status?: PlannerStatus
  priorityId?: string | null
  color?: string | null
  link?: string | null
  source?: PlannerEventSource
  modality?: PlannerModality | null
  location?: string | null
  maxCapacity?: number | null
}

export interface EventAttendee {
  id: string
  eventId: string
  userId: string
  status: AttendanceStatus
  reason: string | null
  createdAt: string
  updatedAt: string
}

export interface EventAttendeeWithProfile extends EventAttendee {
  profile: {
    firstName: string
    lastName: string
    photoUrl: string | null
  }
}
