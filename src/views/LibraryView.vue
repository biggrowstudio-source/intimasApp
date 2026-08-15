<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useDocumentFilters,
  useDocuments,
  useCategories,
  useFavoriteIds,
  useToggleFavorite,
} from '@modules/library/composables/useLibrary'
import { libraryService } from '@modules/library/services/library.service'
import { useUiStore } from '@stores/ui.store'
import LibraryHeader from '@modules/library/components/LibraryHeader.vue'
import FeaturedDocumentsCarousel from '@modules/library/components/FeaturedDocumentsCarousel.vue'
import DocumentListItem from '@modules/library/components/DocumentListItem.vue'
import DocumentFormModal from '@modules/library/components/DocumentFormModal.vue'
import ProductDetailModal from '@modules/library/components/ProductDetailModal.vue'
import type { LibraryDocument } from '@modules/library/types/library.types'
import {
  BookOpenIcon,
  BookmarkIcon,
  AcademicCapIcon,
  MegaphoneIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const ui = useUiStore()
const filterRefs = useDocumentFilters()
const search = filterRefs.search
const categoryIds = filterRefs.categoryIds

const emptyFilters = ref({ search: '', categoryIds: [] })

const showForm = ref(false)
const selectedProduct = ref<LibraryDocument | null>(null)
const documentToEdit = ref<LibraryDocument | null>(null)

const { data: categories } = useCategories()
const { data: allDocuments, isLoading, isError, refetch } = useDocuments(emptyFilters)
const { data: favorites } = useFavoriteIds()
const toggleFavorite = useToggleFavorite()

watch(categories, (cats) => {
  if (cats && cats.length > 0 && categoryIds.value.length === 0) {
    const prodCat = cats.find((c) => c.slug === 'productos')
    if (prodCat) {
      categoryIds.value = [prodCat.id]
    }
  }
}, { immediate: true })

interface CategoryTile {
  id: string
  name: string
  slug: string
  icon: typeof BookOpenIcon
  gradient: string
  iconBg: string
  count: number
}

const categoryConfig: Record<string, { icon: typeof BookOpenIcon; gradient: string; iconBg: string }> = {
  productos: {
    icon: ShoppingBagIcon,
    gradient: 'from-secondary-100 to-blush',
    iconBg: 'bg-secondary-100 text-text-primary',
  },
  catalogos: {
    icon: BookmarkIcon,
    gradient: 'from-mint to-sage',
    iconBg: 'bg-mint text-success',
  },
  bienvenida: {
    icon: SparklesIcon,
    gradient: 'from-blush to-accent-50',
    iconBg: 'bg-blush text-accent',
  },
  manuales: {
    icon: BookOpenIcon,
    gradient: 'from-blush to-accent-50',
    iconBg: 'bg-accent-50 text-accent-500',
  },
  comerciales: {
    icon: DocumentTextIcon,
    gradient: 'from-accent-50 to-blush',
    iconBg: 'bg-accent-50 text-accent-500',
  },
  recursos: {
    icon: ArrowDownTrayIcon,
    gradient: 'from-mint to-sage',
    iconBg: 'bg-mint text-success',
  },
}

const defaultConfig = {
  icon: DocumentTextIcon,
  gradient: 'from-background to-secondary-100',
  iconBg: 'bg-background text-text-secondary',
}

const selectedCollection = ref<string | null>(null)

const preferredOrder = ['productos', 'catalogos', 'bienvenida', 'manuales', 'comerciales', 'recursos']

function isProductDoc(d: LibraryDocument): boolean {
  return !!d.sku || d.price != null || !!d.collection || d.categorySlug === 'productos' || !!d.categorySlug?.endsWith('-collection')
}

const enhancedCategories = computed<CategoryTile[]>(() => {
  // Filtrar ÚNICAMENTE las 6 categorías principales
  const topCategories = (categories.value ?? []).filter(
    (cat) => !cat.parentId && !cat.slug.endsWith('-collection') && preferredOrder.includes(cat.slug)
  )

  const cats = topCategories.map((cat) => {
    const config = categoryConfig[cat.slug] ?? defaultConfig
    const count = (allDocuments.value ?? []).filter((d) => {
      if (cat.slug === 'productos') return isProductDoc(d)
      if (isProductDoc(d)) return false
      if (cat.slug === 'catalogos') return d.categorySlug === 'catalogos' || !!d.link
      return d.categoryId === cat.id || d.categorySlug === cat.slug
    }).length

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: config.icon,
      gradient: config.gradient,
      iconBg: config.iconBg,
      count,
    }
  })

  return cats.sort((a, b) => {
    const idxA = preferredOrder.indexOf(a.slug)
    const idxB = preferredOrder.indexOf(b.slug)
    const posA = idxA === -1 ? 99 : idxA
    const posB = idxB === -1 ? 99 : idxB
    return posA - posB
  })
})

const collectionTabs = computed(() => {
  const subCats = (categories.value ?? []).filter((c) => c.parentId || c.slug.endsWith('-collection'))
  return subCats.map((sc) => {
    const count = (allDocuments.value ?? []).filter((d) =>
      d.categoryId === sc.id || d.categorySlug === sc.slug || d.collection === sc.name
    ).length
    return {
      id: sc.id,
      name: sc.name,
      displayName: sc.name.replace(/\s+Collection$/i, ''),
      slug: sc.slug,
      count,
    }
  })
})

const totalProductsCount = computed(() => {
  return (allDocuments.value ?? []).filter(isProductDoc).length
})

const activeCategoryId = computed(() => categoryIds.value[0] ?? null)

const activeCategory = computed(() => {
  if (!activeCategoryId.value) return null
  return enhancedCategories.value.find((c) => c.id === activeCategoryId.value) ?? null
})

const isProductCategoryActive = computed(() => {
  if (!activeCategoryId.value) return true
  const cat = enhancedCategories.value.find((c) => c.id === activeCategoryId.value)
  return cat?.slug === 'productos'
})

const visibleDocuments = computed(() => {
  if (!allDocuments.value) return []
  let docs = allDocuments.value

  if (activeCategoryId.value) {
    const cat = enhancedCategories.value.find((c) => c.id === activeCategoryId.value)
    const slug = cat?.slug
    docs = docs.filter((d) => {
      if (slug === 'productos') return isProductDoc(d)
      if (slug === 'catalogos') return d.categorySlug === 'catalogos' || (d.categoryId === cat?.id && !d.sku)
      return d.categoryId === activeCategoryId.value || (slug && d.categorySlug === slug)
    })
  }

  if (selectedCollection.value) {
    docs = docs.filter((d) => {
      const subCat = (categories.value ?? []).find((c) => c.name === selectedCollection.value)
      return d.collection === selectedCollection.value || (subCat && (d.categoryId === subCat.id || d.categorySlug === subCat.slug))
    })
  }

  if (search.value && search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    docs = docs.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.sku && d.sku.toLowerCase().includes(q)) ||
      (d.collection && d.collection.toLowerCase().includes(q))
    )
  }

  return docs
})

const featured = computed(() => allDocuments.value?.filter((d) => d.isFeatured) ?? [])

function selectCategory(id: string) {
  selectedCollection.value = null
  categoryIds.value = [id]
}

function clearFilters() {
  search.value = ''
  selectedCollection.value = null
  if (enhancedCategories.value.length > 0 && categoryIds.value.length === 0) {
    categoryIds.value = [enhancedCategories.value[0].id]
  }
}

function handleNewResource() {
  documentToEdit.value = null
  showForm.value = true
}

function handleEditDocument(doc: LibraryDocument) {
  documentToEdit.value = doc
  showForm.value = true
}

async function handleDeleteDocument(doc: LibraryDocument) {
  if (confirm(`¿Estás seguro de eliminar "${doc.title}"?`)) {
    try {
      await libraryService.deleteDocument(doc.id)
      ui.pushToast({ title: 'Recurso eliminado', description: doc.title, variant: 'info' })
      refetch()
    } catch (e) {
      ui.pushToast({ title: 'Error al eliminar', description: (e as Error).message, variant: 'error' })
    }
  }
}

function openDocument(docOrId: LibraryDocument | string) {
  const doc = typeof docOrId === 'string'
    ? visibleDocuments.value.find((d) => d.id === docOrId)
    : docOrId

  if (!doc) return

  if (doc.categorySlug === 'productos' || doc.sku || doc.price != null) {
    selectedProduct.value = doc
    return
  }

  if (doc.filePath || doc.content) {
    router.push({ name: 'pdf-viewer', params: { documentId: doc.id } })
    return
  }

  if (doc.link) {
    window.open(doc.link, '_blank', 'noopener,noreferrer')
  }
}

async function download(doc: { id: string; title: string; filePath: string | null }) {
  if (!doc.filePath) return
  try {
    const url = await libraryService.getDocumentUrl(doc.filePath)
    window.open(url, '_blank')
    ui.pushToast({ title: 'Descarga iniciada', description: doc.title, variant: 'success' })
  } catch (e) {
    ui.pushToast({ title: 'Error al descargar', description: (e as Error).message, variant: 'error' })
  }
}

async function onToggle(doc: { id: string }) {
  const isFav = favorites.value?.includes(doc.id) ?? false
  try {
    await toggleFavorite.mutateAsync({ documentId: doc.id, isFavorite: isFav })
    ui.pushToast({
      title: isFav ? 'Eliminado de guardados' : 'Guardado',
      variant: 'success',
    })
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5 pb-28">
    <LibraryHeader @new-resource="handleNewResource" />

    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
        <MagnifyingGlassIcon class="w-5 h-5" />
      </span>
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por título..."
        class="w-full h-12 pl-12 pr-12 rounded-pill border border-divider bg-surface text-small text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all shadow-elevation1"
      />
      <button
        v-if="search"
        class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
        aria-label="Limpiar búsqueda"
        @click="search = ''"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>

    <section v-if="enhancedCategories.length > 0">
      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="text-title font-semibold text-text-primary">Explora por categoría</h2>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          v-for="cat in enhancedCategories"
          :key="cat.id"
          type="button"
          class="flex flex-col items-center text-center p-3 rounded-2xl transition-all active:scale-[0.97] border-2 relative overflow-hidden"
          :class="
            activeCategoryId === cat.id
              ? 'border-accent bg-gradient-to-br ' + cat.gradient + ' shadow-elevation2'
              : 'bg-surface border-transparent hover:bg-background'
          "
          @click="selectCategory(cat.id)"
        >
          <span
            v-if="activeCategoryId === cat.id"
            class="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-accent/10 blur-2xl pointer-events-none"
            aria-hidden="true"
          />
          <span
            :class="[
              'relative flex items-center justify-center w-11 h-11 rounded-xl mb-1.5',
              activeCategoryId === cat.id ? 'bg-accent text-white' : cat.iconBg,
            ]"
          >
            <component :is="cat.icon" class="w-5 h-5" />
          </span>
          <p class="relative text-caption font-semibold text-text-primary leading-tight">
            {{ cat.name }}
          </p>
          <p class="relative text-[10px] text-text-secondary mt-0.5">
            {{ cat.count }} rec.
          </p>
          <SparklesIcon
            v-if="activeCategoryId === cat.id"
            class="absolute top-1.5 right-1.5 w-3 h-3 text-accent animate-pulse"
          />
        </button>
      </div>
    </section>

    <FeaturedDocumentsCarousel
      v-if="featured.length > 0 && !activeCategoryId && !search"
      :documents="featured"
      :favorite-ids="favorites ?? []"
      @open="(d) => openDocument(d)"
      @download="download"
      @toggle-favorite="onToggle"
    />

    <section>
      <!-- TABs de Colecciones para Productos -->
      <div v-if="collectionTabs.length > 0 && isProductCategoryActive" class="mb-4">
        <div class="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-full text-caption font-bold transition-all shrink-0 border flex items-center gap-1.5"
            :class="
              !selectedCollection
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-surface text-text-secondary border-divider hover:border-accent/40'
            "
            @click="selectedCollection = null"
          >
            <span>Todas</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">{{ totalProductsCount }}</span>
          </button>

          <button
            v-for="col in collectionTabs"
            :key="col.id"
            type="button"
            class="px-3.5 py-1.5 rounded-full text-caption font-bold transition-all shrink-0 border flex items-center gap-1.5"
            :class="
              selectedCollection === col.name
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-surface text-text-secondary border-divider hover:border-accent/40'
            "
            @click="selectedCollection = selectedCollection === col.name ? null : col.name"
          >
            <span>{{ col.displayName }}</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">{{ col.count }}</span>
          </button>
        </div>
      </div>

      <header class="flex items-center justify-between mb-3 px-1">
        <h2 class="text-title font-semibold text-text-primary">
          <span v-if="selectedCollection">{{ selectedCollection }}</span>
          <span v-else-if="activeCategory">{{ activeCategory.name }}</span>
          <span v-else-if="search">Resultados</span>
          <span v-else>Recursos</span>
        </h2>
        <span class="text-caption text-text-secondary">
          {{ visibleDocuments.length }} {{ visibleDocuments.length === 1 ? 'recurso' : 'recursos' }}
        </span>
      </header>

      <div v-if="isLoading" class="space-y-2">
        <AppSkeleton v-for="i in 3" :key="i" height="72px" />
      </div>

      <div v-else-if="isError">
        <AppErrorState
          title="No hay documentos publicados aún"
          message="El equipo está preparando contenido para ti."
          @retry="refetch()"
        />
      </div>

      <div v-else-if="visibleDocuments.length === 0">
        <div class="text-center py-8">
          <DocumentTextIcon class="w-12 h-12 mx-auto text-text-secondary opacity-40 mb-2" />
          <p class="text-small text-text-secondary">
            {{ search ? 'No hay resultados para esa búsqueda' : 'No hay documentos en esta categoría' }}
          </p>
        </div>
      </div>

      <div v-else class="space-y-2">
        <DocumentListItem
          v-for="doc in visibleDocuments"
          :key="doc.id"
          :document="doc"
          :is-favorite="favorites?.includes(doc.id) ?? false"
          :show-new="!activeCategoryId && !search"
          @open="openDocument"
          @edit="handleEditDocument"
          @delete="handleDeleteDocument"
          @download="download"
          @toggle-favorite="onToggle"
        />
      </div>
    </section>

    <!-- Modal Formulario Recurso (Nuevo o Edición) -->
    <DocumentFormModal
      v-if="showForm"
      :document-to-edit="documentToEdit"
      @close="showForm = false; documentToEdit = null"
      @created="refetch()"
      @updated="refetch()"
    />

    <!-- Modal Vista Detallada de Producto -->
    <ProductDetailModal
      v-if="selectedProduct"
      :product="selectedProduct"
      @close="selectedProduct = null"
      @edit="handleEditDocument"
    />
  </div>
</template>
