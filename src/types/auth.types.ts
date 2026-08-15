export type UserRole = 'ambassador' | 'moderator' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  userId: string
  firstName: string
  lastName: string
  photoUrl?: string | null
  city?: string | null
  birthday?: string | null
  bio?: string | null
  role: UserRole
  points?: number
  levelId?: string | null
  is_suspended?: boolean
  isSuspended?: boolean
  createdAt: string
  updatedAt: string
}


export interface SessionUser {
  id: string
  email: string
  profile?: Profile | null
}
