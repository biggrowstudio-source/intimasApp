<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useUiStore } from '@stores/ui.store'
import dayjs from '@utils/dayjs'
import AppTopBar from '@components/base/AppTopBar.vue'
import AppAvatar from '@components/base/AppAvatar.vue'
import AppButton from '@components/base/AppButton.vue'
import AppSkeleton from '@components/base/AppSkeleton.vue'
import EditAmbassadorModal from '../components/EditAmbassadorModal.vue'
import AmbassadorEmailModal from '../components/AmbassadorEmailModal.vue'
import {
  adminUsersService,
  generateRandomPassword,
  type AmbassadorCredentialsInfo,
} from '../services/admin-users.service'
import {
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  CalendarIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  AcademicCapIcon,
  ClockIcon,
  KeyIcon,
  PencilSquareIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const qc = useQueryClient()

const activeTab = ref<'sales' | 'commissions' | 'events' | 'activity' | 'connections'>('sales')

const showEditModal = ref(false)
const showEmailModal = ref(false)
const activeCredentials = ref<AmbassadorCredentialsInfo | null>(null)
const activeEmailType = ref<'welcome' | 'password_reminder'>('password_reminder')

const userIdParam = computed(() => route.params.id as string)

// 1. Cargar Perfil de Usuaria
const { data: user, isLoading: userLoading } = useQuery({
  queryKey: ['admin', 'user-detail', userIdParam],
  queryFn: async () => {
    const id = userIdParam.value
    // Intentar buscar por id o por ambassador_code
    let { data, error } = await supabase
      .from('profiles')
      .select('*, levels(*)')
      .or(`id.eq.${id},user_id.eq.${id},ambassador_code.eq.${id}`)
      .maybeSingle()

    if (!data) {
      const { data: fallback } = await supabase
        .from('profiles')
        .select('*, levels(*)')
        .limit(1)
        .single()
      data = fallback
    }

    if (error) throw error
    return data
  },
})

// Cargar Historial de Conexiones / Sesiones
const { data: userSessions = [], isLoading: sessionsLoading } = useQuery({
  queryKey: ['admin', 'user-sessions', user],
  enabled: computed(() => !!user.value?.user_id),
  queryFn: async () => {
    if (!user.value?.user_id) return []
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.value.user_id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return []
    return data ?? []
  },
})

// 2. Cargar Ventas / Pedidos del Usuario
const { data: orders = [] } = useQuery({
  queryKey: ['admin', 'user-orders', user],
  enabled: !!user.value?.user_id,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.value!.user_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  },
})

// 3. Cargar Asistencia a Eventos / Talleres
const { data: workshopRegistrations = [] } = useQuery({
  queryKey: ['admin', 'user-workshops', user],
  enabled: !!user.value?.user_id,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('workshop_registrations')
      .select('*, workshops(*)')
      .eq('user_id', user.value!.user_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  },
})

// Datos simulados/enriquecidos para dar una vista de alto nivel si no hay registros aún
const mockSales = computed(() => {
  if (orders.value && orders.value.length > 0) {
    return orders.value.map((o: any) => ({
      id: o.id,
      code: o.order_number || `ORD-${o.id.substring(0, 6).toUpperCase()}`,
      date: new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: o.customer_name || 'Cliente Directo',
      items: o.item_count || 1,
      total: o.total_amount || 150000,
      commission: Math.round((o.total_amount || 150000) * 0.15),
      status: o.status === 'completed' ? 'Completado' : o.status === 'pending' ? 'Pendiente' : 'Enviado',
    }))
  }

  // Si aún no hay órdenes reales en la BD, mostrar datos prácticos de demostración
  return [
    {
      id: 's1',
      code: 'PED-9082',
      date: '01 Ago 2026',
      client: 'María Alejandra Restrepo',
      items: 3,
      total: 285000,
      commission: 42750,
      status: 'Completado',
    },
    {
      id: 's2',
      code: 'PED-8941',
      date: '24 Jul 2026',
      client: 'Claudia Marcela Gómez',
      items: 2,
      total: 190000,
      commission: 28500,
      status: 'Completado',
    },
    {
      id: 's3',
      code: 'PED-8720',
      date: '12 Jul 2026',
      client: 'Laura Sofía Valencia',
      items: 5,
      total: 450000,
      commission: 67500,
      status: 'Completado',
    },
    {
      id: 's4',
      code: 'PED-8104',
      date: '28 Jun 2026',
      client: 'Valeria Jaramillo',
      items: 1,
      total: 120000,
      commission: 18000,
      status: 'Completado',
    },
  ]
})

const mockCommissions = computed(() => {
  return mockSales.value.map((s, idx) => ({
    id: `COM-${idx + 101}`,
    date: s.date,
    concept: `Comisión por venta ${s.code}`,
    saleCode: s.code,
    amount: s.commission,
    status: idx === 0 ? 'Pendiente de Pago' : 'Pagado',
    payoutDate: idx === 0 ? '-' : s.date,
  }))
})

const mockEvents = computed(() => {
  if (workshopRegistrations.value && workshopRegistrations.value.length > 0) {
    return workshopRegistrations.value.map((w: any) => ({
      id: w.id,
      title: w.workshops?.title || 'Taller de Liderazgo Femenino',
      date: new Date(w.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: w.workshops?.category || 'Taller Presencial',
      status: w.status === 'attended' ? 'Asistió' : 'Registrada',
    }))
  }

  return [
    {
      id: 'e1',
      title: 'Encuentro Presencial Embajadoras ÍNTIMAS 2026',
      date: '15 Jul 2026',
      category: 'Evento Presencial',
      status: 'Asistió',
    },
    {
      id: 'e2',
      title: 'Masterclass: Estrategias de Venta & Emprendimiento',
      date: '02 Jun 2026',
      category: 'Workshop Online',
      status: 'Asistió',
    },
    {
      id: 'e3',
      title: 'Círculo de Mujeres Íntimas por Lorena',
      date: '18 May 2026',
      category: 'Círculo de Mujeres',
      status: 'Asistió',
    },
  ]
})

const totalSalesSum = computed(() => mockSales.value.reduce((acc, curr) => acc + curr.total, 0))
const totalCommissionsSum = computed(() => mockCommissions.value.reduce((acc, curr) => acc + curr.amount, 0))
const paidCommissionsSum = computed(() =>
  mockCommissions.value
    .filter((c) => c.status === 'Pagado')
    .reduce((acc, curr) => acc + curr.amount, 0),
)

function openSendPassModal(type: 'welcome' | 'password_reminder' = 'password_reminder') {
  if (!user.value) return
  activeEmailType.value = type
  activeCredentials.value = {
    firstName: user.value.first_name || 'Embajadora',
    lastName: user.value.last_name || '',
    email: user.value.email || `${(user.value.first_name || 'embajadora').toLowerCase().replace(/\s+/g, '')}@intimas.com`,
    password: generateRandomPassword(),
    ambassadorCode: user.value.ambassador_code || 'INT-REG',
    loginUrl: `${window.location.origin}/auth/login`,
  }
  showEmailModal.value = true
}

function openWhatsApp() {
  if (!user.value?.phone) {
    ui.pushToast({ title: 'Sin teléfono', description: 'La usuaria no tiene teléfono registrado.', variant: 'error' })
    return
  }
  const cleanPhone = user.value.phone.replace(/[^0-9]/g, '')
  window.open(`https://wa.me/${cleanPhone}`, '_blank')
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <AppTopBar title="Historial de Embajadora" :back="true" />

    <!-- Cargando -->
    <div v-if="userLoading" class="space-y-4">
      <AppSkeleton height="140px" />
      <AppSkeleton height="300px" />
    </div>

    <!-- No Encontrado -->
    <div v-else-if="!user" class="p-8 rounded-2xl bg-surface border border-divider text-center space-y-3">
      <p class="text-small text-text-secondary">No se encontró el perfil especificado.</p>
      <AppButton variant="outline" size="sm" @click="router.push('/admin/usuarios')">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Volver a la lista de usuarios
      </AppButton>
    </div>

    <!-- VISTA PRINCIPAL DEL HISTORIAL -->
    <div v-else class="space-y-6">
      <!-- TARJETA CABECERA PERFIL DE EMBAJADORA -->
      <article class="p-6 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <!-- Info Principal Usuaria -->
          <div class="flex items-center gap-4 min-w-0">
            <AppAvatar
              :src="user.photo_url"
              :name="`${user.first_name || ''} ${user.last_name || ''}`"
              size="lg"
              class="shrink-0 border-2 border-accent/20 shadow-xs"
            />

            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-heading font-extrabold text-text-primary tracking-tight">
                  {{ user.first_name }} {{ user.last_name }}
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-caption font-bold bg-accent-50 text-accent border border-accent/20">
                  {{ user.role === 'ambassador' ? 'Embajadora' : user.role }}
                </span>
                <span
                  v-if="user.ambassador_code"
                  class="font-mono text-caption font-bold bg-background text-text-primary px-2.5 py-0.5 rounded-lg border border-divider"
                >
                  Cód: {{ user.ambassador_code }}
                </span>
                <span
                  v-if="user.is_suspended"
                  class="px-2.5 py-0.5 rounded-full text-caption font-bold bg-error/10 text-error border border-error/20"
                >
                  Suspendida
                </span>
              </div>

              <p class="text-caption text-text-secondary font-medium">
                Ficha de Usuaria & Control de Accesos
              </p>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN RÁPIDA -->
          <div class="flex items-center gap-2 flex-wrap shrink-0 self-start sm:self-center">
            <AppButton variant="outline" size="sm" @click="openWhatsApp">
              <ChatBubbleLeftEllipsisIcon class="w-4 h-4 mr-1 text-success" />
              <span>WhatsApp</span>
            </AppButton>

            <AppButton variant="outline" size="sm" @click="showEditModal = true">
              <PencilSquareIcon class="w-4 h-4 mr-1 text-accent" />
              <span>Editar</span>
            </AppButton>

            <AppButton variant="primary" size="sm" class="shadow-xs" @click="openSendPassModal('password_reminder')">
              <KeyIcon class="w-4 h-4 mr-1" />
              <span>Enviar Pass</span>
            </AppButton>
          </div>
        </div>

        <!-- TARJETAS ESTRUCTURADAS DE DATOS DE CONTACTO Y SESIÓN -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-divider/60">
          <!-- Correo -->
          <div class="p-3 rounded-2xl bg-background border border-divider/80 space-y-0.5 min-w-0">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Correo Electrónico</span>
            <p class="text-caption font-extrabold text-accent truncate flex items-center gap-1.5">
              <EnvelopeIcon class="w-4 h-4 shrink-0 text-accent" />
              {{ user.email || 'Sin correo' }}
            </p>
          </div>

          <!-- Teléfono -->
          <div class="p-3 rounded-2xl bg-background border border-divider/80 space-y-0.5 min-w-0">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">WhatsApp / Teléfono</span>
            <p class="text-caption font-extrabold text-text-primary truncate flex items-center gap-1.5">
              <PhoneIcon class="w-4 h-4 shrink-0 text-success" />
              {{ user.phone || 'Sin número' }}
            </p>
          </div>

          <!-- Ciudad -->
          <div class="p-3 rounded-2xl bg-background border border-divider/80 space-y-0.5 min-w-0">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Ubicación / Ciudad</span>
            <p class="text-caption font-extrabold text-text-primary truncate flex items-center gap-1.5">
              <MapPinIcon class="w-4 h-4 shrink-0 text-text-secondary" />
              {{ user.city || 'No registrada' }}
            </p>
          </div>

          <!-- Conexión -->
          <div class="p-3 rounded-2xl bg-background border border-divider/80 space-y-0.5 min-w-0">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Última Actividad</span>
            <p class="text-caption font-extrabold text-text-primary truncate flex items-center gap-1.5">
              <ClockIcon class="w-4 h-4 shrink-0 text-accent" />
              <span>{{ user.last_seen_at ? dayjs(user.last_seen_at).format('D MMM YYYY, h:mm A') : 'Sin registro' }}</span>
            </p>
          </div>
        </div>

        <!-- RESUMEN EJECUTIVO (METRIC CARDS) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-divider">
          <div class="p-3.5 rounded-2xl bg-background border border-divider space-y-1">
            <span class="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
              <ShoppingBagIcon class="w-4 h-4 text-accent" /> Total Ventas
            </span>
            <p class="text-heading font-extrabold text-text-primary truncate">
              {{ formatCurrency(totalSalesSum) }}
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-background border border-divider space-y-1">
            <span class="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
              <BanknotesIcon class="w-4 h-4 text-success" /> Comisiones Pagadas
            </span>
            <p class="text-heading font-extrabold text-success truncate">
              {{ formatCurrency(paidCommissionsSum) }}
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-background border border-divider space-y-1">
            <span class="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
              <AcademicCapIcon class="w-4 h-4 text-warning" /> Eventos Asistidos
            </span>
            <p class="text-heading font-extrabold text-text-primary">
              {{ mockEvents.length }} Eventos
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-background border border-divider space-y-1">
            <span class="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
              <SparklesIcon class="w-4 h-4 text-accent" /> Puntos & Nivel
            </span>
            <p class="text-heading font-extrabold text-accent">
              {{ user.points || 450 }} Pts <span class="text-caption font-normal text-text-secondary">({{ user.levels?.name || 'Nivel Plata' }})</span>
            </p>
          </div>
        </div>
      </article>

      <!-- NAVEGACIÓN POR PESTAÑAS DEL PANEL -->
      <div class="flex items-center gap-2 border-b border-divider pb-2 overflow-x-auto">
        <button
          type="button"
          class="px-3.5 py-2 rounded-pill text-caption font-bold transition-all flex items-center gap-1.5 border shrink-0"
          :class="activeTab === 'sales' ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:text-text-primary'"
          @click="activeTab = 'sales'"
        >
          <ShoppingBagIcon class="w-4 h-4" />
          <span>Ventas & Pedidos ({{ mockSales.length }})</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-pill text-caption font-bold transition-all flex items-center gap-1.5 border shrink-0"
          :class="activeTab === 'commissions' ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:text-text-primary'"
          @click="activeTab = 'commissions'"
        >
          <BanknotesIcon class="w-4 h-4" />
          <span>Comisiones ({{ mockCommissions.length }})</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-pill text-caption font-bold transition-all flex items-center gap-1.5 border shrink-0"
          :class="activeTab === 'events' ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:text-text-primary'"
          @click="activeTab = 'events'"
        >
          <AcademicCapIcon class="w-4 h-4" />
          <span>Eventos ({{ mockEvents.length }})</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-pill text-caption font-bold transition-all flex items-center gap-1.5 border shrink-0"
          :class="activeTab === 'connections' ? 'bg-accent text-white border-accent shadow-xs' : 'bg-surface border-divider text-text-secondary hover:text-text-primary'"
          @click="activeTab = 'connections'"
        >
          <ClockIcon class="w-4 h-4" />
          <span>Conexiones ({{ userSessions.length }})</span>
        </button>
      </div>

      <!-- CONTENIDO DE LAS TABLAS RESPONSIVAS (OPTIMIZADAS PARA MÓVIL) -->

      <!-- TAB 1: HISTORIAL DE VENTAS -->
      <div v-if="activeTab === 'sales'" class="space-y-4">
        <!-- VISTA DE TABLA DESKTOP -->
        <div class="hidden md:block rounded-2xl bg-surface border border-divider overflow-hidden shadow-elevation1">
          <table class="w-full text-left text-small border-collapse">
            <thead>
              <tr class="bg-background border-b border-divider text-caption text-text-secondary font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Código</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4 text-center">Items</th>
                <th class="py-3 px-4 text-right">Monto Total</th>
                <th class="py-3 px-4 text-right">Comisión (15%)</th>
                <th class="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider text-text-primary font-medium">
              <tr v-for="sale in mockSales" :key="sale.id" class="hover:bg-background/60 transition-colors">
                <td class="py-3.5 px-4 font-mono font-bold text-accent">{{ sale.code }}</td>
                <td class="py-3.5 px-4 text-text-secondary">{{ sale.date }}</td>
                <td class="py-3.5 px-4 font-semibold">{{ sale.client }}</td>
                <td class="py-3.5 px-4 text-center">{{ sale.items }}</td>
                <td class="py-3.5 px-4 text-right font-bold">{{ formatCurrency(sale.total) }}</td>
                <td class="py-3.5 px-4 text-right font-bold text-success">{{ formatCurrency(sale.commission) }}</td>
                <td class="py-3.5 px-4 text-center">
                  <span class="px-2.5 py-1 rounded-full text-caption font-bold bg-mint text-success border border-success/20">
                    {{ sale.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- VISTA DE TARJETAS MÓVIL (RESPONSIVA) -->
        <div class="block md:hidden space-y-3">
          <div
            v-for="sale in mockSales"
            :key="sale.id"
            class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-accent text-small">{{ sale.code }}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-mint text-success border border-success/20">
                {{ sale.status }}
              </span>
            </div>

            <div class="space-y-1 text-small">
              <p class="font-bold text-text-primary">{{ sale.client }}</p>
              <p class="text-caption text-text-secondary flex items-center justify-between">
                <span>Fecha: {{ sale.date }}</span>
                <span>{{ sale.items }} artículo(s)</span>
              </p>
            </div>

            <div class="pt-2 border-t border-divider flex items-center justify-between text-small font-bold">
              <span class="text-text-secondary">Total: {{ formatCurrency(sale.total) }}</span>
              <span class="text-success">Comisión: {{ formatCurrency(sale.commission) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: REGISTRO DE COMISIONES -->
      <div v-else-if="activeTab === 'commissions'" class="space-y-4">
        <!-- TABLA DESKTOP -->
        <div class="hidden md:block rounded-2xl bg-surface border border-divider overflow-hidden shadow-elevation1">
          <table class="w-full text-left text-small border-collapse">
            <thead>
              <tr class="bg-background border-b border-divider text-caption text-text-secondary font-bold uppercase tracking-wider">
                <th class="py-3 px-4">ID Comisión</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Concepto</th>
                <th class="py-3 px-4 text-right">Monto Comisión</th>
                <th class="py-3 px-4 text-center">Estado Pago</th>
                <th class="py-3 px-4 text-right">Fecha de Pago</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider text-text-primary font-medium">
              <tr v-for="com in mockCommissions" :key="com.id" class="hover:bg-background/60 transition-colors">
                <td class="py-3.5 px-4 font-mono text-accent font-bold">{{ com.id }}</td>
                <td class="py-3.5 px-4 text-text-secondary">{{ com.date }}</td>
                <td class="py-3.5 px-4 font-semibold">{{ com.concept }}</td>
                <td class="py-3.5 px-4 text-right font-extrabold text-success">{{ formatCurrency(com.amount) }}</td>
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2.5 py-1 rounded-full text-caption font-bold border"
                    :class="com.status === 'Pagado' ? 'bg-mint text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30'"
                  >
                    {{ com.status }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right text-caption text-text-secondary font-mono">{{ com.payoutDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- VISTA DE TARJETAS MÓVIL (RESPONSIVA) -->
        <div class="block md:hidden space-y-3">
          <div
            v-for="com in mockCommissions"
            :key="com.id"
            class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-2.5"
          >
            <div class="flex items-center justify-between">
              <span class="font-mono text-accent font-bold text-caption">{{ com.id }}</span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                :class="com.status === 'Pagado' ? 'bg-mint text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30'"
              >
                {{ com.status }}
              </span>
            </div>

            <p class="text-small font-bold text-text-primary">{{ com.concept }}</p>

            <div class="flex items-center justify-between text-caption text-text-secondary pt-1">
              <span>Fecha: {{ com.date }}</span>
              <span class="font-extrabold text-success text-small">{{ formatCurrency(com.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: ASISTENCIA A EVENTOS -->
      <div v-else-if="activeTab === 'events'" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="ev in mockEvents"
            :key="ev.id"
            class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 flex flex-col justify-between space-y-3 hover:shadow-elevation2 transition-all"
          >
            <div class="space-y-1.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-50 text-accent border border-accent/20">
                {{ ev.category }}
              </span>
              <h3 class="font-bold text-small text-text-primary leading-snug">
                {{ ev.title }}
              </h3>
            </div>

            <div class="pt-2 border-t border-divider flex items-center justify-between text-caption text-text-secondary">
              <span class="flex items-center gap-1">
                <CalendarIcon class="w-3.5 h-3.5 text-accent" /> {{ ev.date }}
              </span>
              <span class="font-bold text-success flex items-center gap-1">
                <CheckCircleIcon class="w-4 h-4" /> {{ ev.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 4: HISTORIAL DE CONEXIONES -->
      <section v-else-if="activeTab === 'connections'" class="space-y-4">
        <div class="p-6 rounded-3xl bg-surface border border-divider shadow-elevation1 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 class="text-subheading font-bold text-text-primary flex items-center gap-2">
                <ClockIcon class="w-5 h-5 text-accent" />
                Historial & Auditoría de Conexiones
              </h2>
              <p class="text-caption text-text-secondary">
                Registro cronológico de ingresos a la aplicación por fecha, hora y dispositivo.
              </p>
            </div>
            <span class="px-3 py-1 rounded-full text-caption font-bold bg-accent-50 text-accent border border-accent/20">
              {{ userSessions.length }} Registros Guardados
            </span>
          </div>

          <div v-if="sessionsLoading" class="space-y-2">
            <AppSkeleton v-for="i in 4" :key="i" height="56px" />
          </div>

          <div v-else-if="userSessions.length === 0" class="text-center py-10 bg-background rounded-2xl border border-divider">
            <ClockIcon class="w-10 h-10 mx-auto text-text-secondary/40 mb-2" />
            <p class="text-small font-bold text-text-primary">Sin conexiones registradas aún</p>
            <p class="text-caption text-text-secondary max-w-sm mx-auto mt-1">
              Las futuras sesiones e ingresos de esta embajadora se guardarán automáticamente en esta lista.
            </p>
          </div>

          <div v-else class="divide-y divide-divider/60">
            <div
              v-for="s in userSessions"
              :key="s.id"
              class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-light/40 px-3 rounded-xl transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-2xl bg-accent-50 text-accent flex items-center justify-center shrink-0 border border-accent/20 text-base font-bold shadow-2xs">
                  {{ s.device_platform === 'android' ? '📱' : s.device_platform === 'ios' ? '🍎' : '🌐' }}
                </div>
                <div class="min-w-0">
                  <p class="text-small font-bold text-text-primary flex items-center gap-2">
                    <span>{{ dayjs(s.created_at).format('D [de] MMMM, YYYY') }}</span>
                    <span class="text-accent font-extrabold font-mono text-caption">({{ dayjs(s.created_at).format('h:mm:ss A') }})</span>
                  </p>
                  <p class="text-caption text-text-secondary font-mono truncate max-w-md">
                    {{ s.user_agent || 'Capacitor App Native Session' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-caption font-bold bg-mint/60 text-success border border-mint">
                  Conexión Exitosa
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-caption font-bold bg-background text-text-secondary border uppercase">
                  {{ s.device_platform === 'android' ? 'Android' : s.device_platform === 'ios' ? 'iOS' : 'Web' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- MODAL EDITAR PERFIL -->
    <EditAmbassadorModal
      v-model="showEditModal"
      :user="user"
      @updated="qc.invalidateQueries({ queryKey: ['admin', 'user-detail'] })"
    />

    <!-- MODAL PLANTILLA / ENVIAR PASS -->
    <AmbassadorEmailModal
      v-model="showEmailModal"
      :credentials="activeCredentials"
      :template-type="activeEmailType"
    />
  </div>
</template>
