import { supabase } from '~supabase/client'
import type { DocumentCategory, DocumentFilters, LibraryDocument } from '@modules/library/types/library.types'

async function checkIsAdmin(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    throw new Error('Acceso denegado: Solo el administrador puede crear, subir o eliminar recursos en la biblioteca.')
  }
}

async function resolveCategoryId(categorySearch: string | null | undefined): Promise<string | null> {
  if (!categorySearch) return null

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorySearch)

  if (isUuid) {
    const { data: cat } = await supabase
      .from('document_categories')
      .select('id')
      .eq('id', categorySearch)
      .maybeSingle()
    if (cat) return cat.id
  }

  // Buscar por slug sin mezclar tipos en .or()
  const { data: catBySlug } = await supabase
    .from('document_categories')
    .select('id')
    .eq('slug', categorySearch)
    .maybeSingle()

  if (catBySlug) return catBySlug.id

  // Crear la categoría si aún no existe en document_categories
  const nameMap: Record<string, string> = {
    catalogos: 'Catálogos',
    productos: 'Productos',
    bienvenida: 'Bienvenida',
    manuales: 'Manuales',
    comerciales: 'Documentos Comerciales',
    recursos: 'Recursos descargables',
  }
  const slugToUse = isUuid ? 'recursos' : categorySearch
  const catName = nameMap[slugToUse] || slugToUse
  const { data: newCat } = await supabase
    .from('document_categories')
    .insert({ name: catName, slug: slugToUse })
    .select('id')
    .maybeSingle()

  return newCat?.id ?? null
}

export const libraryService = {
  async listCategories(): Promise<DocumentCategory[]> {
    const { data, error } = await supabase
      .from('document_categories')
      .select('id, name, slug, parent_id')
      .order('name')
    if (error) throw error
    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id,
    }))
  },

  async listDocuments(filters: DocumentFilters = {}): Promise<LibraryDocument[]> {
    let query = supabase
      .from('documents')
      .select(`
        id, title, description, content, category_id, file_path, thumbnail, is_featured, link, sku, price, color, size, collection, created_at,
        category:document_categories(name, slug)
      `)
      .order('created_at', { ascending: false })

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const { data: selectedCats } = await supabase
        .from('document_categories')
        .select('id, slug, parent_id')
        .in('id', filters.categoryIds)

      const slugs = selectedCats?.map((c) => c.slug) ?? []

      const { data: subCats } = await supabase
        .from('document_categories')
        .select('id')
        .in('parent_id', filters.categoryIds)

      const allCategoryIds = [
        ...filters.categoryIds,
        ...(subCats?.map((sc) => sc.id) ?? []),
      ]

      if (slugs.includes('catalogos')) {
        query = query.or(`category_id.in.(${allCategoryIds.map((id) => `"${id}"`).join(',')}),link.not.is.null`)
      } else if (slugs.includes('productos')) {
        query = query.or(`category_id.in.(${allCategoryIds.map((id) => `"${id}"`).join(',')}),sku.not.is.null,price.not.is.null`)
      } else {
        query = query.in('category_id', allCategoryIds)
      }
    } else if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters.featured) query = query.eq('is_featured', true)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map((row) => {
      const category = (Array.isArray(row.category) ? row.category[0] : row.category) as { name: string; slug: string } | undefined
      
      let catName = category?.name ?? null
      let catSlug = category?.slug ?? null

      if (!catSlug) {
        const titleDesc = `${row.title ?? ''} ${row.description ?? ''} ${row.content ?? ''}`.toLowerCase()
        if (row.link) {
          catName = 'Catálogos'
          catSlug = 'catalogos'
        } else if (row.sku || row.price != null || row.collection) {
          catName = 'Productos'
          catSlug = 'productos'
        } else if (titleDesc.includes('bienvenida') || titleDesc.includes('bienvenido') || titleDesc.includes('welcome')) {
          catName = 'Bienvenida'
          catSlug = 'bienvenida'
        } else if (titleDesc.includes('manual') || titleDesc.includes('guia') || titleDesc.includes('guía')) {
          catName = 'Manuales'
          catSlug = 'manuales'
        } else if (titleDesc.includes('comercial') || titleDesc.includes('ventas') || titleDesc.includes('politica')) {
          catName = 'Documentos Comerciales'
          catSlug = 'comerciales'
        } else {
          catName = 'Recursos descargables'
          catSlug = 'recursos'
        }
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        content: row.content,
        categoryId: row.category_id,
        categoryName: catName,
        categorySlug: catSlug,
        filePath: row.file_path,
        thumbnail: row.thumbnail,
        isFeatured: row.is_featured,
        link: row.link,
        sku: row.sku,
        price: row.price ? Number(row.price) : null,
        color: row.color,
        size: row.size,
        collection: row.collection,
        createdAt: row.created_at,
      }
    })
  },

  async getDocumentUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60 * 60)
    if (error) throw error
    return data.signedUrl
  },

  async toggleFavorite(documentId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('No autenticado')

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .maybeSingle()

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      return false
    } else {
      await supabase.from('favorites').insert({ user_id: userId, document_id: documentId })
      return true
    }
  },

  async listFavoriteIds(): Promise<string[]> {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) return []
    const { data, error } = await supabase
      .from('favorites')
      .select('document_id')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).map((row) => row.document_id)
  },

  async uploadDocument(
    file: File | null,
    payload: {
      title: string
      description?: string | null
      content?: string | null
      categoryId?: string | null
      categorySlug?: string | null
      isFeatured?: boolean
      thumbnail?: File | null
      link?: string | null
      sku?: string | null
      price?: number | null
      color?: string | null
      size?: string | null
      collection?: string | null
    },
  ) {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('No autenticado')

    await checkIsAdmin(userId)

    const categorySearch = payload.categorySlug || payload.categoryId
    const categoryId = await resolveCategoryId(categorySearch)

    let filePath: string | null = null
    if (file) {
      const ext = file.name.split('.').pop() ?? 'bin'
      filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket not found')) {
          throw new Error('El bucket "documents" no existe en Supabase Storage. Ejecuta el archivo schema.sql en el SQL Editor de Supabase.')
        }
        throw uploadError
      }
    }

    let thumbnailUrl: string | null = null
    if (payload.thumbnail) {
      const thumbExt = payload.thumbnail.name.split('.').pop() ?? 'jpg'
      const thumbPath = `thumbs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${thumbExt}`
      const { error: thumbError } = await supabase.storage
        .from('documents')
        .upload(thumbPath, payload.thumbnail, { upsert: false })
      if (thumbError) throw thumbError
      const { data: pub } = supabase.storage.from('documents').getPublicUrl(thumbPath)
      thumbnailUrl = pub.publicUrl
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: payload.title,
        description: payload.description ?? null,
        content: payload.content ?? null,
        category_id: categoryId,
        file_path: filePath,
        thumbnail: thumbnailUrl,
        is_featured: payload.isFeatured ?? false,
        link: payload.link ?? null,
        sku: payload.sku ?? null,
        price: payload.price ?? null,
        color: payload.color ?? null,
        size: payload.size ?? null,
        collection: payload.collection ?? null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateDocument(
    documentId: string,
    payload: {
      title: string
      description?: string | null
      content?: string | null
      categoryId?: string | null
      categorySlug?: string | null
      isFeatured?: boolean
      link?: string | null
      sku?: string | null
      price?: number | null
      color?: string | null
      size?: string | null
      collection?: string | null
    },
    newFile?: File | null,
    newThumbnail?: File | null,
  ) {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('No autenticado')

    await checkIsAdmin(userId)

    const categorySearch = payload.categorySlug || payload.categoryId
    const categoryId = await resolveCategoryId(categorySearch)

    const updates: Record<string, any> = {
      title: payload.title,
      description: payload.description ?? null,
      content: payload.content ?? null,
      category_id: categoryId,
      is_featured: payload.isFeatured ?? false,
      link: payload.link ?? null,
      sku: payload.sku ?? null,
      price: payload.price ?? null,
      color: payload.color ?? null,
      size: payload.size ?? null,
      collection: payload.collection ?? null,
    }

    if (newFile) {
      const ext = newFile.name.split('.').pop() ?? 'bin'
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, newFile)
      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket not found')) {
          throw new Error('El bucket "documents" no existe en Supabase Storage. Ejecuta el archivo schema.sql en el SQL Editor de Supabase.')
        }
        throw uploadError
      }
      updates.file_path = filePath
    }

    if (newThumbnail) {
      const thumbExt = newThumbnail.name.split('.').pop() ?? 'jpg'
      const thumbPath = `thumbs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${thumbExt}`
      const { error: thumbError } = await supabase.storage
        .from('documents')
        .upload(thumbPath, newThumbnail, { upsert: false })
      if (thumbError) throw thumbError
      const { data: pub } = supabase.storage.from('documents').getPublicUrl(thumbPath)
      updates.thumbnail = pub.publicUrl
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteDocument(documentId: string) {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('No autenticado')

    await checkIsAdmin(userId)

    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) throw error
  },
}
