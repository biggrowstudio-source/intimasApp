import { supabase } from '~supabase/client'
import type { Profile } from '@/types/auth.types'
import { uploadAvatarFile } from '../avatar-upload.service'

export const authService = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id: data.id,
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      photoUrl: data.photo_url,
      city: data.city,
      birthday: data.birthday,
      bio: data.bio,
      role: data.role,
      points: data.points,
      levelId: data.level_id,
      is_suspended: !!data.is_suspended,
      isSuspended: !!data.is_suspended,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

  },

  async updateProfile(profileId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        photo_url: updates.photoUrl,
        city: updates.city,
        birthday: updates.birthday,
        bio: updates.bio,
      })
      .eq('id', profileId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadAvatar(userId: string, file: File) {
    return uploadAvatarFile(file, userId)
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, firstName: string, lastName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/recuperar`,
    })
    if (error) throw error
  },

  onAuthStateChange(handler: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(handler as never)
  },
}
