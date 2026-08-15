<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  side?: 'right' | 'left'
  width?: string
}

withDefaults(defineProps<Props>(), {
  side: 'right',
  width: '320px',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

function close() {
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
        class="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm"
        @click.self="close"
      />
    </Transition>
    <Transition
      enter-active-class="transition duration-base ease-out"
      :enter-from-class="side === 'right' ? 'translate-x-full' : '-translate-x-full'"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-base ease-in"
      leave-from-class="translate-x-0"
      :leave-to-class="side === 'right' ? 'translate-x-full' : '-translate-x-full'"
    >
      <aside
        v-if="modelValue"
        role="dialog"
        aria-modal="true"
        :class="[
          'fixed top-0 bottom-0 z-50 bg-surface shadow-elevation4 flex flex-col',
          side === 'right' ? 'right-0' : 'left-0',
        ]"
        :style="{ width }"
      >
        <header v-if="title || $slots.header" class="flex items-center justify-between gap-3 p-5 border-b border-divider">
          <h2 v-if="title" class="text-title font-semibold">{{ title }}</h2>
          <slot name="header" />
          <button
            class="ml-auto w-9 h-9 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background"
            aria-label="Cerrar"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div class="flex-1 overflow-y-auto p-5">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="p-5 border-t border-divider">
          <slot name="footer" />
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
