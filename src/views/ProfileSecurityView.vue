<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()

const newPassword = ref('')
const error = ref('')
const saving = ref(false)

async function updatePassword() {
  error.value = ''
  if (newPassword.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  saving.value = true
  try {
    const { supabase } = await import('~supabase/client')
    const { error: err } = await supabase.auth.updateUser({ password: newPassword.value })
    if (err) throw err
    ui.pushToast({ title: 'Contraseña actualizada', variant: 'success' })
    newPassword.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppTopBar title="Seguridad" :back="true" />

  <div class="space-y-5">
    <section class="rounded-lg bg-surface shadow-elevation1 p-5">
      <h2 class="text-subtitle font-semibold text-text-primary">Cambiar contraseña</h2>
      <p class="text-caption text-text-secondary mt-1 mb-4">Te recomendamos usar una combinación segura.</p>
      <form class="space-y-3" @submit.prevent="updatePassword">
        <AppInput
          v-model="newPassword"
          type="password"
          label="Nueva contraseña"
          hint="Mínimo 8 caracteres"
          autocomplete="new-password"
          required
        />
        <p v-if="error" class="text-caption text-error" role="alert">{{ error }}</p>
        <AppButton type="submit" :loading="saving">Actualizar contraseña</AppButton>
      </form>
    </section>

    <section class="rounded-lg bg-surface shadow-elevation1 p-5">
      <h2 class="text-subtitle font-semibold text-text-primary">Sesión</h2>
      <p class="text-caption text-text-secondary mt-1 mb-3">Sesión iniciada como <strong>{{ auth.user?.email }}</strong></p>
    </section>
  </div>
</template>
