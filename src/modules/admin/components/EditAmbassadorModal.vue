<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import AppModal from '@components/base/AppModal.vue'
import AppInput from '@components/base/AppInput.vue'
import AppButton from '@components/base/AppButton.vue'
import AppAvatar from '@components/base/AppAvatar.vue'
import { useUiStore } from '@stores/ui.store'
import { supabase } from '~supabase/client'
import { uploadAvatarFile } from '@/services/avatar-upload.service'
import { CameraIcon, PhotoIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: boolean
  user: any | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  updated: []
}>()

const ui = useUiStore()
const loading = ref(false)
const uploadingPhoto = ref(false)
const errorMessage = ref('')
const photoUrl = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  ambassadorCode: '',
})

watch(
  () => props.user,
  (u) => {
    if (u) {
      form.id = u.id
      form.firstName = u.first_name || ''
      form.lastName = u.last_name || ''
      form.email = u.email || ''
      form.phone = u.phone || ''
      form.city = u.city || ''
      form.ambassadorCode = u.ambassador_code || ''
      photoUrl.value = u.photo_url || ''
    }
  },
  { immediate: true },
)

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingPhoto.value = true
  errorMessage.value = ''
  try {
    const uploadedUrl = await uploadAvatarFile(file, form.id || 'new')
    photoUrl.value = uploadedUrl

    if (form.id) {
      await supabase.from('profiles').update({ photo_url: uploadedUrl }).eq('id', form.id)
    }

    ui.pushToast({
      title: '¡Foto de perfil actualizada!',
      description: 'La imagen ha sido guardada en el bucket avatars (máx 3MB).',
      variant: 'success',
    })
    emit('updated')
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al subir la imagen.'
    ui.pushToast({
      title: 'Error de imagen',
      description: err.message,
      variant: 'error',
    })
  } finally {
    uploadingPhoto.value = false
  }
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!form.firstName.trim() || !form.lastName.trim()) {
    errorMessage.value = 'El nombre y apellido son obligatorios.'
    return
  }

  loading.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        ambassador_code: form.ambassadorCode.trim() || null,
        photo_url: photoUrl.value || null,
      })
      .eq('id', form.id)

    if (error) throw error

    ui.pushToast({
      title: 'Perfil actualizado',
      description: `Se guardaron los datos de ${form.firstName} correctamente.`,
      variant: 'success',
    })

    emit('updated')
    closeModal()
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al actualizar el perfil.'
  } finally {
    loading.value = false
  }
}

function closeModal() {
  emit('update:modelValue', false)
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Editar Perfil de Usuaria"
    description="Modifica los datos personales, avatar y contacto de la embajadora."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form v-if="user" class="space-y-4 pt-2" @submit.prevent="handleSubmit">
      <!-- Selector de Avatar -->
      <div class="flex flex-col items-center justify-center p-4 bg-background rounded-2xl border border-divider space-y-3">
        <div class="relative group">
          <AppAvatar
            :src="photoUrl"
            :name="`${form.firstName} ${form.lastName}`"
            size="xl"
            class="border-2 border-accent/20 shadow-md"
          />
          <button
            type="button"
            class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            title="Cambiar foto de perfil"
            @click="fileInputRef?.click()"
          >
            <CameraIcon class="w-4 h-4" />
          </button>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden"
          @change="handleFileChange"
        />

        <div class="text-center space-y-1">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            :loading="uploadingPhoto"
            @click="fileInputRef?.click()"
          >
            <PhotoIcon class="w-4 h-4 mr-1.5 text-accent" />
            {{ photoUrl ? 'Cambiar Foto de Perfil' : 'Subir Foto de Perfil' }}
          </AppButton>
          <p class="text-[11px] text-text-secondary font-medium">
            Formato JPG, PNG o WEBP. <strong>Máximo 3 MB</strong> por foto.
          </p>
        </div>
      </div>
      <!-- Nombre y Apellidos -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppInput
          v-model="form.firstName"
          label="Nombre *"
          placeholder="Ej. Carolina"
          required
        />
        <AppInput
          v-model="form.lastName"
          label="Apellidos *"
          placeholder="Ej. Gómez Pérez"
          required
        />
      </div>

      <!-- Email -->
      <AppInput
        v-model="form.email"
        type="email"
        label="Correo Electrónico"
        placeholder="embajadora@ejemplo.com"
      />

      <!-- Teléfono y Ciudad -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppInput
          v-model="form.phone"
          label="Teléfono / WhatsApp"
          placeholder="+57 300 123 4567"
        />
        <AppInput
          v-model="form.city"
          label="Ciudad / Ubicación"
          placeholder="Ej. Medellín"
        />
      </div>

      <!-- Código de Embajadora -->
      <div class="space-y-1.5">
        <label class="text-small font-semibold text-text-primary">Código de Embajadora</label>
        <input
          v-model="form.ambassadorCode"
          type="text"
          class="w-full h-11 px-4 rounded-xl bg-surface border border-divider text-small font-mono uppercase focus:border-accent focus:ring-1 focus:ring-accent outline-none"
          placeholder="Ej. INT-4092"
        />
      </div>

      <!-- Error -->
      <p v-if="errorMessage" class="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-caption font-medium">
        {{ errorMessage }}
      </p>

      <div class="pt-4 flex items-center justify-end gap-3 border-t border-divider">
        <AppButton type="button" variant="outline" @click="closeModal">
          Cancelar
        </AppButton>
        <AppButton type="submit" variant="primary" :loading="loading">
          Guardar Cambios
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
