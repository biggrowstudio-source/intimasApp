<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(defineProps<{
  title: string
  defaultOpen?: boolean
  storageKey?: string
  count?: number | null
}>(), {
  defaultOpen: true,
  storageKey: undefined,
  count: null,
})

const STORAGE_PREFIX = 'intimas_collapsed_'

function loadInitial(): boolean {
  if (!props.storageKey) return props.defaultOpen
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + props.storageKey)
    if (stored === null) return props.defaultOpen
    return stored === '0'
  } catch {
    return props.defaultOpen
  }
}

const isOpen = ref(loadInitial())

watch(isOpen, (v) => {
  if (!props.storageKey) return
  try {
    localStorage.setItem(STORAGE_PREFIX + props.storageKey, v ? '0' : '1')
  } catch {
    // ignore quota / privacy errors
  }
})

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <section>
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 px-1 py-1 group"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <h2 class="text-title font-semibold text-text-primary">{{ title }}</h2>
        <span
          v-if="count !== null && count > 0"
          class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill bg-blush text-accent-500 text-caption font-bold"
        >
          {{ count }}
        </span>
      </div>
      <ChevronDownIcon
        :class="[
          'w-5 h-5 text-text-secondary transition-transform duration-base',
          isOpen ? 'rotate-0' : '-rotate-90',
        ]"
      />
    </button>

    <Transition
      enter-active-class="transition-all duration-300 ease-out overflow-hidden"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[3000px]"
      leave-from-class="opacity-100 max-h-[3000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-show="isOpen" class="pt-4">
        <slot />
      </div>
    </Transition>
  </section>
</template>
