<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@components/base/AppButton.vue'
import { ShieldCheckIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
</script>

<template>
  <div class="text-center py-4 space-y-6">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-50 text-accent border border-accent/20 mb-2">
      <ShieldCheckIcon class="w-8 h-8" />
    </div>

    <div>
      <h1 class="text-h2 font-editorial text-primary mb-2">Acceso a <span class="uppercase">ÍNTIMAS</span></h1>
      <p class="text-text-secondary text-small max-w-xs mx-auto leading-relaxed">
        El registro de nuevas embajadoras es exclusivo por invitación y gestionado únicamente por la administración.
      </p>
    </div>

    <div class="p-4 rounded-2xl bg-surface border border-divider text-left space-y-2">
      <div class="flex items-start gap-2.5">
        <EnvelopeIcon class="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p class="text-caption text-text-secondary leading-normal">
          Si fuiste registrada por la administración, revisa tu correo electrónico para obtener tu contraseña asignada e iniciar sesión.
        </p>
      </div>
    </div>

    <div class="pt-2">
      <AppButton block variant="primary" @click="router.push('/auth/login')">
        Ir a Iniciar Sesión
      </AppButton>
    </div>
  </div>
</template>
