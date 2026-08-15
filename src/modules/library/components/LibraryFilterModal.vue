<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import type { DocumentCategory } from '@modules/library/types/library.types'

const props = defineProps<{
  modelValue: boolean
  categories: DocumentCategory[]
  initialSearch: string
  initialCategoryIds: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [filters: { search: string; categoryIds: string[] }]
  clear: []
}>()

const search = ref(props.initialSearch)
const selectedIds = ref<string[]>([...props.initialCategoryIds])

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      search.value = props.initialSearch
      selectedIds.value = [...props.initialCategoryIds]
    }
  },
)

function toggle(id: string) {
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(i, 1)
}

function isSelected(id: string) {
  return selectedIds.value.includes(id)
}

function apply() {
  emit('apply', { search: search.value, categoryIds: [...selectedIds.value] })
  emit('update:modelValue', false)
}

function clear() {
  search.value = ''
  selectedIds.value = []
  emit('clear')
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}

const hasChanges = computed(() =>
  search.value !== props.initialSearch ||
  selectedIds.value.length !== props.initialCategoryIds.length ||
  selectedIds.value.some((id, i) => id !== props.initialCategoryIds[i]),
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-base ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-base ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end tablet:items-center justify-center p-0 tablet:p-4 bg-primary/40 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-full tablet:translate-y-2 tablet:opacity-0 tablet:scale-95"
          enter-to-class="translate-y-0 tablet:translate-y-0 tablet:opacity-100 tablet:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0 tablet:opacity-100 tablet:scale-100"
          leave-to-class="translate-y-full tablet:opacity-0 tablet:scale-95"
        >
          <div
            v-if="modelValue"
            class="w-full tablet:max-w-md bg-surface rounded-t-2xl tablet:rounded-2xl shadow-elevation3 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <header class="flex items-center justify-between gap-3 p-4 border-b border-divider shrink-0">
              <h2 class="text-title font-semibold text-text-primary">Filtrar</h2>
              <button
                class="w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
                aria-label="Cerrar"
                @click="close"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </header>

            <div class="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label class="block text-small font-medium text-text-primary mb-2">
                  Buscar por título
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                    <MagnifyingGlassIcon class="w-4 h-4" />
                  </span>
                  <input
                    v-model="search"
                    type="search"
                    placeholder="Catálogo, manual, guía..."
                    class="w-full h-11 pl-10 pr-3 rounded-pill border border-divider bg-surface text-small text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-small font-medium text-text-primary">
                    Categorías
                  </label>
                  <span
                    v-if="selectedIds.length > 0"
                    class="text-caption text-accent font-semibold"
                  >
                    {{ selectedIds.length }} seleccionada{{ selectedIds.length === 1 ? '' : 's' }}
                  </span>
                </div>

                <div class="rounded-xl border border-divider overflow-hidden divide-y divide-divider">
                  <label
                    v-for="cat in categories"
                    :key="cat.id"
                    class="flex items-center gap-3 p-3 cursor-pointer hover:bg-background transition-colors"
                  >
                    <span
                      :class="[
                        'shrink-0 w-5 h-5 rounded-pill border-2 flex items-center justify-center transition-all',
                        isSelected(cat.id)
                          ? 'bg-accent border-accent'
                          : 'border-divider',
                      ]"
                    >
                      <svg
                        v-if="isSelected(cat.id)"
                        class="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </span>
                    <span class="flex-1 text-small text-text-primary">{{ cat.name }}</span>
                    <input
                      type="checkbox"
                      class="sr-only"
                      :checked="isSelected(cat.id)"
                      @change="toggle(cat.id)"
                    />
                  </label>
                </div>
                <p
                  v-if="categories.length === 0"
                  class="text-caption text-text-secondary text-center py-4"
                >
                  No hay categorías disponibles
                </p>
              </div>
            </div>

            <footer class="flex items-center justify-between gap-2 p-4 border-t border-divider shrink-0 bg-surface">
              <button
                class="text-small text-text-secondary font-semibold hover:underline"
                @click="clear"
              >
                Limpiar filtros
              </button>
              <button
                class="h-10 px-5 rounded-pill bg-primary text-white text-small font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all"
                @click="apply"
              >
                Aplicar
              </button>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
