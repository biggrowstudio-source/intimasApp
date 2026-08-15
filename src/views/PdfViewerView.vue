<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import {
  ArrowLeftIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowPathIcon,
  FolderArrowDownIcon,
  MusicalNoteIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const documentId = String(route.params.documentId ?? '')
const activeTab = ref<'content' | 'preview'>('content')
const docxHtml = ref<string | null>(null)
const isRenderingDocx = ref(false)
const docxError = ref(false)

const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['library', 'document', documentId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, description, content, file_path, thumbnail, category:document_categories(name, slug)')
      .eq('id', documentId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Recurso no encontrado')

    let fileUrl: string | null = null
    if (data.file_path) {
      if (data.file_path.startsWith('http://') || data.file_path.startsWith('https://')) {
        fileUrl = data.file_path
      } else {
        const { data: signed } = await supabase.storage
          .from('documents')
          .createSignedUrl(data.file_path, 60 * 60)
        fileUrl = signed?.signedUrl ?? null

        if (!fileUrl) {
          const { data: signedRes } = await supabase.storage
            .from('resources')
            .createSignedUrl(data.file_path, 60 * 60)
          fileUrl = signedRes?.signedUrl ?? null
        }

        if (!fileUrl) {
          const { data: pub } = supabase.storage.from('documents').getPublicUrl(data.file_path)
          fileUrl = pub?.publicUrl ?? null
        }
      }
    }
    const cat = Array.isArray(data.category) ? data.category[0] : data.category
    return { ...data, fileUrl, categoryName: cat?.name || 'Biblioteca' }
  },
  enabled: !!documentId,
})

const fileExtension = computed(() => {
  if (!data.value?.file_path) return ''
  const parts = data.value.file_path.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
})

const isPdf = computed(() => fileExtension.value === 'pdf')

const isImage = computed(() =>
  ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(fileExtension.value)
)

const isVideo = computed(() =>
  ['mp4', 'webm', 'mov', 'm4v'].includes(fileExtension.value)
)

const isAudio = computed(() =>
  ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExtension.value)
)

const isTextResource = computed(() =>
  (!!data.value?.content && !data.value?.file_path) || ['txt', 'md', 'json'].includes(fileExtension.value)
)

const isWordDoc = computed(() =>
  ['doc', 'docx'].includes(fileExtension.value)
)

const isOfficeOrArchive = computed(() =>
  ['xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z'].includes(fileExtension.value)
)

const googleEmbedUrl = computed(() => {
  if (!data.value?.fileUrl) return ''
  return `https://docs.google.com/gview?url=${encodeURIComponent(data.value.fileUrl)}&embedded=true`
})

// Cargar conversor Mammoth dinámicamente para parsear archivos Word (.docx) directamente a HTML
async function loadAndRenderDocx(fileUrl: string) {
  try {
    isRenderingDocx.value = true
    docxError.value = false
    docxHtml.value = null

    if (!(window as any).mammoth) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const response = await fetch(fileUrl)
    const arrayBuffer = await response.arrayBuffer()
    const result = await (window as any).mammoth.convertToHtml({ arrayBuffer })
    docxHtml.value = result.value || '<p>El documento no contiene texto legible.</p>'
  } catch (e) {
    console.error('[Docx Render Error]', e)
    docxError.value = true
  } finally {
    isRenderingDocx.value = false
  }
}

watch(
  () => [data.value?.fileUrl, isWordDoc.value],
  ([url, isWord]) => {
    if (url && isWord) {
      loadAndRenderDocx(url as string)
    }
  },
  { immediate: true }
)

function close() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'library' })
}

function handleDownload() {
  if (!data.value?.fileUrl) return
  window.open(data.value.fileUrl, '_blank')
}
</script>

<template>
  <div class="h-full min-h-screen flex flex-col bg-background pb-20">
    <!-- Header Editorial con Botón de Descarga destacado -->
    <header class="flex items-center justify-between gap-3 p-3.5 safe-top shrink-0 border-b border-divider bg-surface shadow-sm sticky top-0 z-30">
      <div class="flex items-center gap-2.5 min-w-0">
        <button
          class="w-10 h-10 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background hover:text-text-primary transition-colors shrink-0"
          aria-label="Volver"
          @click="close"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-small font-bold text-text-primary truncate leading-tight">
              {{ data?.title ?? 'Cargando documento...' }}
            </h1>
            <span v-if="fileExtension" class="px-2 py-0.5 rounded bg-accent-50 text-accent font-mono text-[10px] font-bold uppercase shrink-0">
              {{ fileExtension }}
            </span>
          </div>
          <p class="text-caption text-text-secondary truncate">
            {{ data?.categoryName || 'Biblioteca' }} • Visor de Contenido
          </p>
        </div>
      </div>

      <!-- Acciones de Cabecera: Descargar & Cerrar -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="data?.fileUrl"
          type="button"
          class="inline-flex items-center gap-1.5 h-10 px-4 rounded-pill bg-blush text-accent-500 text-caption font-bold hover:bg-accent hover:text-white transition-colors shadow-sm"
          @click="handleDownload"
        >
          <ArrowDownTrayIcon class="w-4 h-4" />
          <span>Descargar</span>
        </button>

        <button
          class="w-10 h-10 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
          aria-label="Cerrar"
          @click="close"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- ESTADO DE CARGA -->
    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center p-6 space-y-3">
      <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
      <p class="text-small font-medium text-text-secondary">Cargando documento en tiempo real...</p>
    </div>

    <!-- ESTADO DE ERROR -->
    <div v-else-if="isError" class="flex-1 flex items-center justify-center p-6 text-center">
      <div class="space-y-3 max-w-sm">
        <DocumentTextIcon class="w-12 h-12 text-error/60 mx-auto" />
        <h3 class="text-title font-semibold text-text-primary">No se pudo abrir el documento</h3>
        <p class="text-small text-text-secondary">Verifica que el archivo exista o intenta descargarlo directamente.</p>
        <div class="flex items-center justify-center gap-2 pt-2">
          <AppButton variant="secondary" @click="close">Volver</AppButton>
          <AppButton v-if="data?.fileUrl" @click="handleDownload">Descargar Archivo</AppButton>
        </div>
      </div>
    </div>

    <!-- RECURSO DE WORD (.DOCX / .DOC) CON RENDERIZADO NATIVO DE TEXTO E IFRAME -->
    <div v-else-if="isWordDoc" class="flex-1 flex flex-col bg-background">
      <!-- Selector de Modo de Vista (Texto Nativo / Vista Previa Completa) -->
      <div class="flex items-center justify-between gap-2 px-4 py-2 bg-surface border-b border-divider shrink-0">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-full text-caption font-bold transition-all flex items-center gap-1.5"
            :class="activeTab === 'content' ? 'bg-accent text-white shadow-sm' : 'bg-background text-text-secondary border border-divider hover:border-accent/40'"
            @click="activeTab = 'content'"
          >
            <DocumentTextIcon class="w-4 h-4" />
            <span>Texto Nativo</span>
          </button>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-full text-caption font-bold transition-all flex items-center gap-1.5"
            :class="activeTab === 'preview' ? 'bg-accent text-white shadow-sm' : 'bg-background text-text-secondary border border-divider hover:border-accent/40'"
            @click="activeTab = 'preview'"
          >
            <EyeIcon class="w-4 h-4" />
            <span>Vista Previa Completa</span>
          </button>
        </div>

        <button
          type="button"
          class="text-caption text-accent hover:underline font-bold hidden sm:inline"
          @click="handleDownload"
        >
          Descargar .docx
        </button>
      </div>

      <!-- Pestaña 1: Renderizado de Texto Nativo directamente del .docx -->
      <div v-if="activeTab === 'content'" class="flex-1 overflow-y-auto p-4 sm:p-8">
        <div v-if="isRenderingDocx" class="flex flex-col items-center justify-center p-12 space-y-3">
          <ArrowPathIcon class="w-8 h-8 text-accent animate-spin" />
          <p class="text-small font-medium text-text-secondary">Procesando contenido del documento Word...</p>
        </div>

        <article v-else class="max-w-3xl mx-auto p-6 sm:p-10 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-6">
          <div class="border-b border-divider pb-4">
            <h2 class="text-h2 font-editorial text-text-primary leading-tight">{{ data?.title }}</h2>
            <p v-if="data?.description" class="text-small text-text-secondary mt-1">
              {{ data.description }}
            </p>
          </div>

          <!-- Contenido renderizado nativamente a partir del .docx -->
          <div
            v-if="docxHtml"
            class="prose prose-sm max-w-none text-text-primary leading-relaxed select-text font-sans space-y-3 [&>p]:mb-3 [&>h1]:text-h2 [&>h1]:font-bold [&>h2]:text-title [&>h2]:font-bold [&>h3]:text-subtitle [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
            v-html="docxHtml"
          />

          <!-- Fallback si el parser no pudo extraer texto -->
          <div v-else-if="docxError" class="text-center py-8 space-y-3">
            <p class="text-small text-text-secondary">No se pudo extraer el texto en vista ligera.</p>
            <button
              type="button"
              class="px-4 py-2 rounded-pill bg-accent text-white text-caption font-bold"
              @click="activeTab = 'preview'"
            >
              Ver en Vista Previa Completa
            </button>
          </div>
        </article>
      </div>

      <!-- Pestaña 2: Iframe con Vista Previa Completa -->
      <div v-else class="flex-1 w-full h-full bg-surface relative">
        <iframe
          v-if="googleEmbedUrl"
          :src="googleEmbedUrl"
          :title="data?.title"
          class="w-full h-full border-0"
        />
      </div>
    </div>

    <!-- RECURSO DE TEXTO / CONTENIDO -->
    <div v-else-if="isTextResource" class="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
      <article class="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-surface border border-divider shadow-sm space-y-6">
        <div v-if="data?.thumbnail" class="rounded-xl overflow-hidden bg-background max-h-80 border border-divider">
          <img :src="data.thumbnail" :alt="data.title" class="w-full h-full object-cover" />
        </div>
        <div>
          <span class="text-caption font-bold text-accent uppercase tracking-wider block mb-1">Documento de Lectura</span>
          <h2 class="text-h2 font-editorial text-text-primary leading-tight">{{ data?.title }}</h2>
          <p v-if="data?.description" class="text-small text-text-secondary mt-2 italic">
            {{ data.description }}
          </p>
        </div>
        <div class="prose prose-sm max-w-none text-text-primary whitespace-pre-wrap leading-relaxed text-body pt-4 border-t border-divider select-text">
          {{ data?.content || 'Sin contenido de texto.' }}
        </div>
      </article>
    </div>

    <!-- PREVISUALIZACIÓN DE IMÁGENES -->
    <div v-else-if="isImage" class="flex-1 flex flex-col items-center justify-center p-4 bg-secondary-900/90 overflow-auto">
      <img
        v-if="data?.fileUrl"
        :src="data.fileUrl"
        :alt="data.title"
        class="max-w-full max-h-full object-contain rounded-xl shadow-elevation3"
      />
    </div>

    <!-- REPRODUCTOR DE VIDEO -->
    <div v-else-if="isVideo" class="flex-1 flex flex-col items-center justify-center p-4 bg-black overflow-auto">
      <video
        v-if="data?.fileUrl"
        controls
        autoplay
        class="max-w-full max-h-full rounded-xl shadow-elevation3"
        :src="data.fileUrl"
      />
    </div>

    <!-- REPRODUCTOR DE AUDIO -->
    <div v-else-if="isAudio" class="flex-1 flex flex-col items-center justify-center p-6 bg-background">
      <div class="w-full max-w-md p-6 rounded-2xl bg-surface border border-divider shadow-elevation2 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-accent-50 text-accent mx-auto flex items-center justify-center">
          <MusicalNoteIcon class="w-8 h-8" />
        </div>
        <h3 class="text-title font-bold text-text-primary">{{ data?.title }}</h3>
        <p v-if="data?.description" class="text-caption text-text-secondary">{{ data.description }}</p>
        <audio controls class="w-full mt-2" :src="data?.fileUrl || ''" />
      </div>
    </div>

    <!-- VISOR NATIVO DE PDF -->
    <div v-else-if="isPdf" class="flex-1 bg-surface overflow-hidden relative">
      <iframe
        v-if="data?.fileUrl"
        :src="data.fileUrl"
        :title="data?.title"
        class="w-full h-full border-0"
      />
    </div>

    <!-- TARJETA LECTURA Y DESCARGA NATIVA (Excel: XLSX / PowerPoint: PPTX / ZIP) -->
    <div v-else-if="isOfficeOrArchive || data?.fileUrl" class="flex-1 flex items-center justify-center p-6 bg-background">
      <div class="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-surface border border-divider shadow-elevation2 text-center space-y-5">
        <div class="w-20 h-20 rounded-2xl bg-accent-50 text-accent mx-auto flex items-center justify-center border border-accent/20">
          <FolderArrowDownIcon class="w-10 h-10" />
        </div>
        <div>
          <span class="px-3 py-1 rounded-full bg-accent/10 text-accent font-mono text-caption font-bold uppercase inline-block mb-2">
            Formato {{ fileExtension || 'Documento' }}
          </span>
          <h2 class="text-h2 font-editorial text-text-primary leading-tight">{{ data?.title }}</h2>
          <p v-if="data?.description" class="text-small text-text-secondary mt-2">
            {{ data.description }}
          </p>
        </div>

        <div class="pt-4 border-t border-divider flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            class="w-full sm:w-auto px-6 py-3 rounded-pill bg-accent text-white font-bold text-small flex items-center justify-center gap-2 shadow-sm hover:bg-accent-600 active:scale-95 transition-all"
            @click="handleDownload"
          >
            <ArrowDownTrayIcon class="w-5 h-5" />
            <span>Descargar y Abrir Documento</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

