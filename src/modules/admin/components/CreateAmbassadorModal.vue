<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppModal from '@components/base/AppModal.vue'
import AppInput from '@components/base/AppInput.vue'
import AppButton from '@components/base/AppButton.vue'
import { useUiStore } from '@stores/ui.store'
import {
  adminUsersService,
  generateRandomPassword,
  generateAmbassadorCode,
  type AmbassadorCredentialsInfo,
} from '../services/admin-users.service'
import { SparklesIcon, KeyIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  created: [credentials: AmbassadorCredentialsInfo]
}>()

const ui = useUiStore()
const loading = ref(false)
const showPassword = ref(true)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: generateRandomPassword(),
  phone: '',
  city: '',
  ambassadorCode: generateAmbassadorCode(),
  sendEmailNotice: true,
})

const errorMessage = ref('')

function handleGeneratePassword() {
  form.password = generateRandomPassword()
}

function handleGenerateCode() {
  form.ambassadorCode = generateAmbassadorCode()
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
    errorMessage.value = 'Por favor completa los campos requeridos (Nombre, Apellido, Email y Contraseña).'
    return
  }

  if (form.password.length < 6) {
    errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  loading.value = true
  try {
    const res = await adminUsersService.createAmbassador({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      ambassadorCode: form.ambassadorCode.trim() || undefined,
    })

    const credentialsInfo: AmbassadorCredentialsInfo = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      ambassadorCode: res.ambassadorCode,
      loginUrl: `${window.location.origin}/auth/login`,
    }

    // Enviar correo automáticamente
    await adminUsersService.sendCredentialsEmail(credentialsInfo)

    ui.pushToast({
      title: '¡Embajadora Registrada y Correo Enviado!',
      description: `Se creó la cuenta y se envió el correo con las credenciales a ${form.email}.`,
      variant: 'success',
    })

    emit('created', credentialsInfo)
    closeModal()
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al crear la embajadora.'
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
    title="Registrar Nueva Embajadora"
    description="Asigna las credenciales iniciales para dar acceso exclusivo a la plataforma."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="space-y-4 pt-2" @submit.prevent="handleSubmit">
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
        label="Correo Electrónico *"
        placeholder="embajadora@ejemplo.com"
        required
      />

      <!-- Contraseña Asignada por Admin -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-small font-semibold text-text-primary flex items-center gap-1.5">
            <KeyIcon class="w-4 h-4 text-accent" />
            Contraseña Asignada por Admin *
          </label>
          <button
            type="button"
            class="text-caption font-bold text-accent hover:underline flex items-center gap-1 active:scale-95 transition-transform"
            @click="handleGeneratePassword"
          >
            <SparklesIcon class="w-3.5 h-3.5" />
            Generar Aleatoria
          </button>
        </div>

        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="w-full h-11 px-4 pr-12 rounded-xl bg-surface border border-divider text-small font-mono focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            placeholder="Ingresa o genera contraseña..."
            required
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
            @click="showPassword = !showPassword"
          >
            <component :is="showPassword ? EyeSlashIcon : EyeIcon" class="w-5 h-5" />
          </button>
        </div>
        <p class="text-caption text-text-secondary">
          Esta será la contraseña inicial asignada. Se enviará a la embajadora en la plantilla de correo.
        </p>
      </div>

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
        <div class="flex items-center justify-between">
          <label class="text-small font-semibold text-text-primary">Código de Embajadora</label>
          <button
            type="button"
            class="text-caption font-bold text-accent hover:underline flex items-center gap-1 active:scale-95 transition-transform"
            @click="handleGenerateCode"
          >
            <SparklesIcon class="w-3.5 h-3.5" />
            Generar Código
          </button>
        </div>
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
          <EnvelopeIcon class="w-4 h-4 mr-1.5" />
          Registrar & Ver Plantilla
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
