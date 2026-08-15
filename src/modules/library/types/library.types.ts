export interface DocumentCategory {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

export interface LibraryDocument {
  id: string
  title: string
  description: string | null
  content: string | null
  categoryId: string | null
  categoryName?: string | null
  categorySlug?: string | null
  filePath: string | null
  thumbnail: string | null
  isFeatured: boolean
  link: string | null
  sku?: string | null
  price?: number | null
  color?: string | null
  size?: string | null
  collection?: string | null
  createdAt: string
}

export interface ProductData {
  sku: string | null
  price: number | null
  color: string | null
  size: string | null
}

export interface DocumentFilters {
  search?: string
  categoryId?: string | null
  categoryIds?: string[]
  featured?: boolean
}
