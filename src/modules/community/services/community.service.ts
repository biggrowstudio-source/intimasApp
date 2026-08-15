import { supabase } from '~supabase/client'
import type { CommunityComment, CommunityPost, CreatePostInput } from '@modules/community/types/community.types'

interface ProfileRecord {
  user_id: string
  first_name: string
  last_name: string
  photo_url: string | null
  role: string | null
}

const profileCache = new Map<string, ProfileRecord>()

async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileRecord>> {
  const missing = userIds.filter((id) => !profileCache.has(id))
  if (missing.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, photo_url, role')
      .in('user_id', missing)
    for (const row of data ?? []) {
      profileCache.set(row.user_id, row)
    }
  }
  const map = new Map<string, ProfileRecord>()
  for (const id of userIds) {
    const p = profileCache.get(id)
    if (p) map.set(id, p)
  }
  return map
}

function getAuthor(authorId: string, profileMap: Map<string, ProfileRecord>) {
  const p = profileMap.get(authorId)
  return {
    id: authorId,
    firstName: p?.first_name ?? 'Embajadora',
    lastName: p?.last_name ?? '',
    photoUrl: p?.photo_url ?? null,
    role: p?.role ?? null,
  }
}


async function getUserIds() {
  const { data: user } = await supabase.auth.getUser()
  return { userId: user.user?.id ?? null }
}

async function getLikedIds(postIds: string[], userId: string): Promise<Set<string>> {
  if (postIds.length === 0) return new Set()
  const { data: likes } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds)
  return new Set((likes ?? []).map((l) => l.post_id))
}

async function getSavedIds(postIds: string[], userId: string): Promise<Set<string>> {
  if (postIds.length === 0) return new Set()
  try {
    const { data: saves } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)
    return new Set((saves ?? []).map((s) => s.post_id))
  } catch {
    return new Set()
  }
}

export const communityService = {
  async listPosts(page = 0, pageSize = 20): Promise<CommunityPost[]> {
    const { userId } = await getUserIds()

    const { data, error } = await supabase
      .from('posts')
      .select('id, author_id, content, mood, image, video, likes_count, comments_count, visibility, created_at')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)

    if (error) throw error

    const postIds = (data ?? []).map((p) => p.id)
    const authorIds = [...new Set((data ?? []).map((p) => p.author_id))]
    const profileMap = await fetchProfiles(authorIds)
    const likedIds = userId ? await getLikedIds(postIds, userId) : new Set<string>()
    const savedIds = userId ? await getSavedIds(postIds, userId) : new Set<string>()

    return (data ?? []).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      content: row.content,
      mood: row.mood,
      image: row.image,
      video: row.video,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      visibility: row.visibility as CommunityPost['visibility'],
      createdAt: row.created_at,
      author: getAuthor(row.author_id, profileMap),
      likedByMe: likedIds.has(row.id),
      savedByMe: savedIds.has(row.id),
    }))
  },

  async listMyPosts(page = 0, pageSize = 20): Promise<CommunityPost[]> {
    const { userId } = await getUserIds()
    if (!userId) return []

    const { data, error } = await supabase
      .from('posts')
      .select('id, author_id, content, mood, image, video, likes_count, comments_count, visibility, created_at')
      .eq('author_id', userId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)

    if (error) throw error

    const postIds = (data ?? []).map((p) => p.id)
    const authorIds = [...new Set((data ?? []).map((p) => p.author_id))]
    const profileMap = await fetchProfiles(authorIds)
    const likedIds = await getLikedIds(postIds, userId)
    const savedIds = await getSavedIds(postIds, userId)

    return (data ?? []).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      content: row.content,
      mood: row.mood,
      image: row.image,
      video: row.video,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      visibility: row.visibility as CommunityPost['visibility'],
      createdAt: row.created_at,
      author: getAuthor(row.author_id, profileMap),
      likedByMe: likedIds.has(row.id),
      savedByMe: savedIds.has(row.id),
    }))
  },

  async createPost(input: CreatePostInput): Promise<CommunityPost> {
    const { userId } = await getUserIds()
    if (!userId) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: userId,
        content: input.content,
        mood: input.mood ?? null,
        visibility: input.visibility ?? 'ambassadors',
      })
      .select('id, author_id, content, mood, image, video, likes_count, comments_count, visibility, created_at')
      .single()
    if (error) throw error

    const authorIds = [data.author_id]
    const profileMap = await fetchProfiles(authorIds)

    return {
      id: data.id,
      authorId: data.author_id,
      content: data.content,
      mood: data.mood,
      image: data.image,
      video: data.video,
      likesCount: data.likes_count,
      commentsCount: data.comments_count,
      visibility: data.visibility as CommunityPost['visibility'],
      createdAt: data.created_at,
      author: getAuthor(data.author_id, profileMap),
      likedByMe: false,
      savedByMe: false,
    }
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) throw error
  },

  async toggleLike(postId: string, isLiked: boolean): Promise<void> {
    const { userId } = await getUserIds()
    if (!userId) throw new Error('No autenticado')

    if (isLiked) {
      const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
      if (error) throw error
    }
  },

  async toggleSave(postId: string, isSaved: boolean): Promise<void> {
    const { userId } = await getUserIds()
    if (!userId) throw new Error('No autenticado')

    try {
      if (isSaved) {
        await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId })
      }
    } catch {
      // saved_posts table may not exist yet (migration not applied)
    }
  },

  async listComments(postId: string): Promise<CommunityComment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, author_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const authorIds = [...new Set((data ?? []).map((r) => r.author_id))]
    const profileMap = await fetchProfiles(authorIds)

    return (data ?? []).map((row) => {
      const p = profileMap.get(row.author_id)
      return {
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        content: row.content,
        createdAt: row.created_at,
        author: {
          firstName: p?.first_name ?? 'Embajadora',
          lastName: p?.last_name ?? '',
          photoUrl: p?.photo_url ?? null,
        },
      }
    })
  },

  async createComment(postId: string, content: string): Promise<CommunityComment> {
    const { userId } = await getUserIds()
    if (!userId) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: userId, content })
      .select('id, post_id, author_id, content, created_at')
      .single()
    if (error) throw error

    const profileMap = await fetchProfiles([data.author_id])
    const p = profileMap.get(data.author_id)
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      content: data.content,
      createdAt: data.created_at,
      author: {
        firstName: p?.first_name ?? 'Embajadora',
        lastName: p?.last_name ?? '',
        photoUrl: p?.photo_url ?? null,
      },
    }
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw error
  },

  subscribeToPosts(handler: (post: CommunityPost) => void) {
    const channel = supabase
      .channel('community_posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data } = await supabase
            .from('posts')
            .select('id, author_id, content, mood, image, video, likes_count, comments_count, visibility, created_at')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            const profileMap = await fetchProfiles([data.author_id])
            handler({
              id: data.id,
              authorId: data.author_id,
              content: data.content,
              mood: data.mood,
              image: data.image,
              video: data.video,
              likesCount: data.likes_count,
              commentsCount: data.comments_count,
              visibility: data.visibility as CommunityPost['visibility'],
              createdAt: data.created_at,
              author: getAuthor(data.author_id, profileMap),
              likedByMe: false,
              savedByMe: false,
            })
          }
        },
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  },

  subscribeToComments(postId: string, handler: (comment: CommunityComment) => void) {
    const channel = supabase
      .channel(`comments_${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const { data } = await supabase
            .from('comments')
            .select('id, post_id, author_id, content, created_at')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            const profileMap = await fetchProfiles([data.author_id])
            const p = profileMap.get(data.author_id)
            handler({
              id: data.id,
              postId: data.post_id,
              authorId: data.author_id,
              content: data.content,
              createdAt: data.created_at,
              author: {
                firstName: p?.first_name ?? 'Embajadora',
                lastName: p?.last_name ?? '',
                photoUrl: p?.photo_url ?? null,
              },
            })
          }
        },
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  },
}
