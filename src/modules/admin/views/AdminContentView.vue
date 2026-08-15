<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useAllHomeContent,
  useUpdateHomeContent,
  useCreateHomeContent,
  useDeleteHomeContent,
  useUploadHomeImage,
} from '@modules/home/composables/useHomeContent'
import type { HomeContent, HomeContentInput, HomeContentSlot } from '@modules/home/types/home-content.types'
import { useUiStore } from '@stores/ui.store'
import { CloudArrowUpIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const ui = useUiStore()
const { data, isLoading, refetch } = useAllHomeContent()
const updateMutation = useUpdateHomeContent()
const createMutation = useCreateHomeContent()
const deleteMutation = useDeleteHomeContent()
const uploadMutation = useUploadHomeImage()

type Tab = HomeContentSlot
const activeTab = ref<Tab>('hero')

const tabItems: { key: Tab; label: string; description: string }[] = [
  { key: 'hero', label: 'Hero Banner Principal', description: 'Slides del carrusel superior del inicio' },
  { key: 'featured', label: 'Destacado para Ti', description: 'Tarjetas destacadas en el feed principal' },
  { key: 'greeting', label: 'Saludos de Bienvenida', description: 'Frases según la hora del día' },
]

const grouped = computed(() => {
  const map: Record<Tab, HomeContent[]> = { greeting: [], hero: [], featured: [] }
  for (const item of data.value ?? []) {
    if (map[item.slot as Tab]) map[item.slot as Tab].push(item)
  }
  return map
})

const bgOptions = [
  { value: 'bg-sage', label: 'Verde Sage' },
  { value: 'bg-rose-pastel', label: 'Rosa Pastel' },
  { value: 'bg-peach-pastel', label: 'Durazno Pastel' },
  { value: 'bg-blush', label: 'Blush Intimas' },
  { value: 'bg-mint', label: 'Menta Fresco' },
  { value: 'bg-secondary-100', label: 'Crema Elegante' },
]

const routeOptions = [
  { value: '/biblioteca', label: '📚 Biblioteca (Catálogos y Recursos)' },
  { value: '/comunidad', label: '💬 Comunidad (Women\'s Circle)' },
  { value: '/workshops', label: '🎓 Aulas y Workshops' },
  { value: '/reconocimientos', label: '🏆 Reconocimientos y Logros' },
  { value: '/ventas', label: '🛒 Registro de Ventas' },
  { value: '/perfil', label: '👤 Mi Perfil' },
  { value: '/ayuda', label: '❓ Ayuda y Soporte' },
  { value: '/admin', label: '⚙️ Panel Administrador' },
]

const draftInputs = ref<Record<string, HomeContentInput>>({})

function getDraft(item: HomeContent): HomeContentInput {
  if (!draftInputs.value[item.id]) {
    draftInputs.value[item.id] = {
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      imageUrl: item.imageUrl,
      ctaLabel: item.ctaLabel,
      ctaRoute: item.ctaRoute,
      bgClass: item.bgClass,
      orderIndex: item.orderIndex,
      isActive: item.isActive,
    }
  }
  return draftInputs.value[item.id]
}

function fieldChanged(item: HomeContent): boolean {
  const d = getDraft(item)
  return (
    d.title !== item.title ||
    d.subtitle !== item.subtitle ||
    d.description !== item.description ||
    d.imageUrl !== item.imageUrl ||
    d.ctaLabel !== item.ctaLabel ||
    d.ctaRoute !== item.ctaRoute ||
    d.bgClass !== item.bgClass ||
    d.isActive !== item.isActive
  )
}

async function saveItem(item: HomeContent) {
  try {
    const updated = await updateMutation.mutateAsync({ id: item.id, input: getDraft(item) })
    draftInputs.value[item.id] = {
      title: updated.title,
      subtitle: updated.subtitle,
      description: updated.description,
      imageUrl: updated.imageUrl,
      ctaLabel: updated.ctaLabel,
      ctaRoute: updated.ctaRoute,
      bgClass: updated.bgClass,
      orderIndex: updated.orderIndex,
      isActive: updated.isActive,
    }
    ui.pushToast({ title: 'Cambios guardados', description: 'El contenido del home ha sido actualizado', variant: 'success' })
    await refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al guardar', description: (e as Error).message, variant: 'error' })
  }
}

async function handleCreateNew() {
  try {
    const defaultData = activeTab.value === 'hero' 
      ? { title: 'Nuevo Banner Hero', subtitle: 'INTIMAS BY LORENA', description: 'Añade una breve descripción inspiradora.' }
      : activeTab.value === 'featured'
      ? { title: 'Nuevo Destacado', subtitle: 'Descubre la novedad', ctaRoute: '/biblioteca', bgClass: 'bg-rose-pastel' }
      : { title: 'Nuevo Saludo' }

    await createMutation.mutateAsync({
      slot: activeTab.value,
      variant: 'custom',
      ...defaultData,
      isActive: true,
      orderIndex: (grouped.value[activeTab.value]?.length || 0) + 1,
    })
    ui.pushToast({ title: 'Creado exitosamente', variant: 'success' })
    await refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al crear', description: (e as Error).message, variant: 'error' })
  }
}

async function handleDeleteItem(item: HomeContent) {
  if (!confirm(`¿Eliminar "${item.title || 'este elemento'}"?`)) return
  try {
    await deleteMutation.mutateAsync(item.id)
    ui.pushToast({ title: 'Elemento eliminado', variant: 'success' })
    await refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al eliminar', description: (e as Error).message, variant: 'error' })
  }
}

async function uploadFor(item: HomeContent, file: File) {
  try {
    const url = await uploadMutation.mutateAsync(file)
    const draft = getDraft(item)
    draft.imageUrl = url
    draftInputs.value[item.id] = { ...draft, imageUrl: url }
    ui.pushToast({ title: 'Imagen subida correctamente', variant: 'success' })
  } catch (e) {
    ui.pushToast({ title: 'Error al subir imagen', description: (e as Error).message, variant: 'error' })
  }
}

function previewImage(url: string | null | undefined) {
  return url || null
}
</script>

<template>
  <AppTopBar title="Gestión de Banners del Home" :back="true">
    <template #actions>
      <AppButton size="sm" @click="handleCreateNew">
        <PlusIcon class="w-4 h-4 mr-1" />
        Agregar Elemento
      </AppButton>
    </template>
  </AppTopBar>

  <div class="space-y-6 pb-20">
    <div class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
      <h2 class="text-subtitle font-bold text-text-primary">Personalizador de la Pantalla de Inicio</h2>
      <p class="text-small text-text-secondary">
        Modifica los banners del carrusel principal (Hero) y las tarjetas de la sección "Destacado para ti". Sube nuevas imágenes y cambia textos en tiempo real.
      </p>
    </div>

    <!-- Pestañas de Secciones -->
    <AppTabs
      v-model="activeTab"
      :options="tabItems.map((t) => ({ label: t.label, value: t.key }))"
    />

    <div v-if="isLoading" class="space-y-3">
      <AppSkeleton v-for="i in 3" :key="i" height="200px" />
    </div>

    <div v-else-if="grouped[activeTab].length === 0" class="space-y-4 text-center p-8 bg-surface rounded-2xl border border-divider">
      <AppEmptyState title="No hay banners en esta sección" description="Haz clic en 'Agregar Elemento' para crear uno." icon-name="document" />
      <AppButton @click="handleCreateNew">
        <PlusIcon class="w-4 h-4 mr-1" />
        Crear primer elemento
      </AppButton>
    </div>

    <div v-else class="space-y-5">
      <article
        v-for="item in grouped[activeTab]"
        :key="item.id"
        class="p-5 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-4 relative overflow-hidden"
      >
        <header class="flex items-center justify-between border-b border-divider pb-3">
          <div class="flex items-center gap-2">
            <span class="text-caption font-mono font-bold text-text-secondary bg-background px-2.5 py-1 rounded-lg border border-divider">
              {{ item.slot }}.{{ item.variant }}
            </span>
            <AppBadge :variant="getDraft(item).isActive ? 'success' : 'neutral'">
              {{ getDraft(item).isActive ? 'Activo' : 'Inactivo' }}
            </AppBadge>
          </div>

          <button
            type="button"
            class="p-2 rounded-xl text-error hover:bg-error/10 transition-colors"
            title="Eliminar elemento"
            @click="handleDeleteItem(item)"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </header>

        <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
          <!-- Campos para Saludo -->
          <AppInput
            v-if="activeTab === 'greeting'"
            :model-value="getDraft(item).title ?? ''"
            label="Frase de Bienvenida"
            placeholder="Hoy es un gran día para crecer juntas."
            @update:model-value="(v: string) => (getDraft(item).title = v)"
          />

          <!-- Campos para Hero Banner -->
          <template v-else-if="activeTab === 'hero'">
            <AppInput
              :model-value="getDraft(item).subtitle ?? ''"
              label="Etiqueta Superior (Subtítulo)"
              placeholder="INTIMAS BY LORENA"
              @update:model-value="(v: string) => (getDraft(item).subtitle = v)"
            />
            <AppInput
              :model-value="getDraft(item).title ?? ''"
              label="Titular Principal"
              placeholder="Juntas, somos imparables."
              @update:model-value="(v: string) => (getDraft(item).title = v)"
            />
            <div class="tablet:col-span-2">
              <AppTextarea
                :model-value="getDraft(item).description ?? ''"
                label="Descripción del Banner"
                :rows="2"
                placeholder="Una comunidad que inspira, acompaña y transforma."
                @update:model-value="(v: string) => (getDraft(item).description = v)"
              />
            </div>
          </template>

          <!-- Campos para Destacado Para Ti -->
          <template v-else>
            <AppInput
              :model-value="getDraft(item).title ?? ''"
              label="Título de la Tarjeta"
              placeholder="Catálogo Mayo 2026"
              @update:model-value="(v: string) => (getDraft(item).title = v)"
            />
            <AppInput
              :model-value="getDraft(item).subtitle ?? ''"
              label="Subtítulo corto"
              placeholder="Descubre lo nuevo"
              @update:model-value="(v: string) => (getDraft(item).subtitle = v)"
            />
            <AppSelect
              :model-value="getDraft(item).ctaRoute ?? '/biblioteca'"
              label="Destino al hacer clic (Sección de la App)"
              :options="routeOptions"
              @update:model-value="(v: string | number) => (getDraft(item).ctaRoute = String(v))"
            />
            <AppSelect
              :model-value="getDraft(item).bgClass ?? 'bg-rose-pastel'"
              label="Color de Fondo"
              :options="bgOptions"
              @update:model-value="(v: string | number) => (getDraft(item).bgClass = String(v))"
            />
          </template>

          <!-- Sección de Imagen de Banner / Tarjeta -->
          <div class="tablet:col-span-2 space-y-2">
            <label class="block text-small font-bold text-text-primary">Imagen Ilustrativa</label>
            <div class="flex flex-col sm:flex-row gap-4 items-start bg-background p-3 rounded-2xl border border-divider">
              <div class="shrink-0 w-28 h-28 rounded-xl bg-surface overflow-hidden border border-divider flex items-center justify-center relative shadow-xs">
                <img
                  v-if="previewImage(getDraft(item).imageUrl)"
                  :src="getDraft(item).imageUrl!"
                  alt="Vista previa"
                  class="w-full h-full object-cover"
                />
                <PhotoIcon v-else class="w-10 h-10 text-text-secondary/60" />
              </div>

              <div class="flex-1 space-y-2.5 w-full">
                <AppInput
                  :model-value="getDraft(item).imageUrl ?? ''"
                  label="URL directa de imagen"
                  placeholder="https://... o sube un archivo local"
                  @update:model-value="(v: string) => (getDraft(item).imageUrl = v)"
                />

                <label
                  class="inline-flex items-center gap-2 px-4 h-10 rounded-pill bg-text-primary text-surface text-caption font-extrabold cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
                  :class="{ 'opacity-50 pointer-events-none': uploadMutation.isPending.value }"
                >
                  <CloudArrowUpIcon class="w-4 h-4" />
                  {{ uploadMutation.isPending.value ? 'Subiendo imagen...' : 'Subir Imagen desde dispositivo' }}
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="(e: Event) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) uploadFor(item, file)
                    }"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <footer class="flex items-center justify-between gap-3 pt-3 border-t border-divider">
          <AppSwitch
            :model-value="getDraft(item).isActive ?? true"
            label="Banner Activo y Visible"
            @update:model-value="(v: boolean) => (getDraft(item).isActive = v)"
          />

          <AppButton
            :loading="updateMutation.isPending.value"
            :disabled="!fieldChanged(item)"
            @click="saveItem(item)"
          >
            Guardar Cambios
          </AppButton>
        </footer>
      </article>
    </div>
  </div>
</template>
