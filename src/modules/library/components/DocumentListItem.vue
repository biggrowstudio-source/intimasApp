<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowDownTrayIcon,
  BookmarkIcon,
  LinkIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import type { LibraryDocument } from '@modules/library/types/library.types'
import dayjs from '@utils/dayjs'
import { useAuthStore } from '@stores/auth.store'

const props = defineProps<{
  document: LibraryDocument
  isFavorite: boolean
  showNew?: boolean
}>()

const emit = defineEmits<{
  open: [doc: LibraryDocument]
  edit: [doc: LibraryDocument]
  delete: [doc: LibraryDocument]
  download: [doc: LibraryDocument]
  toggleFavorite: [doc: LibraryDocument]
}>()

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin' || auth.role === 'super_admin' || auth.profile?.role === 'admin' || auth.profile?.role === 'super_admin')

// Ref reactivo global para garantizar que SOLO un menú desplegable esté abierto a la vez
const activeAdminMenuDocId = ref<string | null>(null)

if (typeof window !== 'undefined') {
  window.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.admin-menu-container')) {
      activeAdminMenuDocId.value = null
    }
  })
}

const isMenuOpen = computed(() => activeAdminMenuDocId.value === props.document.id)

function toggleMenu() {
  if (isMenuOpen.value) {
    activeAdminMenuDocId.value = null
  } else {
    activeAdminMenuDocId.value = props.document.id
  }
}

const isCatalog = computed(() => props.document.categorySlug === 'catalogos' || !!props.document.link)
const isProduct = computed(() => props.document.categorySlug === 'productos' || !!props.document.sku || props.document.price != null)

const fileType = computed(() => {
  if (isCatalog.value) return 'CATÁLOGO'
  if (isProduct.value) return 'PRODUCTO'
  const path = props.document.filePath?.toLowerCase() ?? ''
  if (path.endsWith('.pdf')) return 'PDF'
  if (path.endsWith('.zip')) return 'ZIP'
  if (path.endsWith('.doc') || path.endsWith('.docx')) return 'DOC'
  if (path.endsWith('.ppt') || path.endsWith('.pptx')) return 'PPT'
  return 'DOCUMENTO'
})

const isRecent = computed(() => {
  const days = dayjs().diff(dayjs(props.document.createdAt), 'day')
  return days <= 2
})

function handleOpen() {
  if (isCatalog.value && props.document.link) {
    window.open(props.document.link, '_blank', 'noopener,noreferrer')
    return
  }
  emit('open', props.document)
}
</script>

<template>
  <article
    class="group relative flex items-center gap-3 p-3.5 rounded-2xl bg-surface border border-divider shadow-sm hover:shadow-md hover:border-accent/40 transition-all cursor-pointer"
    @click="handleOpen"
  >
    <!-- Icono / Miniatura -->
    <div class="shrink-0 w-14 h-14 rounded-xl bg-accent-50/60 overflow-hidden flex items-center justify-center border border-accent/10">
      <img
        v-if="document.thumbnail"
        :src="document.thumbnail"
        :alt="document.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
      />
      <BookmarkIcon v-else-if="isCatalog" class="w-6 h-6 text-accent" />
      <TagIcon v-else-if="isProduct" class="w-6 h-6 text-accent" />
      <svg v-else class="w-6 h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    </div>

    <!-- Título y detalles principales -->
    <div class="flex-1 min-w-0 space-y-0.5">
      <div class="flex items-center gap-2">
        <h3 class="text-small font-bold text-text-primary truncate flex-1 min-w-0 group-hover:text-accent transition-colors">
          {{ document.title }}
        </h3>
        <span v-if="showNew && isRecent" class="px-2 py-0.5 rounded-full bg-mint text-success text-[10px] font-bold shrink-0">
          Nuevo
        </span>
      </div>

      <!-- Detalles según tipo -->
      <!-- 1) Catálogo: Enlace explícito -->
      <p v-if="isCatalog" class="text-caption text-text-secondary truncate flex items-center gap-1">
        <span class="px-2 py-0.5 rounded-md bg-mint/50 text-success text-[10px] font-bold">Catálogo Digital</span>
      </p>

      <!-- 2) Producto: Precio, SKU, Color, Talla -->
      <div v-else-if="isProduct" class="flex flex-wrap items-center gap-1.5 text-caption text-text-secondary">
        <span v-if="document.price != null" class="font-extrabold text-accent text-small">${{ document.price.toFixed(2) }} USD</span>
        <span v-if="document.sku" class="px-1.5 py-0.5 rounded bg-background text-[10px] font-mono border border-divider">SKU: {{ document.sku }}</span>
        <span v-if="document.color" class="text-[11px]">Color: {{ document.color }}</span>
        <span v-if="document.size" class="text-[11px]">Talla: {{ document.size }}</span>
      </div>

      <!-- 3) Documento general -->
      <p v-else class="text-caption text-text-secondary flex items-center gap-1">
        <span>{{ document.categoryName || 'Recurso' }}</span>
        <span>•</span>
        <span class="font-mono text-[10px] uppercase">{{ fileType }}</span>
      </p>
    </div>

    <!-- Acciones (Botón Hover Abrir Catálogo + Favorito + Menú de 3 Puntos Admin a la extrema derecha) -->
    <div class="shrink-0 flex items-center gap-2">
      <!-- Botón "Abrir catálogo" que aparece suavemente al posar el cursor encima -->
      <button
        v-if="isCatalog && document.link"
        type="button"
        class="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 px-3 py-1.5 rounded-pill bg-mint text-success text-caption font-bold flex items-center gap-1.5 shadow-sm hover:bg-success hover:text-white"
        @click.stop="handleOpen"
      >
        <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Abrir catálogo</span>
        <span class="sm:hidden">Abrir</span>
      </button>

      <button
        v-else-if="document.filePath"
        type="button"
        class="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 px-3 py-1.5 rounded-pill bg-blush text-accent-500 text-caption font-bold flex items-center gap-1.5 shadow-sm hover:bg-accent hover:text-white"
        @click.stop="emit('download', document)"
      >
        <ArrowDownTrayIcon class="w-3.5 h-3.5" />
        <span>Descargar</span>
      </button>

      <!-- Botón Favorito -->
      <button
        v-if="isFavorite"
        type="button"
        class="w-8 h-8 rounded-pill bg-blush text-accent-500 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
        aria-label="Quitar de guardados"
        @click.stop="emit('toggleFavorite', document)"
      >
        <BookmarkSolid class="w-4 h-4" />
      </button>

      <!-- Menú de 3 Puntos (Exclusivo Administrador - Siempre a la extrema derecha) -->
      <div v-if="isAdmin" class="relative admin-menu-container" @click.stop>
        <button
          type="button"
          class="w-8 h-8 rounded-pill bg-background border border-divider text-text-secondary hover:bg-surface hover:text-text-primary flex items-center justify-center transition-colors"
          aria-label="Opciones de administración"
          @click.stop="toggleMenu"
        >
          <EllipsisVerticalIcon class="w-4 h-4" />
        </button>

        <!-- Menú desplegable único (z-[60] y flotando hacia arriba para evitar solapamientos con el bottom bar) -->
        <div
          v-if="isMenuOpen"
          class="absolute right-0 bottom-full mb-1.5 z-[60] w-40 rounded-2xl bg-surface border border-divider shadow-elevation3 p-1.5 space-y-1 text-small"
          @click.stop
        >
          <button
            type="button"
            class="w-full px-3 py-2 rounded-xl text-left text-text-primary hover:bg-accent-50 hover:text-accent font-medium flex items-center gap-2 transition-colors"
            @click="activeAdminMenuDocId = null; emit('edit', document)"
          >
            <PencilSquareIcon class="w-4 h-4 text-accent" />
            <span>Modificar</span>
          </button>

          <button
            type="button"
            class="w-full px-3 py-2 rounded-xl text-left text-error hover:bg-error/10 font-medium flex items-center gap-2 transition-colors"
            @click="activeAdminMenuDocId = null; emit('delete', document)"
          >
            <TrashIcon class="w-4 h-4 text-error" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
