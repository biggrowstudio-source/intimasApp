<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from '@utils/dayjs'
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ClockIcon,
  SparklesIcon,
  UserIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ArrowPathIcon,
  MapPinIcon,
  ChatBubbleLeftIcon,
  TagIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'
import {
  useOrders,
  useApproveOrder,
  useRejectOrder,
  useDispatchOrder,
  useCommissionRate,
  useUpdateCommissionRate,
  useDeleteOrder,
  useSetOrderToPending,
} from '@modules/orders/composables/useOrders'
import { useUiStore } from '@stores/ui.store'
import type { Order } from '@modules/orders/types/orders.types'
import AppModal from '@components/base/AppModal.vue'
import AppButton from '@components/base/AppButton.vue'
import AppTextarea from '@components/base/AppTextarea.vue'
import AppEmptyState from '@components/base/AppEmptyState.vue'

const ui = useUiStore()
const filterStatus = ref<string>('all')
const filterTime = ref<string>('all') // 'all', 'today', 'week', 'month'
const searchQuery = ref('')

const selectedOrder = ref<Order | null>(null)
const showDetailModal = ref(false)
const activeMenuOrderId = ref<string | null>(null)

const toggleMenu = (orderId: string) => {
  activeMenuOrderId.value = activeMenuOrderId.value === orderId ? null : orderId
}

const closeMenu = () => {
  activeMenuOrderId.value = null
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

const openDetail = (order: Order) => {
  selectedOrder.value = order
  showDetailModal.value = true
}

const { data: orders, isLoading, refetch } = useOrders()
const { data: commissionRate } = useCommissionRate()
const updateRateMutation = useUpdateCommissionRate()

const approveMutation = useApproveOrder()
const rejectMutation = useRejectOrder()
const dispatchMutation = useDispatchOrder()
const deleteMutation = useDeleteOrder()
const toPendingMutation = useSetOrderToPending()

// Form para cambiar % comisión
const newCommissionRate = ref<number | null>(null)
const isEditingCommission = ref(false)

// Modal de rechazo
const rejectingOrder = ref<Order | null>(null)
const rejectionReasonInput = ref('')

// Modal de eliminación
const deletingOrder = ref<Order | null>(null)

// Filtrado por tiempo
const timeFilteredOrders = computed(() => {
  if (!orders.value) return []
  const now = new Date()
  if (filterTime.value === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return orders.value.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfToday)
  } else if (filterTime.value === 'week') {
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000
    return orders.value.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfWeek)
  } else if (filterTime.value === 'month') {
    const startOfMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000
    return orders.value.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfMonth)
  }
  return orders.value
})

// Filtrado por estado y buscador por texto
const filteredOrders = computed(() => {
  let list = timeFilteredOrders.value

  if (filterStatus.value !== 'all') {
    list = list.filter((o) => o.status === filterStatus.value)
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

const statusCounts = computed(() => {
  const counts = {
    all: 0,
    pending: 0,
    approved: 0,
    dispatched: 0,
    rejected: 0,
  }
  const list = timeFilteredOrders.value
  counts.all = list.length
  list.forEach((o) => {
    if (o.status in counts) {
      counts[o.status as keyof typeof counts]++
    }
  })
  return counts
})

async function handleSaveCommissionRate() {
  if (newCommissionRate.value == null || newCommissionRate.value < 0 || newCommissionRate.value > 100) {
    ui.pushToast({ title: 'Porcentaje inválido', description: 'Debe ser entre 0 y 100', variant: 'error' })
    return
  }
  try {
    await updateRateMutation.mutateAsync(newCommissionRate.value)
    ui.pushToast({ title: 'Comisión actualizada', description: `Nueva tasa: ${newCommissionRate.value}%`, variant: 'success' })
    isEditingCommission.value = false
    refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al actualizar', description: (e as Error).message, variant: 'error' })
  }
}

async function handleApprove(orderId: string) {
  try {
    await approveMutation.mutateAsync(orderId)
    ui.pushToast({ title: 'Pedido Aprobado', description: 'La comisión ha sido asignada a la embajadora', variant: 'success' })
    refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al aprobar', description: (e as Error).message, variant: 'error' })
  }
}

function openRejectModal(order: Order) {
  rejectingOrder.value = order
  rejectionReasonInput.value = ''
}

async function submitRejection() {
  if (!rejectingOrder.value) return
  if (!rejectionReasonInput.value.trim()) {
    ui.pushToast({ title: 'Motivo requerido', description: 'Indica la razón del rechazo (ej. sin stock, error de datos)', variant: 'error' })
    return
  }
  try {
    await rejectMutation.mutateAsync({
      orderId: rejectingOrder.value.id,
      reason: rejectionReasonInput.value.trim(),
    })
    ui.pushToast({ title: 'Pedido Rechazado', description: 'Se notificó la razón del rechazo', variant: 'info' })
    rejectingOrder.value = null
    refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al rechazar', description: (e as Error).message, variant: 'error' })
  }
}

async function handleDispatch(orderId: string) {
  try {
    await dispatchMutation.mutateAsync(orderId)
    ui.pushToast({ title: 'Pedido Despachado', description: 'El estado del envío cambió a Despachado', variant: 'success' })
    refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al despachar', description: (e as Error).message, variant: 'error' })
  }
}

async function handleToPending(orderId: string) {
  try {
    await toPendingMutation.mutateAsync(orderId)
    ui.pushToast({ title: 'Pedido Revertido', description: 'El pedido regresó a estado En Revisión', variant: 'success' })
    refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al cambiar estado', description: (e as Error).message, variant: 'error' })
  }
}

function exportCSV() {
  if (!filteredOrders.value || filteredOrders.value.length === 0) return
  const headers = ['Nro Orden', 'Fecha', 'Embajadora', 'Codigo EMB', 'Cliente', 'Ciudad', 'Monto Venta USD', 'Comision USD', 'Estado Pedido']

  const rows = filteredOrders.value.map((o) => [
    o.orderNumber,
    o.createdAt ? dayjs(o.createdAt).format('YYYY-MM-DD HH:mm') : '',
    `"${o.ambassadorName}"`,
    o.ambassadorCode || '',
    `"${o.clientName}"`,
    o.shippingCity || '',
    o.totalAmount.toFixed(2),
    o.commissionAmount.toFixed(2),
    o.status,
  ].join(','))

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `pedidos_admin_${dayjs().format('YYYY-MM-DD')}.csv`)
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
            Gestión de Pedidos
          </h1>
        </div>
        <p class="text-caption text-text-secondary pl-9">
          Administración centralizada de órdenes, aprobación de ventas y cambio de estado en todo momento.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap self-start sm:self-auto">
        <button
          type="button"
          class="px-4 py-2.5 rounded-pill bg-surface border border-divider hover:bg-background text-text-primary font-bold text-caption flex items-center gap-2 transition-all shadow-2xs active:scale-95"
          @click="exportCSV"
        >
          <DocumentArrowDownIcon class="w-4 h-4 text-accent" />
          <span>Exportar CSV</span>
        </button>
      </div>
    </div>

    <!-- TARJETAS DE RESUMEN KPI GLOBAL -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Total Pedidos</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-text-primary tracking-tight">
          {{ statusCounts.all }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-medium text-text-secondary">Órdenes totales</span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-warning/30 shadow-elevation1 space-y-1 bg-warning/5">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-warning uppercase tracking-wider block">En Revisión</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-warning tracking-tight">
          {{ statusCounts.pending }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-warning flex items-center gap-1">
          <ClockIcon class="w-3.5 h-3.5" /> Pendientes
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-success/30 shadow-elevation1 space-y-1 bg-mint/10">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-success uppercase tracking-wider block">Aprobadas</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-success tracking-tight">
          {{ statusCounts.approved }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-success flex items-center gap-1">
          <CheckCircleIcon class="w-3.5 h-3.5" /> Confirmadas
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-accent/30 shadow-elevation1 space-y-1 bg-accent-50/40">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-accent uppercase tracking-wider block">Despachadas</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-accent tracking-tight">
          {{ statusCounts.dispatched }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-accent flex items-center gap-1">
          <TruckIcon class="w-3.5 h-3.5" /> Enviadas
        </span>
      </div>

      <div class="p-3.5 sm:p-4 rounded-2xl bg-surface border border-error/30 shadow-elevation1 space-y-1 bg-error/5 col-span-2 sm:col-span-1">
        <span class="text-[10px] sm:text-[11px] font-extrabold text-error uppercase tracking-wider block">Rechazadas</span>
        <div class="text-title sm:text-h2 font-editorial font-black text-error tracking-tight">
          {{ statusCounts.rejected }}
        </div>
        <span class="text-[10px] sm:text-[11px] font-bold text-error flex items-center gap-1">
          <XCircleIcon class="w-3.5 h-3.5" /> Canceladas
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

        <!-- Filtro Estado de Pedido -->
        <div class="flex items-center gap-1 bg-background p-1 rounded-xl border border-divider overflow-x-auto max-w-full">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'all' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'all'"
          >
            Todos ({{ statusCounts.all }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'pending' ? 'bg-surface text-warning shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'pending'"
          >
            En Revisión ({{ statusCounts.pending }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'approved' ? 'bg-surface text-success shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'approved'"
          >
            Aprobados ({{ statusCounts.approved }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'dispatched' ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'dispatched'"
          >
            Despachados ({{ statusCounts.dispatched }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-caption font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'rejected' ? 'bg-surface text-error shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
            @click="filterStatus = 'rejected'"
          >
            Rechazados ({{ statusCounts.rejected }})
          </button>
        </div>
      </div>
    </div>

    <!-- CONTENEDOR DE PEDIDOS: TABLA EN ESCRITORIO / TARJETAS EN MÓVIL (0 SCROLL HORIZONTAL) -->
    <div class="rounded-2xl bg-surface border border-divider shadow-elevation1 overflow-visible">
      <div v-if="isLoading" class="p-12 flex flex-col items-center justify-center space-y-3">
        <div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span class="text-caption text-text-secondary font-medium">Cargando reporte de pedidos...</span>
      </div>

      <div v-else-if="!filteredOrders || filteredOrders.length === 0" class="p-8">
        <AppEmptyState
          title="No se encontraron pedidos"
          description="Ajusta los filtros de búsqueda o el rango de tiempo seleccionado."
          icon-name="orders"
        />
      </div>

      <div v-else>
        <!-- 1. VISTA MÓVIL EN TARJETAS SEPARADAS (Gap de 12px y bordes independientes) -->
        <div class="block md:hidden space-y-3 p-3 bg-background/30 rounded-2xl">
          <div
            v-for="(o, idx) in filteredOrders"
            :key="o.id"
            class="p-4 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation2 transition-all relative"
            :class="{ 'z-50': activeMenuOrderId === o.id }"
            @click="openDetail(o)"
          >

            <!-- Fila Superior: Orden, Fecha & Estado -->
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
                :class="{
                  'bg-warning/15 text-warning border-warning/30': o.status === 'pending',
                  'bg-mint/50 text-success border-success/30': o.status === 'approved',
                  'bg-accent/15 text-accent border-accent/30': o.status === 'dispatched',
                  'bg-error/15 text-error border-error/30': o.status === 'rejected',
                }"
              >
                <span>{{ o.status === 'pending' ? 'En Revisión' : o.status === 'approved' ? 'Aprobado' : o.status === 'dispatched' ? 'Despachado' : 'Rechazado' }}</span>
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

            <!-- Fila Inferior: Montos & Acciones Rápidas -->
            <div class="flex items-center justify-between pt-1" @click.stop>
              <div>
                <span class="text-[9px] font-extrabold text-text-secondary uppercase block">Venta / Comisión</span>
                <span class="text-caption font-bold text-text-primary">${{ o.totalAmount.toFixed(2) }}</span>
                <span class="text-caption font-extrabold text-accent ml-1.5">(-${{ o.commissionAmount.toFixed(2) }})</span>
              </div>

              <div class="flex items-center gap-1.5 relative">
                <button
                  v-if="o.status === 'pending'"
                  type="button"
                  class="px-3 py-1.5 rounded-pill bg-mint text-success hover:bg-success hover:text-white font-extrabold text-[11px] transition-all shadow-xs active:scale-95"
                  @click="handleApprove(o.id)"
                >
                  Aprobar
                </button>
                <button
                  v-else-if="o.status === 'approved'"
                  type="button"
                  class="px-3 py-1.5 rounded-pill bg-accent text-white font-extrabold text-[11px] transition-all shadow-xs active:scale-95"
                  @click="handleDispatch(o.id)"
                >
                  Despachar
                </button>
                <button
                  v-else-if="o.status === 'rejected'"
                  type="button"
                  class="px-3 py-1.5 rounded-pill bg-warning/15 text-warning font-bold text-[11px] transition-colors"
                  @click="handleToPending(o.id)"
                >
                  Reactivar
                </button>

                <!-- Menú Desplegable Flotante -->
                <div class="relative">
                  <button
                    type="button"
                    class="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-accent transition-colors"
                    @click="toggleMenu(o.id)"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4" />
                  </button>
                  <div
                    v-if="activeMenuOrderId === o.id"
                    class="absolute right-0 w-48 rounded-2xl bg-surface border border-divider shadow-elevation3 py-1.5 z-[100] text-left"
                    :class="idx >= filteredOrders.length - 2 && filteredOrders.length > 2 ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'"
                    @click.stop
                  >
                    <span class="px-3 py-1 text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block border-b border-divider/60 mb-1">
                      Cambiar Estado
                    </span>
                    <button v-if="o.status !== 'approved'" type="button" class="w-full px-3 py-2 text-caption font-bold text-success hover:bg-mint/40 flex items-center gap-2" @click="closeMenu(); handleApprove(o.id)">
                      <CheckCircleIcon class="w-4 h-4 text-success" />
                      <span>Aprobar Pedido</span>
                    </button>
                    <button v-if="o.status !== 'dispatched'" type="button" class="w-full px-3 py-2 text-caption font-bold text-accent hover:bg-accent-50 flex items-center gap-2" @click="closeMenu(); handleDispatch(o.id)">
                      <TruckIcon class="w-4 h-4 text-accent" />
                      <span>Marcar Despachado</span>
                    </button>
                    <button v-if="o.status !== 'pending'" type="button" class="w-full px-3 py-2 text-caption font-bold text-warning hover:bg-warning/10 flex items-center gap-2" @click="closeMenu(); handleToPending(o.id)">
                      <ArrowPathIcon class="w-4 h-4 text-warning" />
                      <span>Pasar a Pendiente</span>
                    </button>
                    <button v-if="o.status !== 'rejected'" type="button" class="w-full px-3 py-2 text-caption font-bold text-error hover:bg-error/10 flex items-center gap-2 border-t border-divider/60" @click="closeMenu(); openRejectModal(o)">
                      <XCircleIcon class="w-4 h-4 text-error" />
                      <span>Rechazar Pedido</span>
                    </button>
                  </div>
                </div>

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
                <th class="py-3.5 px-4 text-center">Estado Pedido</th>
                <th class="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider/70 text-caption font-medium">
              <tr
                v-for="(o, idx) in filteredOrders"
                :key="o.id"
                class="hover:bg-background/40 transition-colors group cursor-pointer"
                :class="{ 'relative z-50': activeMenuOrderId === o.id }"
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
                <td class="py-3.5 px-4 text-right font-bold text-text-primary">
                  ${{ o.totalAmount.toFixed(2) }}
                </td>

                <!-- Comisión (25%) -->
                <td class="py-3.5 px-4 text-right font-extrabold text-accent">
                  ${{ o.commissionAmount.toFixed(2) }}
                </td>

                <!-- Estado Pedido -->
                <td class="py-3.5 px-4 text-center">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 border"
                    :class="{
                      'bg-warning/15 text-warning border-warning/30': o.status === 'pending',
                      'bg-mint/50 text-success border-success/30': o.status === 'approved',
                      'bg-accent/15 text-accent border-accent/30': o.status === 'dispatched',
                      'bg-error/15 text-error border-error/30': o.status === 'rejected',
                    }"
                  >
                    <ClockIcon v-if="o.status === 'pending'" class="w-3 h-3" />
                    <CheckCircleIcon v-else-if="o.status === 'approved'" class="w-3 h-3" />
                    <TruckIcon v-else-if="o.status === 'dispatched'" class="w-3 h-3" />
                    <XCircleIcon v-else-if="o.status === 'rejected'" class="w-3 h-3" />
                    <span>
                      {{ o.status === 'pending' ? 'En Revisión' : o.status === 'approved' ? 'Aprobado' : o.status === 'dispatched' ? 'Despachado' : 'Rechazado' }}
                    </span>
                  </span>
                </td>

                <!-- Acciones Rápidas con Menú Completo de Estados -->
                <td class="py-3.5 px-4 text-center" @click.stop>
                  <div class="flex items-center justify-center gap-1.5 relative">
                    <!-- Acciones Principales según Estado -->
                    <button
                      v-if="o.status === 'pending'"
                      type="button"
                      class="px-3 py-1.5 rounded-pill bg-mint text-success hover:bg-success hover:text-white font-extrabold text-[11px] transition-all shadow-xs active:scale-95 whitespace-nowrap"
                      @click="handleApprove(o.id)"
                    >
                      Aprobar
                    </button>

                    <button
                      v-else-if="o.status === 'approved'"
                      type="button"
                      class="px-3 py-1.5 rounded-pill bg-accent hover:bg-accent-600 text-white font-extrabold text-[11px] transition-all shadow-xs active:scale-95 whitespace-nowrap"
                      @click="handleDispatch(o.id)"
                    >
                      Despachar
                    </button>

                    <button
                      v-else-if="o.status === 'rejected'"
                      type="button"
                      class="px-3 py-1.5 rounded-pill bg-warning/15 text-warning hover:bg-warning hover:text-white font-bold text-[11px] transition-colors whitespace-nowrap"
                      @click="handleToPending(o.id)"
                    >
                      Reactivar
                    </button>

                    <!-- Menú Desplegable Completo -->
                    <div class="relative">
                      <button
                        type="button"
                        class="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-accent transition-colors border border-transparent hover:border-divider"
                        title="Cambiar estado u opciones"
                        @click="toggleMenu(o.id)"
                      >
                        <EllipsisVerticalIcon class="w-4 h-4" />
                      </button>

                      <!-- Dropdown Popover Menu -->
                      <div
                        v-if="activeMenuOrderId === o.id"
                        class="absolute right-0 w-48 rounded-2xl bg-surface border border-divider shadow-elevation3 py-1.5 z-[100] text-left animate-in fade-in zoom-in-95 duration-150"
                        :class="idx >= filteredOrders.length - 2 && filteredOrders.length > 2 ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'"
                        @click.stop
                      >
                        <span class="px-3 py-1 text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block border-b border-divider/60 mb-1">
                          Cambiar Estado
                        </span>

                        <button
                          v-if="o.status !== 'approved'"
                          type="button"
                          class="w-full px-3 py-2 text-caption font-bold text-success hover:bg-mint/40 flex items-center gap-2 transition-colors"
                          @click="closeMenu(); handleApprove(o.id)"
                        >
                          <CheckCircleIcon class="w-4 h-4 text-success" />
                          <span>Aprobar Pedido</span>
                        </button>

                        <button
                          v-if="o.status !== 'dispatched'"
                          type="button"
                          class="w-full px-3 py-2 text-caption font-bold text-accent hover:bg-accent-50 flex items-center gap-2 transition-colors"
                          @click="closeMenu(); handleDispatch(o.id)"
                        >
                          <TruckIcon class="w-4 h-4 text-accent" />
                          <span>Marcar Despachado</span>
                        </button>

                        <button
                          v-if="o.status !== 'pending'"
                          type="button"
                          class="w-full px-3 py-2 text-caption font-bold text-warning hover:bg-warning/10 flex items-center gap-2 transition-colors"
                          @click="closeMenu(); handleToPending(o.id)"
                        >
                          <ArrowPathIcon class="w-4 h-4 text-warning" />
                          <span>Pasar a Pendiente</span>
                        </button>

                        <button
                          v-if="o.status !== 'rejected'"
                          type="button"
                          class="w-full px-3 py-2 text-caption font-bold text-error hover:bg-error/10 flex items-center gap-2 transition-colors border-t border-divider/60"
                          @click="closeMenu(); openRejectModal(o)"
                        >
                          <XCircleIcon class="w-4 h-4 text-error" />
                          <span>Rechazar Pedido</span>
                        </button>
                      </div>
                    </div>

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

    <!-- MODAL DETALLE DE PEDIDO COMPLETO CON ACCIONES TOTALES DE CAMBIO DE ESTADO -->
    <AppModal
      v-if="selectedOrder"
      v-model="showDetailModal"
      :title="`Detalle de Orden: ${selectedOrder.orderNumber}`"
      size="md"
    >
      <div class="space-y-4">
        <!-- Resumen de Montos -->
        <div class="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-background border border-divider text-center">
          <div>
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Monto Venta</span>
            <span class="text-subtitle font-black text-text-primary">${{ selectedOrder.totalAmount.toFixed(2) }} USD</span>
          </div>
          <div>
            <span class="text-[10px] font-extrabold text-accent uppercase block">Comisión (25%)</span>
            <span class="text-subtitle font-black text-accent">-${{ selectedOrder.commissionAmount.toFixed(2) }} USD</span>
          </div>
          <div>
            <span class="text-[10px] font-extrabold text-success uppercase block">Monto Neto</span>
            <span class="text-subtitle font-black text-success">${{ (selectedOrder.totalAmount - selectedOrder.commissionAmount).toFixed(2) }} USD</span>
          </div>
        </div>

        <!-- Datos de Vendedora y Cliente -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
          <div class="p-3 rounded-xl bg-surface border border-divider space-y-1">
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Embajadora</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.ambassadorName }}</p>
            <p class="text-accent font-mono font-semibold">{{ selectedOrder.ambassadorCode }}</p>
          </div>
          <div class="p-3 rounded-xl bg-surface border border-divider space-y-1">
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Cliente Final</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.clientName }}</p>
            <p class="text-text-secondary text-[11px]">{{ selectedOrder.clientPhone }}</p>
          </div>
        </div>

        <!-- Dirección de Envío -->
        <div class="p-3 rounded-xl bg-background border border-divider flex items-start gap-2.5 text-caption">
          <MapPinIcon class="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span class="text-[10px] font-extrabold text-text-secondary uppercase block">Dirección de Envío</span>
            <p class="font-bold text-text-primary">{{ selectedOrder.shippingStreet }}</p>
            <p class="text-text-secondary text-[11px]">{{ selectedOrder.shippingCity }}, {{ selectedOrder.shippingState }} — {{ selectedOrder.shippingCountry }}</p>
          </div>
        </div>

        <!-- Notas e Indicaciones del Pedido -->
        <div v-if="selectedOrder.notes" class="p-3 rounded-xl bg-blush/40 border border-blush text-caption space-y-1">
          <span class="text-[10px] font-extrabold text-accent uppercase block">Notas e Indicaciones Especiales</span>
          <p class="font-medium text-text-primary whitespace-pre-wrap">{{ selectedOrder.notes }}</p>
        </div>

        <!-- Desglose de Productos -->
        <div class="space-y-2 pt-2 border-t border-divider">
          <span class="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider block">Productos del Pedido</span>
          <div class="space-y-2 max-h-[180px] overflow-y-auto pr-1">
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

        <!-- Botones de Acción dentro del Modal (Todos los cambios de estado disponibles en todo momento) -->
        <div class="pt-3 border-t border-divider flex items-center justify-end gap-2 flex-wrap">
          <button
            v-if="selectedOrder.status !== 'approved'"
            type="button"
            class="px-4 py-2 rounded-pill bg-mint text-success font-bold text-caption hover:bg-success hover:text-white transition-colors flex items-center gap-1.5"
            @click="handleApprove(selectedOrder.id); showDetailModal = false"
          >
            <CheckCircleIcon class="w-4 h-4" />
            <span>Aprobar Pedido</span>
          </button>

          <button
            v-if="selectedOrder.status !== 'dispatched'"
            type="button"
            class="px-4 py-2 rounded-pill bg-accent text-white font-bold text-caption hover:bg-accent-600 transition-colors flex items-center gap-1.5"
            @click="handleDispatch(selectedOrder.id); showDetailModal = false"
          >
            <TruckIcon class="w-4 h-4" />
            <span>Marcar Despachado</span>
          </button>

          <button
            v-if="selectedOrder.status !== 'pending'"
            type="button"
            class="px-4 py-2 rounded-pill bg-warning/15 text-warning font-bold text-caption hover:bg-warning hover:text-white transition-colors flex items-center gap-1.5"
            @click="handleToPending(selectedOrder.id); showDetailModal = false"
          >
            <ArrowPathIcon class="w-4 h-4" />
            <span>Pasar a Pendiente</span>
          </button>

          <button
            v-if="selectedOrder.status !== 'rejected'"
            type="button"
            class="px-4 py-2 rounded-pill bg-error/10 text-error font-bold text-caption hover:bg-error hover:text-white transition-colors flex items-center gap-1.5"
            @click="openRejectModal(selectedOrder); showDetailModal = false"
          >
            <XCircleIcon class="w-4 h-4" />
            <span>Rechazar Pedido</span>
          </button>
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

    <!-- MODAL MOTIVO DE RECHAZO -->
    <AppModal
      v-if="rejectingOrder"
      v-model="rejectingOrder"
      title="Rechazar Pedido"
      size="sm"
    >
      <div class="space-y-3">
        <p class="text-caption text-text-secondary">
          Indica el motivo del rechazo para la orden <strong>{{ rejectingOrder.orderNumber }}</strong>:
        </p>

        <AppTextarea
          v-model="rejectionReasonInput"
          placeholder="Ej: Producto sin stock en almacén principal, error en la dirección..."
          :rows="3"
        />
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <AppButton variant="ghost" @click="rejectingOrder = null">
            Cancelar
          </AppButton>

          <AppButton
            variant="primary"
            class="!bg-error hover:!bg-error/90 !text-white"
            @click="submitRejection"
          >
            Confirmar Rechazo
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
