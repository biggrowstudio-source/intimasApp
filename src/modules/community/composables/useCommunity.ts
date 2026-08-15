import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref, computed, onUnmounted } from 'vue'
import { communityService } from '@modules/community/services/community.service'
import type { CreatePostInput } from '@modules/community/types/community.types'

export const COMMUNITY_QUERY_KEYS = {
  posts: ['community', 'posts'] as const,
  myPosts: ['community', 'my-posts'] as const,
  comments: (postId: string) => ['community', 'comments', postId] as const,
}

export function usePosts() {
  return useQuery({
    queryKey: COMMUNITY_QUERY_KEYS.posts,
    queryFn: () => communityService.listPosts(),
    staleTime: 1000 * 60,
  })
}

export function useMyPosts() {
  return useQuery({
    queryKey: COMMUNITY_QUERY_KEYS.myPosts,
    queryFn: () => communityService.listMyPosts(),
    staleTime: 1000 * 60,
  })
}

export function useComments(postId: Ref<string>) {
  return useQuery({
    queryKey: computed(() => COMMUNITY_QUERY_KEYS.comments(postId.value)),
    queryFn: () => communityService.listComments(postId.value),
    enabled: computed(() => !!postId.value),
    staleTime: 1000 * 60,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePostInput) => communityService.createPost(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => communityService.deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    },
  })
}

export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      communityService.toggleLike(postId, isLiked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    },
  })
}

export function useToggleSave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, isSaved }: { postId: string; isSaved: boolean }) =>
      communityService.toggleSave(postId, isSaved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => communityService.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'comments'] })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    },
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      communityService.createComment(postId, content),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.comments(vars.postId) })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    },
  })
}

export function useCommunityRealtime() {
  const qc = useQueryClient()
  const unsubscribe = ref<(() => void) | null>(null)

  function subscribe() {
    const off = communityService.subscribeToPosts(() => {
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.posts })
      qc.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.myPosts })
    })
    unsubscribe.value = off
  }

  function cleanup() {
    if (unsubscribe.value) {
      unsubscribe.value()
      unsubscribe.value = null
    }
  }

  onUnmounted(cleanup)

  return { subscribe, cleanup }
}
