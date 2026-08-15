<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: boolean
  accept?: string
  maxSize?: number
  label?: string
  description?: string
  error?: string
  preview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*/*',
  maxSize: 10 * 1024 * 1024,
  preview: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [file: File]
  error: [message: string]
}>()

const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function openPicker() {
  inputRef.value?.click()
}

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function handleFile(file: File) {
  if (file.size > props.maxSize) {
    emit('error', 'El archivo supera el tamaño máximo permitido')
    return
  }
  emit('select', file)
  emit('update:modelValue', true)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}
</script>

<template>
  <div>
    <div
      :class="[
        'rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-base',
        isDragging ? 'border-accent bg-accent-50' : 'border-divider bg-background',
        error ? 'border-error/40' : '',
      ]"
      @click="openPicker"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <input
        ref="inputRef"
        type="file"
        :accept="accept"
        class="sr-only"
        @change="onChange"
      />
      <div class="w-12 h-12 mx-auto rounded-pill bg-secondary-100 flex items-center justify-center mb-3">
        <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </div>
      <p class="text-small font-medium text-text-primary">{{ label ?? 'Subir archivo' }}</p>
      <p class="text-caption text-text-secondary mt-1">{{ description ?? 'Arrastra o haz clic para seleccionar' }}</p>
    </div>
    <p v-if="error" class="mt-1.5 text-caption text-error" role="alert">{{ error }}</p>
  </div>
</template>
