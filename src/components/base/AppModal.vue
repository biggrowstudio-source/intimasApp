<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

function onBackdrop() {
  emit('update:modelValue', false)
  emit('close')
}
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm"
        @click.self="closeOnBackdrop && onBackdrop()"
      >
        <Transition
          enter-active-class="transition duration-base ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-fast ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            :class="[
              'relative w-full max-h-[90vh] bg-surface rounded-xl shadow-elevation3 overflow-hidden flex flex-col',
              size === 'sm' ? 'max-w-sm' : '',
              size === 'md' ? 'max-w-md' : '',
              size === 'lg' ? 'max-w-2xl' : '',
              size === 'xl' ? 'max-w-4xl' : '',
            ]"
            @click.stop
          >
            <header v-if="title || $slots.header" class="flex items-start justify-between gap-4 p-6 pb-3 shrink-0 border-b border-divider">
              <div class="min-w-0 flex-1">
                <h2 v-if="title" class="text-title font-semibold text-text-primary">{{ title }}</h2>
                <p v-if="description" class="mt-1 text-small text-text-secondary">{{ description }}</p>
              </div>
              <button
                class="shrink-0 w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background transition-colors"
                aria-label="Cerrar"
                @click="onBackdrop"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div class="px-6 py-4 overflow-y-auto flex-1 min-h-0">
              <slot />
            </div>
            <footer v-if="$slots.footer" class="flex items-center justify-end gap-2 p-6 pt-3 border-t border-divider shrink-0">
              <slot name="footer" />
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
