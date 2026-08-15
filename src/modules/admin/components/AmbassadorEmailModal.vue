<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppModal from '@components/base/AppModal.vue'
import AppButton from '@components/base/AppButton.vue'
import { useUiStore } from '@stores/ui.store'
import {
  adminUsersService,
  generateRandomPassword,
  type AmbassadorCredentialsInfo,
} from '../services/admin-users.service'
import {
  ClipboardDocumentIcon,
  EnvelopeIcon,
  CheckIcon,
  CodeBracketIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  SparklesIcon,
  KeyIcon,
} from '@heroicons/vue/24/outline'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    credentials: AmbassadorCredentialsInfo | null
    templateType?: 'welcome' | 'password_reminder'
  }>(),
  {
    templateType: 'welcome',
  },
)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const ui = useUiStore()
const activeTab = ref<'preview' | 'text'>('preview')
const selectedTemplateType = ref<'welcome' | 'password_reminder'>('welcome')

const copiedCredentials = ref(false)
const copiedEmailText = ref(false)

const sendingEmail = ref(false)
const emailSent = ref(false)

const customEmail = ref('')
const customPassword = ref('')

watch(
  [() => props.credentials, () => props.templateType],
  ([newCreds, newType]) => {
    if (newType) {
      selectedTemplateType.value = newType
    }
    if (newCreds) {
      customEmail.value = newCreds.email || ''
      if (!newCreds.password || newCreds.password === '(Asignada por Admin)') {
        customPassword.value = generateRandomPassword()
      } else {
        customPassword.value = newCreds.password
      }
      emailSent.value = false
    }
  },
  { immediate: true },
)

function handleRegeneratePassword() {
  customPassword.value = generateRandomPassword()
}

const activeInfo = computed<AmbassadorCredentialsInfo | null>(() => {
  if (!props.credentials) return null
  return {
    ...props.credentials,
    email: customEmail.value.trim() || props.credentials.email,
    password: customPassword.value || props.credentials.password || generateRandomPassword(),
  }
})

const templateData = computed(() => {
  if (!activeInfo.value) return null
  return adminUsersService.getEmailTemplate(activeInfo.value, selectedTemplateType.value)
})

async function handleSendEmailAuto() {
  if (!activeInfo.value) return
  sendingEmail.value = true
  try {
    await adminUsersService.sendCredentialsEmail(activeInfo.value)
    emailSent.value = true
    ui.pushToast({
      title: '¡Correo enviado automáticamente!',
      description: `Se enviaron las credenciales con la contraseña a ${activeInfo.value.email}`,
      variant: 'success',
    })
  } catch (err: any) {
    ui.pushToast({
      title: 'Error al enviar correo',
      description: err.message || 'No se pudo enviar el correo.',
      variant: 'error',
    })
  } finally {
    sendingEmail.value = false
  }
}

function copyCredentials() {
  if (!activeInfo.value) return
  const text = `Credenciales de Embajadora ÍNTIMAS:
- Email: ${activeInfo.value.email}
- Contraseña: ${activeInfo.value.password}
- Código de Embajadora: ${activeInfo.value.ambassadorCode}
- URL: ${activeInfo.value.loginUrl}`

  navigator.clipboard.writeText(text)
  copiedCredentials.value = true
  ui.pushToast({
    title: 'Credenciales copiadas',
    description: 'Se han copiado las credenciales al portapapeles.',
    variant: 'success',
  })
  setTimeout(() => {
    copiedCredentials.value = false
  }, 2500)
}

function copyFullEmail() {
  if (!templateData.value) return
  navigator.clipboard.writeText(templateData.value.bodyText)
  copiedEmailText.value = true
  ui.pushToast({
    title: 'Texto de correo copiado',
    description: 'El cuerpo del correo ha sido copiado al portapapeles.',
    variant: 'success',
  })
  setTimeout(() => {
    copiedEmailText.value = false
  }, 2500)
}

function openMailClient() {
  if (!templateData.value || !activeInfo.value) return
  const mailtoUrl = `mailto:${activeInfo.value.email}?subject=${encodeURIComponent(
    templateData.value.subject,
  )}&body=${encodeURIComponent(templateData.value.bodyText)}`
  window.open(mailtoUrl, '_blank')
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Plantilla de Email - Credenciales de Embajadora"
    description="Revisa o envía la plantilla de correo con las credenciales de acceso creadas por la administración."
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="activeInfo && templateData" class="space-y-4 pt-1">
      <!-- Banner de Estado Enviado -->
      <div
        v-if="emailSent"
        class="p-3 rounded-2xl bg-mint/40 border border-success/30 flex items-center justify-between text-caption text-success font-bold"
      >
        <span class="flex items-center gap-2">
          <CheckCircleIcon class="w-5 h-5 text-success" />
          ¡Correo enviado con éxito a {{ activeInfo.email }}!
        </span>
        <span class="text-[11px] text-text-secondary font-normal">Notificación enviada</span>
      </div>

      <!-- Selector de Tipo de Plantilla (Bienvenida vs Recordatorio de Contraseña) -->
      <div class="p-2 rounded-2xl bg-accent-50/40 border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
        <span class="text-caption font-bold text-text-primary px-1">Tipo de Mensaje a Enviar:</span>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-pill text-caption font-bold transition-all border flex items-center justify-center gap-1.5"
            :class="selectedTemplateType === 'welcome' ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:text-text-primary'"
            @click="selectedTemplateType = 'welcome'"
          >
            <span>💖 Plantilla Bienvenida</span>
          </button>
          <button
            type="button"
            class="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-pill text-caption font-bold transition-all border flex items-center justify-center gap-1.5"
            :class="selectedTemplateType === 'password_reminder' ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:text-text-primary'"
            @click="selectedTemplateType = 'password_reminder'"
          >
            <span>🔑 Recordatorio de Pass</span>
          </button>
        </div>
      </div>

      <!-- Selector de Pestañas y Acciones Principales -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div class="flex items-center gap-1 bg-background p-1 rounded-pill border border-divider">
          <button
            type="button"
            class="px-3 py-1.5 rounded-pill text-caption font-bold transition-all flex items-center gap-1.5"
            :class="activeTab === 'preview' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="activeTab = 'preview'"
          >
            <EyeIcon class="w-4 h-4" />
            Vista Previa HTML
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-pill text-caption font-bold transition-all flex items-center gap-1.5"
            :class="activeTab === 'text' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="activeTab = 'text'"
          >
            <CodeBracketIcon class="w-4 h-4" />
            Texto Plano
          </button>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <AppButton variant="outline" size="sm" @click="copyCredentials">
            <component :is="copiedCredentials ? CheckIcon : ClipboardDocumentIcon" class="w-4 h-4 mr-1 text-accent" />
            Copiar Credenciales
          </AppButton>

          <!-- BOTÓN ENVIAR CORREO AUTOMÁTICAMENTE -->
          <AppButton
            variant="primary"
            size="sm"
            :loading="sendingEmail"
            class="shadow-xs"
            @click="handleSendEmailAuto"
          >
            <component :is="emailSent ? CheckIcon : PaperAirplaneIcon" class="w-4 h-4 mr-1" />
            {{ emailSent ? 'Volver a Enviar Correo' : 'Enviar Correo Automáticamente' }}
          </AppButton>
        </div>
      </div>

      <!-- Control Dual de Email y Contraseña Editable -->
      <div class="p-3.5 rounded-2xl bg-surface border border-divider grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-2xs">
        <div class="space-y-1">
          <label class="text-caption font-bold text-text-primary flex items-center gap-1.5">
            <EnvelopeIcon class="w-4 h-4 text-accent" />
            Correo Destinatario:
          </label>
          <input
            v-model="customEmail"
            type="email"
            class="w-full h-9 px-3 rounded-xl bg-background border border-divider text-small font-medium text-text-primary focus:border-accent outline-none"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-caption font-bold text-text-primary flex items-center gap-1.5">
              <KeyIcon class="w-4 h-4 text-accent" />
              Contraseña Enviada:
            </label>
            <button
              type="button"
              class="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
              @click="handleRegeneratePassword"
            >
              <SparklesIcon class="w-3 h-3" />
              Generar Nueva
            </button>
          </div>
          <input
            v-model="customPassword"
            type="text"
            class="w-full h-9 px-3 rounded-xl bg-background border border-divider font-mono font-bold text-small text-text-primary focus:border-accent outline-none"
            placeholder="Ingresa contraseña..."
          />
        </div>
      </div>

      <!-- Resumen de Datos Clave -->
      <div class="p-3 rounded-2xl bg-accent-50/50 border border-accent/20 flex flex-wrap items-center justify-between gap-2 text-caption">
        <div>
          <span class="text-text-secondary">Embajadora: </span>
          <strong class="text-text-primary">{{ activeInfo.firstName }} {{ activeInfo.lastName }}</strong>
        </div>
        <div>
          <span class="text-text-secondary">Email: </span>
          <strong class="text-accent">{{ activeInfo.email }}</strong>
        </div>
        <div>
          <span class="text-text-secondary">Contraseña: </span>
          <code class="px-2 py-0.5 rounded bg-surface border font-mono font-bold text-text-primary">{{ activeInfo.password }}</code>
        </div>
        <div>
          <span class="text-text-secondary">Código: </span>
          <strong class="font-mono text-text-primary">{{ activeInfo.ambassadorCode }}</strong>
        </div>
      </div>

      <!-- Contenido de la Plantilla -->
      <div v-if="activeTab === 'preview'" class="border border-divider rounded-2xl overflow-hidden bg-surface">
        <div class="p-3 bg-background border-b border-divider text-caption text-text-secondary font-mono flex items-center gap-2">
          <span class="font-bold text-text-primary">Asunto:</span> {{ templateData.subject }}
        </div>
        <div class="p-4 max-h-[420px] overflow-y-auto" v-html="templateData.htmlContent"></div>
      </div>

      <div v-else class="border border-divider rounded-2xl overflow-hidden bg-surface">
        <div class="p-3 bg-background border-b border-divider flex items-center justify-between">
          <span class="text-caption font-mono text-text-secondary"><strong class="text-text-primary">Asunto:</strong> {{ templateData.subject }}</span>
          <button
            type="button"
            class="text-caption font-bold text-accent hover:underline flex items-center gap-1"
            @click="copyFullEmail"
          >
            <component :is="copiedEmailText ? CheckIcon : ClipboardDocumentIcon" class="w-3.5 h-3.5" />
            Copiar Texto
          </button>
        </div>
        <pre class="p-4 text-small font-mono whitespace-pre-wrap text-text-primary max-h-[420px] overflow-y-auto leading-relaxed">{{ templateData.bodyText }}</pre>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-divider flex items-center justify-between">
        <button
          type="button"
          class="text-caption text-text-secondary hover:text-accent flex items-center gap-1"
          @click="openMailClient"
        >
          <EnvelopeIcon class="w-4 h-4" />
          <span>Abrir en cliente externo de correo (mailto)</span>
        </button>

        <AppButton variant="outline" size="sm" @click="emit('update:modelValue', false)">
          Cerrar
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>
