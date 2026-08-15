<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()

const email = ref('')
const sent = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!email.value) {
    error.value = 'Ingresa tu email'
    return
  }
  try {
    await auth.resetPassword(email.value)
    sent.value = true
    ui.pushToast({ title: 'Email enviado', description: 'Revisa tu bandeja', variant: 'success' })
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <div>
    <div class="text-center mb-8">
      <h1 class="text-h2 font-editorial text-primary mb-2">Recuperar contraseña</h1>
      <p class="text-text-secondary text-small">Te enviaremos un enlace para restablecerla</p>
    </div>

    <form v-if="!sent" class="space-y-4" @submit.prevent="submit">
      <AppInput v-model="email" type="email" label="Email" required />
      <p v-if="error" class="text-caption text-error" role="alert">{{ error }}</p>
      <AppButton type="submit" block>Enviar enlace</AppButton>
    </form>

    <div v-else class="text-center space-y-4">
      <div class="w-16 h-16 mx-auto rounded-pill bg-success/15 flex items-center justify-center">
        <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <p class="text-small text-text-primary">Revisa tu email para restablecer tu contraseña.</p>
    </div>

    <p class="mt-6 text-center text-small text-text-secondary">
      <RouterLink to="/auth/login" class="text-accent font-semibold hover:underline">Volver a iniciar sesión</RouterLink>
    </p>
  </div>
</template>
