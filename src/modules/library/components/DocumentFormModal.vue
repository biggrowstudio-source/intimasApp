<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { CloudArrowUpIcon, XMarkIcon, DocumentTextIcon, LinkIcon, PencilSquareIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { useUiStore } from '@stores/ui.store'
import { useCreateDocument, useUpdateDocument } from '@modules/library/composables/useLibrary'
import type { LibraryDocument } from '@modules/library/types/library.types'

const props = defineProps<{
  documentToEdit?: LibraryDocument | null
}>()

const emit = defineEmits<{
  close: []
  created: [doc: LibraryDocument]
  updated: [doc: LibraryDocument]
}>()

const ui = useUiStore()
const createDoc = useCreateDocument()
const updateDoc = useUpdateDocument()

const form = reactive({
  title: '',
  description: '',
  categoryId: 'productos' as string,
  file: null as File | null,
  thumbnail: null as File | null,
  isFeatured: false,
  link: '',
  content: '',
  product: {
    sku: '',
    color: '',
    size: '',
    price: '' as string | number,
    collection: '',
  },
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

const categoryOptions = [
  { slug: 'productos', label: 'Productos', hasLink: false, hasFile: false, hasContent: false, isProduct: true, isCatalog: false, canFeature: false },
  { slug: 'catalogos', label: 'Catálogos', hasLink: true, hasFile: true, hasContent: false, isProduct: false, isCatalog: true, canFeature: false },
  { slug: 'bienvenida', label: 'Bienvenida', hasLink: false, hasFile: true, hasContent: true, isProduct: false, isCatalog: false, canFeature: false },
  { slug: 'manuales', label: 'Manuales', hasLink: false, hasFile: true, hasContent: false, isProduct: false, isCatalog: false, canFeature: false },
  { slug: 'comerciales', label: 'Documentos Comerciales', hasLink: false, hasFile: true, hasContent: false, isProduct: false, isCatalog: false, canFeature: false },
  { slug: 'recursos', label: 'Recursos descargables', hasLink: false, hasFile: true, hasContent: false, isProduct: false, isCatalog: false, canFeature: false },
]

watch(
  () => props.documentToEdit,
  (doc) => {
    if (doc) {
      const isProduct =
        doc.categorySlug === 'productos' ||
        doc.categorySlug?.includes('collection') ||
        doc.categorySlug?.includes('panty') ||
        doc.categorySlug?.includes('bra') ||
        !!doc.sku ||
        doc.price != null ||
        !!doc.collection

      form.title = doc.title || ''
      form.description = doc.description || ''
      form.content = doc.content || ''

      if (isProduct) {
        form.categoryId = 'productos'
      } else {
        const found = categoryOptions.find((c) => c.slug === doc.categorySlug)
        form.categoryId = found ? found.slug : (doc.link ? 'catalogos' : 'productos')
      }

      form.link = doc.link || ''
      form.isFeatured = doc.isFeatured || false
      form.product = {
        sku: doc.sku || '',
        color: doc.color || '',
        size: doc.size || '',
        price: doc.price ?? '',
        collection: doc.collection || '',
      }
    } else {
      reset()
    }
  },
  { immediate: true },
)

const selectedCategory = computed(() => {
  return categoryOptions.find((c) => c.slug === form.categoryId) ?? categoryOptions[0]
})

function reset() {
  form.title = ''
  form.description = ''
  form.categoryId = 'productos'
  form.file = null
  form.thumbnail = null
  form.isFeatured = false
  form.link = ''
  form.content = ''
  form.product = { sku: '', color: '', size: '', price: '', collection: '' }
  errors.value = {}
}

function close() {
  reset()
  emit('close')
}

function onThumbnailSelect(file: File) {
  form.thumbnail = file
}

async function submit() {
  errors.value = {}

  if (!form.title.trim()) {
    errors.value.title = 'El nombre o título es obligatorio'
    return
  }
  if (!form.categoryId) {
    errors.value.categoryId = 'Selecciona una categoría'
    return
  }

  if (selectedCategory.value?.isCatalog) {
    if (!form.link.trim()) {
      errors.value.link = 'El enlace del catálogo es obligatorio'
      return
    }
  }

  isSubmitting.value = true
  try {
    const numericPrice = form.product.price !== '' && form.product.price != null ? parseFloat(String(form.product.price)) : null

    if (props.documentToEdit) {
      const updated = await updateDoc.mutateAsync({
        documentId: props.documentToEdit.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        content: form.content.trim() || null,
        categorySlug: form.categoryId,
        file: form.file,
        thumbnail: form.thumbnail,
        isFeatured: form.isFeatured,
        link: form.link.trim() || null,
        sku: form.product.sku.trim() || null,
        price: numericPrice && !isNaN(numericPrice) ? numericPrice : null,
        color: form.product.color.trim() || null,
        size: form.product.size.trim() || null,
        collection: form.product.collection.trim() || null,
      })

      ui.pushToast({ title: 'Producto / Recurso actualizado', description: form.title, variant: 'success' })
      emit('updated', updated)
    } else {
      const doc = await createDoc.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || null,
        content: form.content.trim() || null,
        categorySlug: form.categoryId,
        file: form.file,
        thumbnail: form.thumbnail,
        isFeatured: form.isFeatured,
        link: form.link.trim() || null,
        sku: form.product.sku.trim() || null,
        price: numericPrice && !isNaN(numericPrice) ? numericPrice : null,
        color: form.product.color.trim() || null,
        size: form.product.size.trim() || null,
        collection: form.product.collection.trim() || null,
      })

      ui.pushToast({ title: 'Producto / Recurso guardado', description: form.title, variant: 'success' })
      emit('created', doc)
    }

    reset()
    close()
  } catch (e) {
    ui.pushToast({ title: 'Error al procesar recurso', description: (e as Error).message, variant: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="true"
    size="md"
    @update:model-value="(v: boolean) => !v && close()"
  >
    <div class="space-y-4">
      <AppSelect
        v-model="form.categoryId"
        label="Categoría"
        placeholder="Selecciona una categoría"
        :options="categoryOptions.map((c) => ({ label: c.label, value: c.slug }))"
        :error="errors.categoryId"
        :disabled="!!props.documentToEdit"
        required
      />

      <AppInput
        v-model="form.title"
        :label="selectedCategory?.isProduct ? 'Nombre del producto' : selectedCategory?.isCatalog ? 'Nombre del catálogo' : 'Título'"
        :placeholder="selectedCategory?.isProduct ? 'Ej. Malla Encaje Sensual' : selectedCategory?.isCatalog ? 'Ej. Catálogo Colección Verano 2026' : 'Título del recurso'"
        :error="errors.title"
        :disabled="!!props.documentToEdit && selectedCategory?.isProduct"
        :hint="!!props.documentToEdit && selectedCategory?.isProduct ? 'Bloqueado (No editable)' : ''"
        required
      />

      <!-- Productos: Formulario con campos específicos -->
      <template v-if="selectedCategory?.isProduct">
        <div class="p-4 rounded-xl bg-blush/30 border border-blush/60 space-y-3">
          <p class="text-caption text-text-secondary font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <SparklesIcon class="w-4 h-4 text-accent" />
            DETALLES DEL PRODUCTO
          </p>

          <div class="grid grid-cols-2 gap-3">
            <AppInput
              v-model="form.product.sku"
              label="SKU"
              placeholder="INT-001"
              :disabled="!!props.documentToEdit"
              :hint="!!props.documentToEdit ? 'Bloqueado (SKU único)' : ''"
            />
            <AppInput
              v-model="form.product.price"
              type="number"
              inputmode="decimal"
              step="0.01"
              label="Precio ($ USD)"
              placeholder="82.00"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <AppInput
              v-model="form.product.color"
              label="Color(es)"
              placeholder="BLACK, CHANTILLY"
            />
            <AppInput
              v-model="form.product.size"
              label="Talla / Tamaño"
              placeholder="34B, 34C, 36B..."
            />
          </div>

          <!-- Selector de Colección para Productos -->
          <div class="space-y-1">
            <label class="block text-caption font-medium text-text-primary">Colección</label>
            <select
              v-model="form.product.collection"
              class="w-full h-10 px-3 rounded-lg border border-divider bg-background text-small focus:outline-none focus:border-accent font-medium text-text-primary"
            >
              <option value="">-- Sin Colección --</option>
              <option value="Bras Collection">Bras Collection</option>
              <option value="Panties Collection">Panties Collection</option>
              <option value="Contouré Collection">Contouré Collection</option>
              <option value="Sculptura Collection">Sculptura Collection</option>
              <option value="Silueta Collection">Silueta Collection</option>
              <option value="True Shape Collection">True Shape Collection</option>
              <option value="Curva Shape Collection">Curva Shape Collection</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Catálogos: Enlace directo -->
      <template v-else-if="selectedCategory?.isCatalog">
        <div class="p-4 rounded-xl bg-mint/30 border border-mint/60 space-y-3">
          <p class="text-caption text-text-secondary font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <LinkIcon class="w-4 h-4 text-success" />
            Enlace del Catálogo
          </p>
          <AppInput
            v-model="form.link"
            type="url"
            label="Enlace del catálogo"
            placeholder="https://ejemplo.com/catalogo-lorena-2026.pdf"
            :error="errors.link"
            required
          />
        </div>
      </template>

      <!-- Archivo adjunto (PDF, Word, Excel, PowerPoint, Imagen, TXT, etc.) -->
      <template v-if="selectedCategory?.hasFile || !selectedCategory?.isProduct">
        <div class="space-y-2">
          <label class="block text-small font-medium text-text-primary">
            Documento / Archivo adjunto
          </label>

          <div v-if="form.file" class="flex items-center justify-between p-3.5 rounded-xl bg-mint/50 border border-mint">
            <div class="flex items-center gap-3 min-w-0">
              <DocumentTextIcon class="w-6 h-6 text-success shrink-0" />
              <div class="min-w-0">
                <p class="text-small font-bold text-text-primary truncate">{{ form.file.name }}</p>
                <p class="text-caption text-text-secondary font-mono">{{ (form.file.size / (1024 * 1024)).toFixed(2) }} MB</p>
              </div>
            </div>
            <button
              type="button"
              class="px-3 py-1 rounded-pill bg-error/10 text-error hover:bg-error hover:text-white text-caption font-bold transition-colors shrink-0"
              @click="form.file = null"
            >
              Quitar
            </button>
          </div>

          <div v-else-if="props.documentToEdit?.filePath" class="flex items-center justify-between p-3.5 rounded-xl bg-background border border-divider">
            <div class="flex items-center gap-3 min-w-0">
              <DocumentTextIcon class="w-6 h-6 text-accent shrink-0" />
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-text-secondary uppercase block">Archivo cargado actualmente</span>
                <p class="text-caption font-bold text-text-primary truncate">{{ props.documentToEdit.filePath }}</p>
              </div>
            </div>
            <label class="cursor-pointer px-3 py-1.5 rounded-pill bg-blush text-accent-500 hover:bg-accent hover:text-white text-caption font-bold transition-colors shrink-0">
              <span>Cambiar</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
                class="hidden"
                @change="(e: Event) => {
                  const f = (e.target as HTMLInputElement).files?.[0]
                  if (f) form.file = f
                }"
              />
            </label>
          </div>

          <AppUpload
            v-else
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
            label="Subir documento"
            description="Formatos: PDF, Word (.doc/x), Excel (.xls/x), PowerPoint (.ppt/x), Imágenes, TXT"
            @select="(f: File) => form.file = f"
          />
        </div>
      </template>

      <AppTextarea
        v-model="form.description"
        label="Descripción (opcional)"
        placeholder="Información relevante o nota descriptiva..."
        :rows="2"
      />

      <AppUpload
        accept="image/*"
        label="Imagen / Portada (opcional)"
        description="Imagen demostrativa del producto o recurso"
        @select="onThumbnailSelect"
      />
    </div>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-title font-semibold">
          {{ props.documentToEdit ? (selectedCategory?.isProduct ? 'Editar Producto' : 'Editar Recurso') : (selectedCategory?.isProduct ? 'Nuevo Producto' : 'Nuevo Recurso') }}
        </h2>
        <button
          class="w-9 h-9 -mr-2 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
          aria-label="Cerrar"
          @click="close"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </template>

    <template #footer>
      <AppButton variant="ghost" :disabled="isSubmitting" @click="close">
        Cancelar
      </AppButton>
      <AppButton
        :loading="isSubmitting"
        @click="submit"
      >
        <template #icon-left>
          <component :is="props.documentToEdit ? PencilSquareIcon : CloudArrowUpIcon" class="w-4 h-4" />
        </template>
        {{ props.documentToEdit ? 'Guardar Cambios' : 'Guardar' }}
      </AppButton>
    </template>
  </AppModal>
</template>
