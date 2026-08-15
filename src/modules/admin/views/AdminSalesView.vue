<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import dayjs from '@utils/dayjs'
import AppModal from '@components/base/AppModal.vue'
import AppButton from '@components/base/AppButton.vue'
import AppEmptyState from '@components/base/AppEmptyState.vue'
import {
  CurrencyDollarIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  TruckIcon,
  UserIcon,
  ShoppingBagIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const searchQuery = ref('')
const filterStatus = ref<'all' | 'approved' | 'dispatched'>('all')
const filterTime = ref<'all' | 'today' | 'week' | 'month'>('all')

const selectedOrder = ref<any | null>(null)
const showDetailModal = ref(false)

const openDetail = (order: any) => {
  selectedOrder.value = order
  showDetailModal.value = true
}

// Cargar todas las ventas confirmadas (approved o dispatched) con sus ítems
const { data: sales, isLoading, refetch } = useQuery({
  queryKey: ['admin', 'confirmed-sales'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .in('status', ['approved', 'dispatched'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },
  refetchInterval: 15000,
})

// Filtrado reactivo por rango de tiempo
const timeFilteredSales = computed(() => {
  if (!sales.value) return []
  const now = new Date()
  if (filterTime.value === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return sales.value.filter((s) => new Date(s.created_at).getTime() >= startOfToday)
  } else if (filterTime.value === 'week') {
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000
    return sales.value.filter((s) => new Date(s.created_at).getTime() >= startOfWeek)
  } else if (filterTime.value === 'month') {
    const startOfMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000
    return sales.value.filter((s) => new Date(s.created_at).getTime() >= startOfMonth)
  }
  return sales.value
})

// Filtrado por buscador y estado
const filteredSales = computed(() => {
  let list = timeFilteredSales.value

  if (filterStatus.value !== 'all') {
    list = list.filter((s) => s.status === filterStatus.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (s) =>
        (s.order_number && s.order_number.toLowerCase().includes(q)) ||
        (s.ambassador_name && s.ambassador_name.toLowerCase().includes(q)) ||
        (s.ambassador_code && s.ambassador_code.toLowerCase().includes(q)) ||
        (s.client_name && s.client_name.toLowerCase().includes(q)) ||
        (s.shipping_city && s.shipping_city.toLowerCase().includes(q))
    )
  }

  return list
})

// Totales de resumen KPI
const summaryStats = computed(() => {
  let totalSalesUSD = 0
  let totalCommissionUSD = 0
  let totalNetIncomeUSD = 0
  let countApproved = 0
  let countDispatched = 0

  timeFilteredSales.value.forEach((s) => {
    const total = Number(s.total_amount) || 0
    const rate = Number(s.commission_rate) || 25
    const comm = Number(s.commission_amount) || (total * (rate / 100))
    const net = total - comm

    totalSalesUSD += total
    totalCommissionUSD += comm
    totalNetIncomeUSD += net

    if (s.status === 'approved') countApproved++
    if (s.status === 'dispatched') countDispatched++
  })

  const totalCount = timeFilteredSales.value.length
  const avgSaleUSD = totalCount > 0 ? totalSalesUSD / totalCount : 0

  return {
    totalSalesUSD,
    totalCommissionUSD,
    totalNetIncomeUSD,
    totalCount,
    countApproved,
    countDispatched,
    avgSaleUSD,
  }
})

// Exportar datos a CSV
function exportCSV() {
  if (!filteredSales.value || filteredSales.value.length === 0) return
  const headers = ['Nro Orden', 'Fecha', 'Embajadora', 'Codigo', 'Cliente', 'Ciudad', 'Monto Venta', 'Comision USD', 'Monto Neto', 'Estado Venta', 'Comision Pagada']
  
  const rows = filteredSales.value.map((s) => {
    const total = Number(s.total_amount) || 0
    const rate = Number(s.commission_rate) || 25
    const comm = Number(s.commission_amount) || (total * (rate / 100))
    const net = total - comm
    return [
      s.order_number,
      dayjs(s.created_at).format('YYYY-MM-DD HH:mm'),
      `"${s.ambassador_name || ''}"`,
      s.ambassador_code || '',
      `"${s.client_name || ''}"`,
      `"${s.shipping_city || ''}"`,
      total.toFixed(2),
      comm.toFixed(2),
      net.toFixed(2),
      s.status === 'approved' ? 'Aprobada' : 'Despachada',
      s.commission_paid ? 'Si' : 'No'
    ].join(',')
  })

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `ventas_confirmadas_${dayjs().format('YYYY-MM-DD')}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- CABECERA EDITORIAL DE PÁGINA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <RouterLink
            to="/admin"
            class="p-2 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors active:scale-95"
          >
            <ChevronLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-title sm:text-h2 font-editorial font-extrabold text-text-primary tracking-tight">
            Ventas Confirmadas
          </h1>
        </div>
        <p class="text-caption text-text-secondary pl-9">
          Detalle en tiempo real de ventas aprobadas, comisiones asignadas a la red de embajadoras e ingreso neto.
        </p>
      </div>

      <button
        type="button"
        class="px-4 py-2.5 rounded-pill bg-surface border border-divider hover:bg-background text-text-primary font-bold text-caption flex items-center gap-2 transition-all shadow-2xs active:scale-95 self-start sm:self-auto"
        @click="exportCSV"
      >
        <DocumentArrowDownIcon class="w-4 h-4 text-accent" />
        <span>Exportar Reporte CSV</span>
      </button>
    </div>

    <!-- TARJETAS DE RESUMEN KPI GLOBAL -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Ventas Confirmadas</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-text-primary tracking-tight">
          ${{ summaryStats.totalSalesUSD.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-success flex items-center gap-1">
          <ArrowTrendingUpIcon class="w-3.5 h-3.5" /> {{ summaryStats.totalCount }} completadas
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Comisiones (25%)</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-accent tracking-tight">
          ${{ summaryStats.totalCommissionUSD.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-medium text-text-secondary">
          Asignado a embajadoras
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Ingreso Neto</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-success tracking-tight">
          ${{ summaryStats.totalNetIncomeUSD.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-medium text-text-secondary">
          Ventas menos comisiones
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Ticket Promedio</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-text-primary tracking-tight">
          ${{ summaryStats.avgSaleUSD.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-medium text-text-secondary">
          Promedio por orden
        </span>
      </div>
    </div>

    <!-- CONTROLES Y FILTROS -->
    <div class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Buscador por texto -->
      <div class="relative flex-1 max-w-md">
        <MagnifyingGlassIcon class="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por orden, embajadora, código o cliente..."
          class="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-divider focus:outline-none focus:border-accent text-caption font-medium transition-colors"
        />
      </div>

      <!-- Filtros por estado y tiempo -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Filtro Rango de Tiempo -->
        <div class="flex items-center gap-1 bg-background p-1 rounded-xl border border-divider overflow-x-auto max-w-full">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTime === 'all' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTime = 'all'"
          >
            Todo
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTime === 'today' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTime = 'today'"
          >
            Hoy
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTime === 'week' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTime = 'week'"
          >
            7 Días
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTime === 'month' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTime = 'month'"
          >
            30 Días
          </button>
        </div>

        <!-- Filtro Estado -->
        <div class="flex items-center gap-1 bg-background p-1 rounded-xl border border-divider overflow-x-auto max-w-full">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'all' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'all'"
          >
            Todas ({{ summaryStats.totalCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'approved' ? 'bg-surface text-success shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'approved'"
          >
            Aprobadas ({{ summaryStats.countApproved }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'dispatched' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'dispatched'"
          >
            Despachadas ({{ summaryStats.countDispatched }})
          </button>
        </div>
      </div>
    </div>

    <!-- CONTENEDOR DE VENTAS: TARJETAS EN MÓVIL / TABLA EN ESCRITORIO -->
    <div class="rounded-2xl bg-surface border border-divider shadow-elevation1 overflow-hidden">
      <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center space-y-3">
        <div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span class="text-caption text-text-secondary font-medium">Cargando reporte de ventas confirmadas...</span>
      </div>

      <div v-else-if="!filteredSales || filteredSales.length === 0" class="p-8">
        <AppEmptyState
          title="No se encontraron ventas confirmadas"
          description="Ajusta los filtros de búsqueda o el rango de tiempo seleccionado."
          icon-name="orders"
        />
      </div>

      <div v-else>
        <!-- 1. VISTA MÓVIL EN TARJETAS SEPARADAS (Gap de 12px y bordes independientes) -->
        <div class="block md:hidden space-y-3 p-3 bg-background/30 rounded-2xl">
          <div
            v-for="s in filteredSales"
            :key="s.id"
            class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation2 transition-all"
            @click="openDetail(s)"
          >

            <!-- Fila Superior: Orden, Fecha & Estado Venta -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-accent text-body">
                  {{ s.order_number }}
                </span>
                <span class="text-[10px] text-text-secondary">
                  {{ dayjs(s.created_at).format('D MMM · HH:mm') }}
                </span>
              </div>

              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border"
                :class="s.status === 'approved' ? 'bg-mint/50 text-success border-success/20' : 'bg-accent/15 text-accent border-accent/20'"
              >
                <span>{{ s.status === 'approved' ? 'Aprobada' : 'Despachada' }}</span>
              </span>
            </div>

            <!-- Datos de Embajadora y Cliente -->
            <div class="grid grid-cols-2 gap-2 text-caption pt-0.5">
              <div class="p-2.5 rounded-xl bg-background border border-divider/60 space-y-0.5">
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Embajadora</span>
                <p class="font-bold text-text-primary truncate">{{ s.ambassador_name || 'Embajadora' }}</p>
                <p v-if="s.ambassador_code" class="text-[10px] font-mono text-accent font-semibold">{{ s.ambassador_code }}</p>
              </div>

              <div class="p-2.5 rounded-xl bg-background border border-divider/60 space-y-0.5">
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Cliente</span>
                <p class="font-bold text-text-primary truncate">{{ s.client_name || 'Cliente' }}</p>
                <p class="text-[10px] text-text-secondary truncate">{{ s.shipping_city || 'Ubicación' }}</p>
              </div>
            </div>

            <!-- Fila Inferior: Desglose Financiero & Detalle -->
            <div class="flex items-center justify-between pt-1" @click.stop>
              <div>
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Venta / Comisión / Neto</span>
                <span class="text-caption font-bold text-text-primary">${{ (Number(s.total_amount) || 0).toFixed(2) }}</span>
                <span class="text-caption font-bold text-accent ml-1.5">(-${{ (Number(s.commission_amount) || ((Number(s.total_amount) || 0) * 0.25)).toFixed(2) }})</span>
                <span class="text-caption font-black text-success ml-1.5">= ${{ ((Number(s.total_amount) || 0) - (Number(s.commission_amount) || ((Number(s.total_amount) || 0) * 0.25))).toFixed(2) }}</span>
              </div>

              <button
                type="button"
                class="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-accent transition-colors"
                @click="openDetail(s)"
              >
                <EyeIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 2. VISTA ESCRITORIO EN TABLA EDITORIAL (Visibilidad en pantallas medianas y grandes) -->
        <div class="hidden md:block overflow-x-auto min-h-[300px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-background/70 border-b border-divider text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                <th class="py-3.5 px-4"># Orden & Fecha</th>
                <th class="py-3.5 px-4">Embajadora</th>
                <th class="py-3.5 px-4">Cliente & Destino</th>
                <th class="py-3.5 px-4 text-right">Monto Venta</th>
                <th class="py-3.5 px-4 text-right">Comisión (25%)</th>
                <th class="py-3.5 px-4 text-right">Ingreso Neto</th>
                <th class="py-3.5 px-4 text-center">Estado Venta</th>
                <th class="py-3.5 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider/70 text-caption font-medium">
              <tr
                v-for="s in filteredSales"
                :key="s.id"
                class="hover:bg-background/40 transition-colors group cursor-pointer"
                @click="openDetail(s)"
              >
                <!-- Nº Orden y Fecha -->
                <td class="py-3.5 px-4">
                  <div class="font-mono font-extrabold text-accent group-hover:underline text-[13px]">
                    {{ s.order_number }}
                  </div>
                  <div class="text-[10px] text-text-secondary mt-0.5">
                    {{ dayjs(s.created_at).format('D MMM YYYY · HH:mm') }}
                  </div>
                </td>

                <!-- Embajadora -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                      {{ s.ambassador_name ? s.ambassador_name[0] : 'E' }}
                    </div>
                    <div class="min-w-0">
                      <span class="font-bold text-text-primary block truncate max-w-[150px]">
                        {{ s.ambassador_name || 'Embajadora' }}
                      </span>
                      <span v-if="s.ambassador_code" class="text-[10px] font-mono text-accent font-semibold block">
                        {{ s.ambassador_code }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Cliente & Destino -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-text-primary truncate max-w-[160px]">
                    {{ s.client_name || 'Cliente' }}
                  </div>
                  <div class="text-[10px] text-text-secondary truncate max-w-[160px] mt-0.5">
                    <MapPinIcon class="w-3 h-3 text-accent inline mr-0.5" />
                    {{ s.shipping_city || s.shipping_state || 'Ubicación' }}
                  </div>
                </td>

                <!-- Monto Venta -->
                <td class="py-3.5 px-4 text-right font-bold text-text-primary">
                  ${{ (Number(s.total_amount) || 0).toFixed(2) }}
                </td>

                <!-- Comisión (25%) -->
                <td class="py-3.5 px-4 text-right">
                  <div class="font-bold text-accent">
                    -${{ (Number(s.commission_amount) || ((Number(s.total_amount) || 0) * ((Number(s.commission_rate) || 25) / 100))).toFixed(2) }}
                  </div>
                  <span
                    class="text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider inline-block mt-0.5"
                    :class="s.commission_paid ? 'bg-mint/40 text-success' : 'bg-warning/20 text-warning'"
                  >
                    {{ s.commission_paid ? 'Pagada' : 'Retenida' }}
                  </span>
                </td>

                <!-- Ingreso Neto -->
                <td class="py-3.5 px-4 text-right font-extrabold text-success">
                  ${{ ((Number(s.total_amount) || 0) - (Number(s.commission_amount) || ((Number(s.total_amount) || 0) * ((Number(s.commission_rate) || 25) / 100)))).toFixed(2) }}
                </td>

                <!-- Estado Venta -->
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border"
                    :class="s.status === 'approved' ? 'bg-mint/40 text-success border-success/20' : 'bg-accent/15 text-accent border-accent/20'"
                  >
                    <CheckCircleIcon v-if="s.status === 'approved'" class="w-3 h-3" />
                    <TruckIcon v-else class="w-3 h-3" />
                    <span>{{ s.status === 'approved' ? 'Aprobada' : 'Despachada' }}</span>
                  </span>
                </td>

                <!-- Acción -->
                <td class="py-3.5 px-4 text-center" @click.stop>
                  <button
                    type="button"
                    class="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-accent transition-colors"
                    title="Ver detalle de la venta"
                    @click="openDetail(s)"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE VENTA -->
    <AppModal
      v-if="selectedOrder"
      v-model="showDetailModal"
      :title="`Detalle de Venta: ${selectedOrder.order_number}`"
      size="md"
    >
      <div class="space-y-4">
        <!-- Resumen de Montos -->
        <div class="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-background border border-divider text-center">
          <div>
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Monto Venta</span>
            <span class="text-subtitle font-black text-text-primary">${{ (Number(selectedOrder.total_amount) || 0).toFixed(2) }} USD</span>
          </div>
          <div>
            <span class="text-[10px] font-extrabold text-accent uppercase block">Comisión (25%)</span>
            <span class="text-subtitle font-black text-accent">-${{ (Number(selectedOrder.commission_amount) || ((Number(selectedOrder.total_amount) || 0) * 0.25)).toFixed(2) }} USD</span>
          </div>
          <div>
            <span class="text-[10px] font-extrabold text-success uppercase block">Ingreso Neto</span>
            <span class="text-subtitle font-black text-success">${{ ((Number(selectedOrder.total_amount) || 0) - (Number(selectedOrder.commission_amount) || ((Number(selectedOrder.total_amount) || 0) * 0.25))).toFixed(2) }} USD</span>
          </div>
        </div>

        <!-- Datos de Vendedora y Cliente -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
          <div class="p-3 rounded-xl bg-surface border border-divider space-y-1">
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Embajadora</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.ambassador_name || 'Embajadora' }}</p>
            <p class="text-accent font-mono font-semibold">{{ selectedOrder.ambassador_code }}</p>
          </div>
          <div class="p-3 rounded-xl bg-surface border border-divider space-y-1">
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Cliente Final</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.client_name || 'Cliente' }}</p>
            <p class="text-text-secondary text-[11px]">{{ selectedOrder.shipping_city }}, {{ selectedOrder.shipping_state }}</p>
          </div>
        </div>

        <!-- Desglose de Productos -->
        <div class="space-y-2 pt-2 border-t border-divider">
          <span class="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Productos en la Venta</span>
          <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            <div
              v-for="it in (selectedOrder.order_items || [])"
              :key="it.id"
              class="p-2.5 rounded-xl bg-background border border-divider flex items-center justify-between gap-2"
            >
              <div class="min-w-0 flex-1">
                <p class="font-bold text-text-primary text-caption truncate">{{ it.product_name }}</p>
                <p class="text-[10px] text-text-secondary">
                  SKU: {{ it.product_sku || 'N/A' }} {{ it.size ? `· Talla: ${it.size}` : '' }} {{ it.color ? `· Color: ${it.color}` : '' }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <span class="text-caption font-bold text-accent">{{ it.quantity }}x</span>
                <span class="text-caption font-bold text-text-primary block">${{ (Number(it.subtotal) || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end w-full">
          <AppButton variant="ghost" @click="showDetailModal = false">
            Cerrar
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
