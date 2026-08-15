export interface FeaturedDocument {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  thumbnail: string | null
}

export type PlannerEventType = 'personal' | 'workshop' | 'meeting' | 'reminder'

export interface UpcomingEvent {
  id: string
  title: string
  description: string | null
  date: string
  endDate: string | null
  type: PlannerEventType
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export interface LatestPost {
  id: string
  authorId: string
  content: string
  image: string | null
  likesCount: number
  commentsCount: number
  createdAt: string
  author: {
    firstName: string
    lastName: string
    photoUrl: string | null
  }
}

export interface Announcement {
  id: string
  title: string
  body: string
  createdAt: string
}
