<script setup lang="ts">
interface Toast {
  id: number
  title: string
  description?: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

const props = defineProps<{ toasts: Toast[] }>()

defineEmits<{
  dismiss: [id: number]
}>()

function variantConfig(variant: Toast['variant']) {
  return {
    success: {
      bg: 'from-[#F7FCF0] to-[#EFF8E6]',
      border: 'border-emerald-200/70',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      bar: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      label: 'text-emerald-700',
      path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
    error: {
      bg: 'from-[#FFF5F7] to-[#FEF0F2]',
      border: 'border-rose-200/70',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-500',
      bar: 'bg-gradient-to-r from-rose-400 to-pink-400',
      label: 'text-rose-700',
      path: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
    },
    warning: {
      bg: 'from-[#FFFBF0] to-[#FEF6E4]',
      border: 'border-amber-200/70',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      bar: 'bg-gradient-to-r from-amber-400 to-orange-400',
      label: 'text-amber-700',
      path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
    },
    info: {
      bg: 'from-[#FFF5FA] to-[#FDEEF6]',
      border: 'border-pink-200/70',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-500',
      bar: 'bg-gradient-to-r from-pink-400 to-rose-400',
      label: 'text-pink-700',
      path: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
    },
  }[variant]
}
</script>

<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      class="fixed top-4 right-4 left-4 tablet:left-auto tablet:right-6 tablet:top-6 z-[60] flex flex-col gap-2.5 pointer-events-none"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-[-10px] scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-[-6px] scale-95"
      >
        <div
          v-for="toast in props.toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur-md',
            'bg-gradient-to-br',
            variantConfig(toast.variant).bg,
            variantConfig(toast.variant).border,
            'min-w-[280px] max-w-[360px]',
          ]"
        >
          <!-- Contenido del toast -->
          <div class="flex items-center gap-3 px-4 py-3.5">
            <!-- Ícono en círculo suave -->
            <div
              :class="[
                'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                variantConfig(toast.variant).iconBg,
              ]"
            >
              <svg
                class="w-4 h-4"
                :class="variantConfig(toast.variant).iconColor"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="variantConfig(toast.variant).path" />
              </svg>
            </div>

            <!-- Texto -->
            <div class="flex-1 min-w-0">
              <p
                class="font-semibold text-[13px] leading-snug text-text-primary"
              >
                {{ toast.title }}
              </p>
              <p
                v-if="toast.description"
                class="text-[12px] text-text-secondary mt-0.5 leading-relaxed"
              >
                {{ toast.description }}
              </p>
            </div>

            <!-- Botón cerrar -->
            <button
              class="shrink-0 p-1 rounded-lg text-text-secondary/50 hover:text-text-secondary hover:bg-black/5 transition-colors"
              aria-label="Cerrar"
              @click="$emit('dismiss', toast.id)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Shimmer top highlight -->
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
