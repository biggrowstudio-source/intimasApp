<script setup lang="ts">
import { useSettingsStore } from '@stores/settings.store'
import { useUiStore } from '@stores/ui.store'

const settings = useSettingsStore()
const ui = useUiStore()
</script>

<template>
  <AppTopBar title="Configuración" :back="true" />

  <div class="space-y-6">
    <section class="rounded-lg bg-surface shadow-elevation1 divide-y divide-divider overflow-hidden">
      <div class="p-4 flex items-center justify-between">
        <div>
          <p class="text-small font-medium">Notificaciones push</p>
          <p class="text-caption text-text-secondary">Recibe avisos importantes</p>
        </div>
        <AppSwitch v-model="settings.settings.notifications" />
      </div>
      <div class="p-4 flex items-center justify-between">
        <div>
          <p class="text-small font-medium">Correos de marketing</p>
          <p class="text-caption text-text-secondary">Novedades y promociones</p>
        </div>
        <AppSwitch v-model="settings.settings.marketingEmails" />
      </div>
      <div class="p-4 flex items-center justify-between">
        <div>
          <p class="text-small font-medium">Tema oscuro</p>
          <p class="text-caption text-text-secondary">Cambia la apariencia</p>
        </div>
        <AppSwitch :model-value="ui.isDark" @update:model-value="ui.toggleTheme" />
      </div>
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3">Idioma</h2>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="lang in [
            { code: 'es', label: 'Español' },
            { code: 'en', label: 'English' },
          ]"
          :key="lang.code"
          class="p-4 rounded-lg border-2 text-small font-medium transition-colors"
          :class="ui.locale === lang.code ? 'border-accent text-accent bg-accent-50' : 'border-divider text-text-primary'"
          @click="ui.setLocale(lang.code as 'es' | 'en')"
        >
          {{ lang.label }}
        </button>
      </div>
    </section>
  </div>
</template>
