<script setup lang="ts">
interface Props {
  modelValue?: string | number | (string | number)[]
  options: Array<{ label: string; value: string | number }>
  variant?: 'pill' | 'underline'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'pill',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function isActive(value: string | number) {
  return props.modelValue === value
}
</script>

<template>
  <div
    role="tablist"
    :class="[
      'flex gap-1 overflow-x-auto max-w-full touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
      variant === 'pill' ? 'p-1 bg-background rounded-2xl' : 'border-b border-divider w-full',
    ]"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      role="tab"
      :aria-selected="isActive(opt.value)"
      :class="[
        'shrink-0 transition-all duration-base whitespace-nowrap',
        size === 'sm' ? 'h-8 px-3 text-caption' : 'h-10 px-4 text-small',
        variant === 'pill'
          ? [isActive(opt.value) ? 'bg-surface shadow-elevation1 text-text-primary font-semibold' : 'text-text-secondary hover:text-text-primary']
          : ['border-b-2 -mb-px',
             isActive(opt.value) ? 'border-accent text-accent font-semibold' : 'border-transparent text-text-secondary hover:text-text-primary'],
      ]"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
