<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@stores/auth.store'

const auth = useAuthStore()

const isVisible = ref(false)
const isFadingOut = ref(false)

onMounted(() => {
  const alreadyShown = sessionStorage.getItem('intimas_welcome_shown')
  if (!alreadyShown && auth.isAuthenticated) {
    isVisible.value = true
    setTimeout(() => dismiss(), 3500)
  }
})

function dismiss() {
  if (isFadingOut.value) return
  isFadingOut.value = true
  sessionStorage.setItem('intimas_welcome_shown', 'true')
  setTimeout(() => { isVisible.value = false }, 700)
}

const firstName = computed(() => {
  if (auth.profile?.first_name) return auth.profile.first_name
  if (auth.profile?.full_name) return auth.profile.full_name.split(' ')[0]
  return null
})
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
    :style="{
      background: 'linear-gradient(160deg, #F9C5D1 0%, #F4A0B4 50%, #E8799A 100%)',
      opacity: isFadingOut ? 0 : 1,
      transition: 'opacity 0.7s ease',
    }"
    @click="dismiss"
  >
    <p v-if="firstName" class="text-white text-2xl font-light tracking-widest uppercase mb-3 opacity-80">
      Hola, {{ firstName }}
    </p>
    <h1 class="text-white text-4xl sm:text-5xl font-bold text-center px-8 leading-tight" style="font-family: Georgia, serif; letter-spacing: 0.02em;">
      Bienvenida de<br/>vuelta 🌸
    </h1>
    <p class="text-white/75 text-base mt-6 font-light tracking-wide">
      Tu espacio Íntimas te espera
    </p>
  </div>
</template>
