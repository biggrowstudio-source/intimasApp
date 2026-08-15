export interface CommunityPost {
  id: string
  authorId: string
  content: string
  mood: string | null
  image: string | null
  video: string | null
  likesCount: number
  commentsCount: number
  visibility: 'public' | 'ambassadors' | 'private'
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    photoUrl: string | null
    role?: string | null
  }

  likedByMe: boolean
  savedByMe: boolean
}

export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: string
  author: {
    firstName: string
    lastName: string
    photoUrl: string | null
  }
}

export interface CreatePostInput {
  content: string
  mood?: string | null
  visibility?: 'public' | 'ambassadors' | 'private'
}
