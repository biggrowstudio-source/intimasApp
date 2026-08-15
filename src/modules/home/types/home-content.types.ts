export type HomeContentSlot = 'greeting' | 'hero' | 'featured'

export interface HomeContent {
  id: string
  slot: HomeContentSlot
  variant: string
  title: string | null
  subtitle: string | null
  description: string | null
  imageUrl: string | null
  ctaLabel: string | null
  ctaRoute: string | null
  bgClass: string | null
  orderIndex: number
  isActive: boolean
  updatedAt: string
}

export interface HomeContentInput {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  ctaLabel?: string | null
  ctaRoute?: string | null
  bgClass?: string | null
  orderIndex?: number
  isActive?: boolean
}
