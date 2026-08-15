<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import { authService } from '@services/supabase/auth.service'
import dayjs from '@utils/dayjs'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const form = reactive({
  firstName: auth.profile?.firstName ?? '',
  lastName: auth.profile?.lastName ?? '',
  city: auth.profile?.city ?? '',
  birthday: auth.profile?.birthday ?? '',
  bio: auth.profile?.bio ?? '',
})

const errors = ref<Record<string, string>>({})
const avatarFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const saving = ref(false)

function onAvatarSelect(file: File) {
  avatarFile.value = file
  if (file && typeof window !== 'undefined' && window.URL) {
    try {
      previewUrl.value = window.URL.createObjectURL(file)
    } catch {
      previewUrl.value = null
    }
  }
}

async function submit() {
  if (!auth.profile) return
  saving.value = true
  errors.value = {}
  try {
    let photoUrl = auth.profile.photoUrl ?? null
    if (avatarFile.value && auth.user?.id) {
      photoUrl = await authService.uploadAvatar(auth.user.id, avatarFile.value)
    }
    await authService.updateProfile(auth.profile.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      city: form.city || null,
      birthday: form.birthday || null,
      bio: form.bio || null,
      photoUrl,
    })
    await auth.loadProfile()
    ui.pushToast({ title: 'Perfil actualizado', variant: 'success' })
    router.push('/perfil')
  } catch (e) {
    ui.pushToast({ title: 'Error', description: (e as Error).message, variant: 'error' })
  } finally {
    saving.value = false
  }
}

const maxBirthday = dayjs().format('YYYY-MM-DD')
</script>

<template>
  <AppTopBar title="Editar perfil" :back="true" />

  <form class="space-y-5" @submit.prevent="submit">
    <div class="flex flex-col items-center gap-3 py-2">
      <AppAvatar
        :src="previewUrl || auth.profile?.photoUrl"
        :name="`${form.firstName} ${form.lastName}`"
        size="xl"
      />
      <AppUpload
        accept="image/*"
        label="Cambiar foto"
        description="JPG, PNG o WEBP, máximo 3MB"
        @select="onAvatarSelect"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <AppInput v-model="form.firstName" label="Nombre" required />
      <AppInput v-model="form.lastName" label="Apellido" required />
    </div>
    <AppInput v-model="form.city" label="Ciudad" />
    <AppInput v-model="form.birthday" type="date" label="Fecha de nacimiento" :max="maxBirthday" />
    <AppTextarea v-model="form.bio" label="Biografía" placeholder="Cuéntanos sobre ti..." :rows="4" />

    <div class="flex justify-end gap-2 pt-4">
      <AppButton variant="ghost" type="button" @click="router.back()">Cancelar</AppButton>
      <AppButton type="submit" :loading="saving">Guardar</AppButton>
    </div>
  </form>
</template>
