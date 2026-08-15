import { supabase } from '~supabase/client'
import dayjs from '@utils/dayjs'
import type { FeaturedDocument, LatestPost, UpcomingEvent } from '@modules/home/types/home.types'

export const homeService = {
  async getFeaturedDocuments(): Promise<FeaturedDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, description, category_id, thumbnail')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6)
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      thumbnail: row.thumbnail,
    }))
  },

  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
    const todayStart = dayjs().startOf('day').toISOString()
    const { data, error } = await supabase
      .from('planner_events')
      .select('id, title, description, start_date, end_date, type, status, source')
      .gte('start_date', todayStart)
      .in('status', ['pending', 'in_progress'])
      .neq('type', 'workshop')
      .order('start_date', { ascending: true })
      .limit(3)
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.start_date,
      endDate: row.end_date,
      type: row.type as UpcomingEvent['type'],
      status: row.status as UpcomingEvent['status'],
    }))
  },

  async getLatestPosts(): Promise<LatestPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('id, author_id, content, image, likes_count, comments_count, visibility, created_at')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(3)
    if (error) throw error

    const authorIds = [...new Set((data ?? []).map((r) => r.author_id))]
    let profileMap = new Map<string, { first_name: string; last_name: string; photo_url: string | null }>()
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, photo_url')
        .in('user_id', authorIds)
      for (const p of profiles ?? []) {
        profileMap.set(p.user_id, p)
      }
    }

    return (data ?? []).map((row) => {
      const author = profileMap.get(row.author_id)
      return {
        id: row.id,
        authorId: row.author_id,
        content: row.content,
        image: row.image,
        likesCount: row.likes_count,
        commentsCount: row.comments_count,
        createdAt: row.created_at,
        author: {
          firstName: author?.first_name ?? 'Embajadora',
          lastName: author?.last_name ?? '',
          photoUrl: author?.photo_url ?? null,
        },
      }
    })
  },
}
