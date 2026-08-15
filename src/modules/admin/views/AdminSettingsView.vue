<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'
import {
  Cog6ToothIcon,
  MegaphoneIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import AppTopBar from '@components/base/AppTopBar.vue'
import AppButton from '@components/base/AppButton.vue'
import AppInput from '@components/base/AppInput.vue'
import AppTextarea from '@components/base/AppTextarea.vue'

const ui = useUiStore()
const qc = useQueryClient()

const announcementMessage = ref('')
const isAnnouncementActive = ref(true)
const commissionRate = ref<number>(25)

const { data: settings, isLoading } = useQuery({
  queryKey: ['admin', 'settings'],
  queryFn: async () => {
    const { data, error } = await supabase.from('settings').select('*')
    if (error) throw error

    const map: Record<string, any> = {}
    ;(data ?? []).forEach((item) => {
      map[item.key] = item.value
    })

    if (map['home_announcement']) {
      announcementMessage.value = map['home_announcement'].message || ''
      isAnnouncementActive.value = map['home_announcement'].active ?? true
    }
    if (map['commission_rate']) {
      commissionRate.value = map['commission_rate'].rate ?? 25
    }

    return map
  },
})

const saveAnnouncement = useMutation({
  mutationFn: async () => {
    const { error } = await supabase.from('settings').upsert({
      key: 'home_announcement',
      value: {
        message: announcementMessage.value.trim(),
        active: isAnnouncementActive.value,
        updated_at: new Date().toISOString(),
      } as never,
    }, { onConflict: 'key' })

    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
    qc.invalidateQueries({ queryKey: ['home'] })
    ui.pushToast({ title: 'Anuncio publicado', description: 'El mensaje del banner fue actualizado', variant: 'success' })
  },
  onError: (err: any) => {
    ui.pushToast({ title: 'Error al guardar', description: err.message, variant: 'error' })
  },
})

const saveCommission = useMutation({
  mutationFn: async () => {
    if (commissionRate.value < 0 || commissionRate.value > 100) {
      throw new Error('La tasa debe estar entre 0% y 100%')
    }
    const { error } = await supabase.from('settings').upsert({
      key: 'commission_rate',
      value: { rate: commissionRate.value } as never,
    }, { onConflict: 'key' })

    if (error) throw error
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
    qc.invalidateQueries({ queryKey: ['orders'] })
    ui.pushToast({ title: 'Tasa de comisión guardada', description: `Nueva tasa: ${commissionRate.value}%`, variant: 'success' })
  },
  onError: (err: any) => {
    ui.pushToast({ title: 'Error', description: err.message, variant: 'error' })
  },
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <AppTopBar title="Configuración del Sistema" :back="true" />

    <!-- ENCABEZADO -->
    <header class="pt-1 border-b border-divider pb-4">
      <h1 class="text-display font-editorial text-text-primary leading-none mb-1 flex items-center gap-2">
        <Cog6ToothIcon class="w-8 h-8 text-accent" />
        Configuración General
      </h1>
      <p class="text-small text-text-secondary">
        Controla los avisos globales, porcentajes de comisiones y parámetros de la plataforma.
      </p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- SECCIÓN 1: ANUNCIO GLOBAL EN EL HOME -->
      <section class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-divider">
          <div class="flex items-center gap-2">
            <MegaphoneIcon class="w-5 h-5 text-accent" />
            <h2 class="text-title font-bold text-text-primary">Anuncio Global en Home</h2>
          </div>
          <span class="text-caption font-semibold px-2 py-0.5 rounded-full" :class="isAnnouncementActive ? 'bg-mint text-success' : 'bg-surface border border-divider text-text-secondary'">
            {{ isAnnouncementActive ? 'Activo' : 'Oculto' }}
          </span>
        </div>

        <p class="text-caption text-text-secondary">
          Mensaje destacado visible en la franja superior de la página principal para todas las usuarias.
        </p>

        <AppTextarea
          v-model="announcementMessage"
          label="Mensaje del Anuncio"
          placeholder="Ej: ¡Gran Lanzamiento de la Nueva Colección de Lencería Fina! Aprovecha los beneficios de esta temporada..."
          :rows="3"
        />

        <div class="flex items-center justify-between pt-2">
          <label class="flex items-center gap-2 cursor-pointer text-caption font-semibold text-text-primary">
            <input
              v-model="isAnnouncementActive"
              type="checkbox"
              class="w-4 h-4 text-accent rounded border-divider focus:ring-accent"
            />
            <span>Mostrar Banner en Home</span>
          </label>

          <AppButton
            variant="primary"
            :disabled="saveAnnouncement.isPending.value"
            @click="saveAnnouncement.mutate()"
          >
            Guardar Anuncio
          </AppButton>
        </div>
      </section>

      <!-- SECCIÓN 2: TASA GLOBAL DE COMISIONES -->
      <section class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-divider">
          <div class="flex items-center gap-2">
            <CurrencyDollarIcon class="w-5 h-5 text-success" />
            <h2 class="text-title font-bold text-text-primary">Porcentaje de Comisión</h2>
          </div>
          <span class="text-title font-extrabold text-accent font-mono">{{ commissionRate }}%</span>
        </div>

        <p class="text-caption text-text-secondary">
          Tasa base de comisión que acumula la red de embajadoras al registrar pedidos aprobados.
        </p>

        <div class="space-y-2">
          <label class="block text-caption font-bold text-text-primary">Tasa de Comisión (%):</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="commissionRate"
              type="number"
              min="0"
              max="100"
              class="w-28 h-11 px-3 rounded-xl border border-divider bg-background text-title font-bold text-accent outline-none focus:border-accent"
            />
            <span class="text-caption text-text-secondary font-medium">% sobre venta total</span>
          </div>
        </div>

        <div class="pt-4 flex justify-end">
          <AppButton
            variant="primary"
            :disabled="saveCommission.isPending.value"
            @click="saveCommission.mutate()"
          >
            Actualizar Tasa
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>
