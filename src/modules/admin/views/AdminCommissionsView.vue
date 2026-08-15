<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import dayjs from '@utils/dayjs'
import { useOrders, usePayCommission, useRevertCommissionPayment } from '@modules/orders/composables/useOrders'
import { useUiStore } from '@stores/ui.store'
import type { Order } from '@modules/orders/types/orders.types'
import AppModal from '@components/base/AppModal.vue'
import AppButton from '@components/base/AppButton.vue'
import AppEmptyState from '@components/base/AppEmptyState.vue'
import {
  CurrencyDollarIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  TrophyIcon,
  MapPinIcon,
  TagIcon,
} from '@heroicons/vue/24/outline'

const ui = useUiStore()
const filterTab = ref<'all' | 'pending' | 'paid'>('all')
const filterTime = ref<'all' | 'today' | 'week' | 'month'>('all')
const searchQuery = ref('')

const selectedOrder = ref<Order | null>(null)
const showDetailModal = ref(false)

const openDetail = (order: Order) => {
  selectedOrder.value = order
  showDetailModal.value = true
}

const { data: orders, isLoading, refetch } = useOrders()
const payCommissionMutation = usePayCommission()
const revertCommissionMutation = useRevertCommissionPayment()

// Las comisiones solo aplican para órdenes Aprobadas ('approved') o Despachadas ('dispatched')
const relevantOrders = computed(() => {
  if (!orders.value) return []
  return orders.value.filter((o) => o.status === 'approved' || o.status === 'dispatched')
})

// Filtrado por tiempo
const timeFilteredOrders = computed(() => {
  const list = relevantOrders.value
  const now = new Date()
  if (filterTime.value === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return list.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfToday)
  } else if (filterTime.value === 'week') {
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000
    return list.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfWeek)
  } else if (filterTime.value === 'month') {
    const startOfMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000
    return list.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfMonth)
  }
  return list
})

// Filtrado por estado de pago y búsqueda por texto
const filteredOrders = computed(() => {
  let list = timeFilteredOrders.value

  if (filterTab.value === 'pending') {
    list = list.filter((o) => !o.commissionPaid)
  } else if (filterTab.value === 'paid') {
    list = list.filter((o) => o.commissionPaid)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.ambassadorName.toLowerCase().includes(q) ||
        (o.ambassadorCode && o.ambassadorCode.toLowerCase().includes(q)) ||
        o.clientName.toLowerCase().includes(q) ||
        (o.shippingCity && o.shippingCity.toLowerCase().includes(q))
    )
  }

  return list
})

// Totales de resumen KPI
const stats = computed(() => {
  let totalPending = 0
  let totalPaid = 0
  let countPending = 0
  let countPaid = 0

  timeFilteredOrders.value.forEach((o) => {
    if (o.commissionPaid) {
      totalPaid += o.commissionAmount
      countPaid++
    } else {
      totalPending += o.commissionAmount
      countPending++
    }
  })

  const totalCommissions = totalPending + totalPaid
  const totalCount = countPending + countPaid
  const avgCommission = totalCount > 0 ? totalCommissions / totalCount : 0

  return {
    totalPending,
    totalPaid,
    countPending,
    countPaid,
    totalCommissions,
    totalCount,
    avgCommission,
  }
})

// Acciones de Pago
async function handleConfirmPayment(orderId: string, orderNumber: string) {
  try {
    await payCommissionMutation.mutateAsync(orderId)
    ui.pushToast({
      title: 'Pago Confirmado',
      description: `Se registró el pago de la comisión para la orden ${orderNumber}`,
      variant: 'success',
    })
    refetch()
  } catch (e) {
    ui.pushToast({
      title: 'Error al confirmar pago',
      description: (e as Error).message,
      variant: 'error',
    })
  }
}

async function handleRevertPayment(orderId: string, orderNumber: string) {
  try {
    await revertCommissionMutation.mutateAsync(orderId)
    ui.pushToast({
      title: 'Pago Revertido',
      description: `La comisión de la orden ${orderNumber} ha sido revertida a pendiente.`,
      variant: 'info',
    })
    refetch()
  } catch (e) {
    ui.pushToast({
      title: 'Error al revertir pago',
      description: (e as Error).message,
      variant: 'error',
    })
  }
}

// Exportar CSV
function exportCSV() {
  if (!filteredOrders.value || filteredOrders.value.length === 0) return
  const headers = ['Nro Orden', 'Fecha Orden', 'Embajadora', 'Codigo EMB', 'Cliente', 'Monto Venta USD', 'Comision (25%) USD', 'Estado Pago', 'Fecha Pago']

  const rows = filteredOrders.value.map((o) => [
    o.orderNumber,
    o.createdAt ? dayjs(o.createdAt).format('YYYY-MM-DD HH:mm') : '',
    `"${o.ambassadorName}"`,
    o.ambassadorCode || '',
    `"${o.clientName}"`,
    o.totalAmount.toFixed(2),
    o.commissionAmount.toFixed(2),
    o.commissionPaid ? 'Pagada' : 'Pendiente',
    o.commissionPaidAt ? dayjs(o.commissionPaidAt).format('YYYY-MM-DD HH:mm') : 'Pendiente',
  ].join(','))

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `comisiones_embajadoras_${dayjs().format('YYYY-MM-DD')}.csv`)
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
            Gestión de Comisiones
          </h1>
        </div>
        <p class="text-caption text-text-secondary pl-9">
          Control de comisiones retribuidas a la red de embajadoras y estado de liquidación de pagos.
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
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Comisiones Retenidas</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-warning tracking-tight">
          ${{ stats.totalPending.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-warning flex items-center gap-1">
          <ClockIcon class="w-3.5 h-3.5" /> {{ stats.countPending }} por liquidar
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Comisiones Liquidadas</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-success tracking-tight">
          ${{ stats.totalPaid.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-success flex items-center gap-1">
          <CheckCircleIcon class="w-3.5 h-3.5" /> {{ stats.countPaid }} pagadas
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Total Comisiones</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-accent tracking-tight">
          ${{ stats.totalCommissions.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-medium text-text-secondary">
          {{ stats.totalCount }} registradas
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Comisión Promedio</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-text-primary tracking-tight">
          ${{ stats.avgCommission.toFixed(2) }} <span class="text-caption font-bold text-text-secondary">USD</span>
        </div>
        <span class="text-[10px] sm:text-[11px] font-medium text-text-secondary">
          Promedio (25%)
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

        <!-- Filtro Estado de Pago -->
        <div class="flex items-center gap-1 bg-background p-1 rounded-xl border border-divider overflow-x-auto max-w-full">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTab === 'all' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTab = 'all'"
          >
            Todas ({{ stats.totalCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTab === 'pending' ? 'bg-surface text-warning shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTab = 'pending'"
          >
            Pendientes ({{ stats.countPending }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterTab === 'paid' ? 'bg-surface text-success shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterTab = 'paid'"
          >
            Pagadas ({{ stats.countPaid }})
          </button>
        </div>
      </div>
    </div>

    <!-- CONTENEDOR DE COMISIONES: TARJETAS EN MÓVIL / TABLA EN ESCRITORIO -->
    <div class="rounded-2xl bg-surface border border-divider shadow-elevation1 overflow-hidden">
      <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center space-y-3">
        <div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span class="text-caption text-text-secondary font-medium">Cargando reporte de comisiones...</span>
      </div>

      <div v-else-if="!filteredOrders || filteredOrders.length === 0" class="p-8">
        <AppEmptyState
          title="No se encontraron comisiones"
          description="Ajusta los filtros de búsqueda o el rango de tiempo seleccionado."
          icon-name="orders"
        />
      </div>

      <div v-else>
        <!-- 1. VISTA MÓVIL EN TARJETAS SEPARADAS (Gap de 12px y bordes independientes) -->
        <div class="block md:hidden space-y-3 p-3 bg-background/30 rounded-2xl">
          <div
            v-for="o in filteredOrders"
            :key="o.id"
            class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation2 transition-all"
            @click="openDetail(o)"
          >

            <!-- Fila Superior: Orden, Fecha & Estado de Pago -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-accent text-body">
                  {{ o.orderNumber }}
                </span>
                <span class="text-[10px] text-text-secondary">
                  {{ o.createdAt ? dayjs(o.createdAt).format('D MMM · HH:mm') : '' }}
                </span>
              </div>

              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border"
                :class="o.commissionPaid ? 'bg-mint/50 text-success border-success/20' : 'bg-warning/15 text-warning border-warning/30'"
              >
                <span>{{ o.commissionPaid ? 'Pagada' : 'Retenida' }}</span>
              </span>
            </div>

            <!-- Datos de Embajadora y Cliente -->
            <div class="grid grid-cols-2 gap-2 text-caption pt-0.5">
              <div class="p-2.5 rounded-xl bg-background border border-divider/60 space-y-0.5">
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Embajadora</span>
                <p class="font-bold text-text-primary truncate">{{ o.ambassadorName }}</p>
                <p v-if="o.ambassadorCode" class="text-[10px] font-mono text-accent font-semibold">{{ o.ambassadorCode }}</p>
              </div>

              <div class="p-2.5 rounded-xl bg-background border border-divider/60 space-y-0.5">
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Cliente</span>
                <p class="font-bold text-text-primary truncate">{{ o.clientName }}</p>
                <p class="text-[10px] text-text-secondary truncate">{{ o.shippingCity || 'Ubicación' }}</p>
              </div>
            </div>

            <!-- Fila Inferior: Montos & Acción de Pago -->
            <div class="flex items-center justify-between pt-1" @click.stop>
              <div>
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Venta / Comisión (25%)</span>
                <span class="text-caption font-semibold text-text-secondary">${{ o.totalAmount.toFixed(2) }}</span>
                <span class="text-caption font-black text-accent ml-2">${{ o.commissionAmount.toFixed(2) }} USD</span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="!o.commissionPaid"
                  type="button"
                  class="px-3.5 py-1.5 rounded-pill bg-accent hover:bg-accent-600 text-white font-extrabold text-[11px] transition-all shadow-xs active:scale-95"
                  @click="handleConfirmPayment(o.id, o.orderNumber)"
                >
                  Confirmar Pago
                </button>
                <button
                  v-else
                  type="button"
                  class="px-2.5 py-1.5 rounded-pill bg-background border border-divider hover:bg-error/10 text-text-secondary hover:text-error font-bold text-[11px] transition-colors flex items-center gap-1"
                  @click="handleRevertPayment(o.id, o.orderNumber)"
                >
                  <ArrowPathIcon class="w-3.5 h-3.5" />
                  <span>Revertir</span>
                </button>

                <button
                  type="button"
                  class="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-accent transition-colors"
                  @click="openDetail(o)"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
              </div>
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
                <th class="py-3.5 px-4">Cliente / Ubicación</th>
                <th class="py-3.5 px-4 text-right">Monto Venta</th>
                <th class="py-3.5 px-4 text-right">Comisión (25%)</th>
                <th class="py-3.5 px-4 text-center">Estado Pago</th>
                <th class="py-3.5 px-4">Fecha Pago</th>
                <th class="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider/70 text-caption font-medium">
              <tr
                v-for="o in filteredOrders"
                :key="o.id"
                class="hover:bg-background/40 transition-colors group cursor-pointer"
                @click="openDetail(o)"
              >
                <!-- Nº Orden y Fecha -->
                <td class="py-3.5 px-4">
                  <div class="font-mono font-extrabold text-accent group-hover:underline text-[13px]">
                    {{ o.orderNumber }}
                  </div>
                  <div class="text-[10px] text-text-secondary mt-0.5">
                    {{ o.createdAt ? dayjs(o.createdAt).format('D MMM YYYY · HH:mm') : '' }}
                  </div>
                </td>

                <!-- Embajadora -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-black shrink-0 uppercase">
                      {{ o.ambassadorName ? o.ambassadorName[0] : 'E' }}
                    </div>
                    <div class="min-w-0">
                      <span class="font-bold text-text-primary block truncate max-w-[150px]">
                        {{ o.ambassadorName }}
                      </span>
                      <span v-if="o.ambassadorCode" class="text-[10px] font-mono text-accent font-semibold block">
                        {{ o.ambassadorCode }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Cliente / Ubicación -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-text-primary truncate max-w-[160px]">
                    {{ o.clientName }}
                  </div>
                  <div class="text-[10px] text-text-secondary truncate max-w-[160px] mt-0.5">
                    <MapPinIcon class="w-3 h-3 text-accent inline mr-0.5" />
                    {{ o.shippingCity || o.shippingState || 'Ubicación' }}
                  </div>
                </td>

                <!-- Monto Venta -->
                <td class="py-3.5 px-4 text-right font-bold text-text-secondary">
                  ${{ o.totalAmount.toFixed(2) }}
                </td>

                <!-- Comisión (25%) -->
                <td class="py-3.5 px-4 text-right font-extrabold text-accent">
                  ${{ o.commissionAmount.toFixed(2) }}
                </td>

                <!-- Estado Pago -->
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border"
                    :class="o.commissionPaid ? 'bg-mint/50 text-success border-success/20' : 'bg-warning/15 text-warning border-warning/30'"
                  >
                    <CheckCircleIcon v-if="o.commissionPaid" class="w-3 h-3" />
                    <ClockIcon v-else class="w-3 h-3" />
                    <span>{{ o.commissionPaid ? 'Pagada' : 'Pendiente' }}</span>
                  </span>
                </td>

                <!-- Fecha Pago -->
                <td class="py-3.5 px-4 text-text-secondary text-[11px]">
                  <span v-if="o.commissionPaid && o.commissionPaidAt" class="text-success font-semibold flex items-center gap-1">
                    <CheckCircleIcon class="w-3.5 h-3.5 text-success" />
                    {{ dayjs(o.commissionPaidAt).format('D MMM, HH:mm') }}
                  </span>
                  <span v-else class="text-text-secondary/60 italic">Por Liquidar</span>
                </td>

                <!-- Acciones -->
                <td class="py-3.5 px-4 text-center" @click.stop>
                  <div class="flex items-center justify-center gap-2">
                    <!-- Botón Confirmar Pago -->
                    <button
                      v-if="!o.commissionPaid"
                      type="button"
                      class="px-3 py-1.5 rounded-pill bg-accent hover:bg-accent-600 text-white font-extrabold text-[11px] transition-all shadow-xs active:scale-95 whitespace-nowrap"
                      @click="handleConfirmPayment(o.id, o.orderNumber)"
                    >
                      Confirmar Pago
                    </button>

                    <!-- Botón Revertir Pago -->
                    <button
                      v-else
                      type="button"
                      class="px-2.5 py-1.5 rounded-pill bg-background border border-divider hover:bg-error/10 text-text-secondary hover:text-error font-bold text-[11px] transition-colors flex items-center gap-1"
                      title="Revertir pago a pendiente"
                      @click="handleRevertPayment(o.id, o.orderNumber)"
                    >
                      <ArrowPathIcon class="w-3.5 h-3.5" />
                      <span>Revertir</span>
                    </button>

                    <!-- Botón Ver Detalle -->
                    <button
                      type="button"
                      class="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-accent transition-colors"
                      title="Ver detalle del pedido"
                      @click="openDetail(o)"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE PAGO Y DESGLOSE -->
    <AppModal
      v-if="selectedOrder"
      v-model="showDetailModal"
      :title="`Detalle de Comisión: ${selectedOrder.orderNumber}`"
      size="md"
    >
      <div class="space-y-4">
        <!-- Resumen de Comisión -->
        <div class="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-background border border-divider text-center">
          <div>
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Monto Total Orden</span>
            <span class="text-subtitle font-black text-text-primary">${{ selectedOrder.totalAmount.toFixed(2) }} USD</span>
          </div>
          <div class="p-2 rounded-xl bg-accent-50/50 border border-accent/20">
            <span class="text-[10px] font-extrabold text-accent uppercase block">Comisión Embajadora (25%)</span>
            <span class="text-subtitle font-black text-accent">${{ selectedOrder.commissionAmount.toFixed(2) }} USD</span>
          </div>
        </div>

        <!-- Estado de Liquidación -->
        <div class="p-3.5 rounded-xl border flex items-center justify-between gap-3" :class="selectedOrder.commissionPaid ? 'bg-mint/20 border-success/30' : 'bg-warning/10 border-warning/30'">
          <div class="flex items-center gap-2">
            <CheckCircleIcon v-if="selectedOrder.commissionPaid" class="w-5 h-5 text-success" />
            <ClockIcon v-else class="w-5 h-5 text-warning" />
            <div>
              <p class="font-bold text-caption text-text-primary">
                {{ selectedOrder.commissionPaid ? 'Comisión Pagada y Liquidada' : 'Comisión Retenida (Pendiente de Pago)' }}
              </p>
              <p v-if="selectedOrder.commissionPaid && selectedOrder.commissionPaidAt" class="text-[11px] text-text-secondary">
                Registrado el {{ dayjs(selectedOrder.commissionPaidAt).format('D [de] MMMM [de] YYYY · HH:mm') }}
              </p>
            </div>
          </div>

          <button
            v-if="!selectedOrder.commissionPaid"
            type="button"
            class="px-4 py-2 rounded-pill bg-accent hover:bg-accent-600 text-white font-extrabold text-caption transition-all shadow-xs active:scale-95 shrink-0"
            @click="handleConfirmPayment(selectedOrder.id, selectedOrder.orderNumber); showDetailModal = false"
          >
            Confirmar Pago
          </button>
        </div>

        <!-- Datos de Vendedora y Cliente -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
          <div class="p-3 rounded-xl bg-surface border border-divider space-y-1">
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Embajadora Oportuna</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.ambassadorName }}</p>
            <p class="text-accent font-mono font-semibold">{{ selectedOrder.ambassadorCode }}</p>
          </div>
          <div class="p-3 rounded-xl bg-surface border border-divider space-y-1">
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Cliente Compradora</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.clientName }}</p>
            <p class="text-text-secondary text-[11px]">{{ selectedOrder.shippingCity }}, {{ selectedOrder.shippingState }}</p>
          </div>
        </div>

        <!-- Desglose de Productos -->
        <div class="space-y-2 pt-2 border-t border-divider">
          <span class="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Productos del Pedido</span>
          <div class="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            <div
              v-for="it in (selectedOrder.items || [])"
              :key="it.id"
              class="p-2.5 rounded-xl bg-background border border-divider flex items-center justify-between gap-2"
            >
              <div class="min-w-0 flex-1">
                <p class="font-bold text-text-primary text-caption truncate">{{ it.productName }}</p>
                <p class="text-[10px] text-text-secondary">
                  SKU: {{ it.productSku || 'N/A' }} {{ it.size ? `· Talla: ${it.size}` : '' }} {{ it.color ? `· Color: ${it.color}` : '' }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <span class="text-caption font-bold text-accent">{{ it.quantity }}x</span>
                <span class="text-caption font-bold text-text-primary block">${{ it.subtotal.toFixed(2) }}</span>
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
