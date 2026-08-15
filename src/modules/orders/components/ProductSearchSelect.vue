<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon, TagIcon, CheckIcon } from '@heroicons/vue/24/outline'
import type { LibraryDocument } from '@modules/library/types/library.types'

const props = defineProps<{
  modelValue?: string
  products: LibraryDocument[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [product: LibraryDocument | null]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)

const selectedProduct = computed(() => {
  if (!props.modelValue) return null
  return props.products.find((p) => p.id === props.modelValue) ?? null
})

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return props.products
  const q = searchQuery.value.trim().toLowerCase()
  return props.products.filter((p) =>
    p.title.toLowerCase().includes(q) ||
    (p.sku && p.sku.toLowerCase().includes(q))
  )
})

function toggleOpen() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

function selectProduct(p: LibraryDocument | null) {
  isOpen.value = false
  searchQuery.value = ''
  emit('update:modelValue', p ? p.id : '')
  emit('select', p)
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <label class="block text-caption font-medium text-text-primary mb-1">
      Seleccionar de Biblioteca
    </label>

    <!-- Trigger Button -->
    <button
      type="button"
      class="w-full min-h-12 px-3.5 py-2 rounded-xl border border-divider bg-surface text-small text-left flex items-center justify-between gap-3 hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
      :class="{ 'ring-2 ring-accent border-accent': isOpen }"
      @click="toggleOpen"
    >
      <div v-if="selectedProduct" class="flex items-center gap-2.5 min-w-0 flex-1">
        <div class="shrink-0 w-8 h-8 rounded-lg bg-accent-50 overflow-hidden flex items-center justify-center border border-divider">
          <img v-if="selectedProduct.thumbnail" :src="selectedProduct.thumbnail" :alt="selectedProduct.title" class="w-full h-full object-cover" />
          <TagIcon v-else class="w-4 h-4 text-accent" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-text-primary truncate leading-tight">{{ selectedProduct.title }}</p>
          <p class="text-[11px] text-text-secondary truncate">
            <span v-if="selectedProduct.sku" class="font-mono">SKU: {{ selectedProduct.sku }} • </span>
            <span class="font-bold text-accent">${{ selectedProduct.price ? selectedProduct.price.toFixed(2) : '0.00' }} USD</span>
          </p>
        </div>
      </div>

      <div v-else class="flex items-center gap-2 text-text-secondary flex-1 truncate">
        <MagnifyingGlassIcon class="w-4 h-4 shrink-0" />
        <span class="truncate">{{ placeholder || '-- Buscar o seleccionar producto de la biblioteca --' }}</span>
      </div>

      <ChevronDownIcon class="w-4 h-4 text-text-secondary shrink-0 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Floating Dropdown Panel with Search Bar -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-surface border border-divider shadow-elevation2 overflow-hidden space-y-2 p-2 animate-in fade-in zoom-in-95 duration-100"
    >
      <!-- Search Input Bar -->
      <div class="relative">
        <MagnifyingGlassIcon class="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por nombre o SKU..."
          class="w-full h-10 pl-9 pr-8 rounded-xl bg-background border border-divider text-small text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-all"
          @click.stop
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface"
          @click.stop="searchQuery = ''"
        >
          <XMarkIcon class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Products List -->
      <div class="max-h-60 overflow-y-auto space-y-1 pr-1">
        <!-- Clear Option -->
        <button
          type="button"
          class="w-full p-2 rounded-xl text-left text-caption text-text-secondary hover:bg-background transition-colors flex items-center justify-between"
          @click.stop="selectProduct(null)"
        >
          <span>-- Sin producto de la BD --</span>
          <CheckIcon v-if="!modelValue" class="w-4 h-4 text-accent" />
        </button>

        <div v-if="filteredProducts.length === 0" class="py-6 text-center text-caption text-text-secondary">
          No se encontraron productos que coincidan con "{{ searchQuery }}"
        </div>

        <button
          v-for="p in filteredProducts"
          :key="p.id"
          type="button"
          class="w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors hover:bg-accent-50/60"
          :class="modelValue === p.id ? 'bg-accent-50 border border-accent/20' : ''"
          @click.stop="selectProduct(p)"
        >
          <div class="shrink-0 w-10 h-10 rounded-lg bg-background overflow-hidden border border-divider flex items-center justify-center">
            <img v-if="p.thumbnail" :src="p.thumbnail" :alt="p.title" class="w-full h-full object-cover" />
            <TagIcon v-else class="w-5 h-5 text-accent" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-small font-bold text-text-primary truncate">{{ p.title }}</p>
              <span v-if="p.price != null" class="text-caption font-bold text-accent shrink-0">${{ p.price.toFixed(2) }}</span>
            </div>
            <p class="text-caption text-text-secondary truncate">
              <span v-if="p.sku" class="font-mono bg-background px-1 rounded border border-divider">SKU: {{ p.sku }}</span>
              <span v-if="p.color"> • {{ p.color }}</span>
            </p>
          </div>

          <CheckIcon v-if="modelValue === p.id" class="w-4 h-4 text-accent shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>
