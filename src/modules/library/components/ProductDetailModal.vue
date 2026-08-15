<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { XMarkIcon, ShoppingCartIcon, SparklesIcon, CheckCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import type { LibraryDocument } from '@modules/library/types/library.types'
import { useAuthStore } from '@stores/auth.store'

const props = defineProps<{
  product: LibraryDocument
}>()

const emit = defineEmits<{
  close: []
  edit: [product: LibraryDocument]
}>()

const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'admin' || auth.role === 'super_admin' || auth.profile?.role === 'admin' || auth.profile?.role === 'super_admin')

function close() {
  emit('close')
}

function goToOrders() {
  close()
  router.push({ name: 'orders', query: { productId: props.product.id } })
}
</script>

<template>
  <AppModal
    :model-value="true"
    size="md"
    @update:model-value="(v: boolean) => !v && close()"
  >
    <div class="space-y-5">
      <!-- Imagen / Portada del Producto (Solo si existe thumbnail) -->
      <div v-if="product.thumbnail" class="relative w-full h-56 rounded-2xl overflow-hidden border border-divider shadow-sm">
        <img
          :src="product.thumbnail"
          :alt="product.title"
          class="w-full h-full object-cover"
        />
        <span class="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent/90 backdrop-blur-sm text-white text-caption font-medium shadow-sm">
          Producto Intimas
        </span>
      </div>

      <!-- Título & Precio (Con estética editorial destacada) -->
      <div class="space-y-1 pt-1">
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-h2 sm:text-h1 font-editorial font-extrabold text-text-primary leading-tight tracking-tight">
            {{ product.title }}
          </h2>
          <div v-if="product.price != null" class="text-right shrink-0">
            <span class="text-h2 font-editorial font-extrabold text-accent">${{ product.price.toFixed(2) }}</span>
            <span class="text-[11px] text-text-secondary block font-mono">USD</span>
          </div>
        </div>
        <p v-if="product.sku" class="text-small font-mono text-text-secondary">
          SKU: <strong class="text-text-primary">{{ product.sku }}</strong>
        </p>
      </div>

      <!-- Ficha de Detalles (Color, Talla, Categoria) -->
      <div class="p-4 rounded-2xl bg-surface border border-divider space-y-3 shadow-elevation1">
        <h3 class="text-caption font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <SparklesIcon class="w-4 h-4 text-accent" />
          Especificaciones del Producto
        </h3>

        <div class="grid grid-cols-2 gap-3 text-small">
          <div class="p-3 rounded-xl bg-background border border-divider">
            <span class="text-caption text-text-secondary block mb-0.5">Color(es):</span>
            <span class="font-medium text-text-primary leading-snug block">{{ product.color || 'No especificado' }}</span>
          </div>

          <div class="p-3 rounded-xl bg-background border border-divider">
            <span class="text-caption text-text-secondary block mb-0.5">Talla / Tamaño:</span>
            <span class="font-medium text-text-primary leading-snug block">{{ product.size || 'No especificado' }}</span>
          </div>
        </div>

        <!-- Descripción en caso de existir -->
        <div v-if="product.description || product.content" class="pt-3 border-t border-divider text-small text-text-primary space-y-1">
          <span class="text-caption text-text-secondary font-medium block">Descripción:</span>
          <p class="whitespace-pre-wrap leading-relaxed text-caption text-text-secondary">
            {{ product.description || product.content }}
          </p>
        </div>
      </div>

      <!-- Card Promocional para Embajadoras -->
      <div class="p-3.5 rounded-2xl bg-mint/30 border border-mint/60 flex items-center gap-3">
        <CheckCircleIcon class="w-6 h-6 text-success shrink-0" />
        <div class="text-caption">
          <p class="font-bold text-success">Disponible para Pedidos</p>
          <p class="text-text-secondary">
            Este producto está listo para ser incluido en los pedidos que registres para tus clientes.
          </p>
        </div>
      </div>
    </div>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-caption font-semibold text-text-secondary uppercase tracking-wider">Detalle del Producto</h2>
        <button
          class="w-8 h-8 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background transition-colors"
          aria-label="Cerrar"
          @click="close"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between w-full gap-2">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 text-small text-text-secondary hover:text-text-primary font-medium transition-colors"
            @click="close"
          >
            Cerrar
          </button>

          <button
            v-if="isAdmin"
            type="button"
            class="px-3.5 py-2 rounded-pill bg-background border border-divider text-text-primary text-small font-semibold flex items-center gap-1.5 hover:bg-accent-50 transition-colors"
            @click="emit('edit', product); close()"
          >
            <PencilSquareIcon class="w-4 h-4 text-accent" />
            Editar
          </button>
        </div>

        <button
          type="button"
          class="px-5 py-2.5 rounded-pill bg-blush text-accent-500 hover:bg-accent hover:text-white text-small font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          @click="goToOrders"
        >
          <ShoppingCartIcon class="w-4 h-4" />
          <span>Registrar Pedido con este Producto</span>
        </button>
      </div>
    </template>
  </AppModal>
</template>
