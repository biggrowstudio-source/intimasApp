<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import AppCheckbox from '@components/base/AppCheckbox.vue'
import logoSvg from '@/assets/IntimasByLorena_Version_Vector.svg'
import {
  SparklesIcon,
  TrashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const rememberMe = ref(true)
const showPassword = ref(false)
const hasSavedCredentials = ref(false)
const error = ref('')

const SAVED_KEY = 'intimas_saved_credentials'

onMounted(() => {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.email && parsed.password) {
        form.email = parsed.email
        form.password = parsed.password
        rememberMe.value = true
        hasSavedCredentials.value = true
      }
    }
  } catch {
    // ignorar error de parseo
  }
})

function clearSavedCredentials() {
  localStorage.removeItem(SAVED_KEY)
  form.email = ''
  form.password = ''
  hasSavedCredentials.value = false
  ui.pushToast({ title: 'Datos de acceso limpiados', variant: 'info' })
}

async function submit() {
  error.value = ''
  if (!form.email || !form.password) {
    error.value = 'Por favor ingresa tu email y contraseña'
    return
  }
  try {
    if (rememberMe.value) {
      localStorage.setItem(SAVED_KEY, JSON.stringify({ email: form.email, password: form.password }))
    } else {
      localStorage.removeItem(SAVED_KEY)
    }

    await auth.signIn(form.email, form.password)
    const redirect = (route.query.redirect as string | undefined) ?? '/'
    router.push(redirect)
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Tarjeta Glassmorphic Femenina y Sofisticada -->
    <div class="bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-9 shadow-elevation3 transition-all duration-300">
      
      <!-- Cabecera con el Logo vectorial oficial -->
      <div class="flex flex-col items-center text-center mb-8">
        <div class="relative mb-3">
          <img
            :src="logoSvg"
            alt="Intimas By Lorena"
            class="w-56 sm:w-64 h-auto object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>
        <p class="text-caption font-semibold uppercase tracking-[0.25em] text-accent-500 mt-1">
          Comunidad de Embajadoras
        </p>
      </div>

      <!-- Banner sutil cuando hay credenciales autoguardadas -->
      <Transition name="fade">
        <div
          v-if="hasSavedCredentials"
          class="mb-6 p-3.5 rounded-2xl bg-accent-50/80 border border-accent/20 flex items-center justify-between text-caption shadow-xs"
        >
          <span class="flex items-center gap-2 text-accent-600 font-medium">
            <SparklesIcon class="w-4 h-4 shrink-0 text-accent animate-pulse" />
            Acceso rápido activo. Presiona Iniciar sesión.
          </span>
          <button
            type="button"
            class="text-text-secondary hover:text-error p-1 rounded-lg hover:bg-error/10 transition-colors"
            title="Borrar datos guardados"
            @click="clearSavedCredentials"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </Transition>

      <!-- Formulario de Inicio de Sesión -->
      <form class="space-y-4" @submit.prevent="submit">
        <!-- Campo Email con ícono -->
        <div class="space-y-1.5">
          <label for="login-email" class="block text-caption font-medium text-text-primary">
            Correo Electrónico
          </label>
          <div class="relative flex items-center">
            <EnvelopeIcon class="w-5 h-5 absolute left-3.5 text-accent-400 pointer-events-none" />
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              autocomplete="username"
              required
              class="w-full pl-11 pr-4 py-3 bg-surface/60 border border-divider/80 rounded-2xl text-body text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition-all duration-200"
            />
          </div>
        </div>

        <!-- Campo Contraseña con toggle ver/ocultar -->
        <div class="space-y-1.5">
          <label for="login-password" class="block text-caption font-medium text-text-primary">
            Contraseña
          </label>
          <div class="relative flex items-center">
            <LockClosedIcon class="w-5 h-5 absolute left-3.5 text-accent-400 pointer-events-none" />
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              class="w-full pl-11 pr-11 py-3 bg-surface/60 border border-divider/80 rounded-2xl text-body text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition-all duration-200"
            />
            <button
              type="button"
              class="absolute right-3.5 text-text-secondary/60 hover:text-accent p-1 transition-colors"
              @click="showPassword = !showPassword"
            >
              <EyeIcon v-if="!showPassword" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Checkbox de Recordar Datos con Check Blanco SVG -->
        <div class="flex items-center justify-between pt-1">
          <AppCheckbox v-model="rememberMe" label="Guardar mis datos para ingreso rápido" />
        </div>

        <!-- Alerta de Error -->
        <Transition name="fade">
          <p v-if="error" class="text-caption font-medium text-error bg-error/10 p-3 rounded-xl border border-error/20" role="alert">
            {{ error }}
          </p>
        </Transition>

        <!-- Botón Principal con Gradiente de Lujo -->
        <button
          type="submit"
          :disabled="auth.isLoading"
          class="w-full py-3.5 px-6 mt-2 text-white font-medium text-body rounded-2xl shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/35 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          style="background: #C96B7A;"
          @mouseover="$event.currentTarget.style.background='#B85C6B'"
          @mouseleave="$event.currentTarget.style.background='#C96B7A'"
        >
          <span v-if="!auth.isLoading">Iniciar Sesión</span>
          <span v-else class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Iniciando...
          </span>
          <ArrowRightIcon v-if="!auth.isLoading" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <!-- Pie con enlace a recuperación -->
      <div class="mt-6 pt-4 border-t border-divider/60 text-center">
        <RouterLink
          to="/auth/recuperar"
          class="inline-block text-caption font-medium text-text-secondary hover:text-accent transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
