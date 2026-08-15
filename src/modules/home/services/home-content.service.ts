import { supabase } from '~supabase/client'
import type {
  HomeContent,
  HomeContentInput,
  HomeContentSlot,
} from '@modules/home/types/home-content.types'

type Row = {
  id: string
  slot: string
  variant: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  cta_label: string | null
  cta_route: string | null
  bg_class: string | null
  order_index: number
  is_active: boolean
  updated_at: string
}

function mapRow(row: Row): HomeContent {
  return {
    id: row.id,
    slot: row.slot as HomeContentSlot,
    variant: row.variant,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    imageUrl: row.image_url,
    ctaLabel: row.cta_label,
    ctaRoute: row.cta_route,
    bgClass: row.bg_class,
    orderIndex: row.order_index,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  }
}

export const homeContentService = {
  async listBySlot(slot: HomeContentSlot): Promise<HomeContent[]> {
    const { data, error } = await supabase
      .from('home_content')
      .select('*')
      .eq('slot', slot)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async listAll(): Promise<HomeContent[]> {
    const { data, error } = await supabase
      .from('home_content')
      .select('*')
      .order('slot', { ascending: true })
      .order('order_index', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapRow)
  },

  async update(id: string, input: HomeContentInput): Promise<HomeContent> {
    const updates: Record<string, unknown> = {}
    if (input.title !== undefined) updates.title = input.title
    if (input.subtitle !== undefined) updates.subtitle = input.subtitle
    if (input.description !== undefined) updates.description = input.description
    if (input.imageUrl !== undefined) updates.image_url = input.imageUrl
    if (input.ctaLabel !== undefined) updates.cta_label = input.ctaLabel
    if (input.ctaRoute !== undefined) updates.cta_route = input.ctaRoute
    if (input.bgClass !== undefined) updates.bg_class = input.bgClass
    if (input.orderIndex !== undefined) updates.order_index = input.orderIndex
    if (input.isActive !== undefined) updates.is_active = input.isActive

    const { data, error } = await supabase
      .from('home_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapRow(data as Row)
  },

  async create(input: HomeContentInput & { slot: HomeContentSlot; variant?: string }): Promise<HomeContent> {
    const { data, error } = await supabase
      .from('home_content')
      .insert({
        slot: input.slot,
        variant: input.variant ?? 'default',
        title: input.title ?? null,
        subtitle: input.subtitle ?? null,
        description: input.description ?? null,
        image_url: input.imageUrl ?? null,
        cta_label: input.ctaLabel ?? null,
        cta_route: input.ctaRoute ?? null,
        bg_class: input.bgClass ?? 'bg-secondary-100',
        order_index: input.orderIndex ?? 0,
        is_active: input.isActive ?? true,
      })
      .select()
      .single()
    if (error) throw error
    return mapRow(data as Row)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('home_content').delete().eq('id', id)
    if (error) throw error
  },

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `home/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // 1. Intentar bucket principal 'home'
    const { error: homeError } = await supabase.storage.from('home').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (!homeError) {
      const { data } = supabase.storage.from('home').getPublicUrl(path)
      return data.publicUrl
    }

    // 2. Si el bucket 'home' aun no fue creado en Supabase SQL, usar 'documents' como fallback
    if (homeError.message?.toLowerCase().includes('bucket not found')) {
      const { error: docError } = await supabase.storage.from('documents').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (!docError) {
        const { data } = supabase.storage.from('documents').getPublicUrl(path)
        return data.publicUrl
      }

      const { error: resError } = await supabase.storage.from('resources').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (!resError) {
        const { data } = supabase.storage.from('resources').getPublicUrl(path)
        return data.publicUrl
      }
    }

    throw homeError
  },
}
