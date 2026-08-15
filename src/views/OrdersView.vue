<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import {
  ShoppingBagIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  BellIcon,
  BanknotesIcon,
} from '@heroicons/vue/24/outline'
import { useOrders, useCommissionStats, useDeleteOrder } from '@modules/orders/composables/useOrders'
import type { Order } from '@modules/orders/types/orders.types'
import OrderFormModal from '@modules/orders/components/OrderFormModal.vue'
import OrderCard from '@modules/orders/components/OrderCard.vue'
import AppModal from '@components/base/AppModal.vue'
import AppButton from '@components/base/AppButton.vue'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const showCreateModal = ref(false)
const initialProductId = ref<string | undefined>(undefined)

const orderToEdit = ref<Order | null>(null)
const deletingOrder = ref<Order | null>(null)
const deleteOrderMutation = useDeleteOrder()

onMounted(() => {
  if (route.query.productId) {
    initialProductId.value = String(route.query.productId)
    showCreateModal.value = true
  }
})

const ambassadorIdRef = computed(() => (auth.role === 'admin' || auth.role === 'super_admin' ? undefined : auth.user?.id))
const { data: orders, isLoading, refetch } = useOrders(ambassadorIdRef)
const { data: stats } = useCommissionStats(ambassadorIdRef)

const filterStatus = ref<string>('all')

const filteredOrders = computed(() => {
  if (!orders.value) return []
  if (filterStatus.value === 'all') return orders.value
  return orders.value.filter((o) => o.status === filterStatus.value)
})

const statusCounts = computed(() => {
  const counts = {
    all: 0,
    pending: 0,
    approved: 0,
    dispatched: 0,
    rejected: 0,
  }
  if (!orders.value) return counts
  counts.all = orders.value.length
  orders.value.forEach((o) => {
    if (o.status in counts) {
      counts[o.status as keyof typeof counts]++
    }
  })
  return counts
})

const { data: unread } = useQuery({
  queryKey: ['notifications', 'unread-count', auth.user?.id],
  queryFn: async () => {
    if (!auth.user?.id) return 0
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)
      .is('read_at', null)
      .is('archived_at', null)
    if (error) throw error
    return count ?? 0
  },
  enabled: !!auth.user?.id,
  refetchInterval: 30000,
})

function handleNewOrder() {
  orderToEdit.value = null
  showCreateModal.value = true
}

function handleEditOrder(ord: Order) {
  orderToEdit.value = ord
  showCreateModal.value = true
}

function openDeleteModal(ord: Order) {
  deletingOrder.value = ord
}

async function confirmDeleteOrder() {
  if (!deletingOrder.value) return
  try {
    await deleteOrderMutation.mutateAsync(deletingOrder.value.id)
    ui.pushToast({ title: 'Pedido eliminado', description: `Se eliminó el pedido ${deletingOrder.value.orderNumber}`, variant: 'success' })
    deletingOrder.value = null
    refetch()
  } catch (e) {
    ui.pushToast({ title: 'Error al eliminar pedido', description: (e as Error).message, variant: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header Editorial Uniforme -->
    <header class="flex items-start justify-between gap-3 pt-1">
      <div class="min-w-0 flex-1">
        <h1 class="text-display font-editorial text-text-primary leading-none mb-2">
          Órdenes & Pedidos
        </h1>
        <p class="text-small text-text-secondary leading-snug max-w-md">
          Registra tus pedidos y controla tus comisiones en tiempo real.
        </p>
      </div>

      <div class="flex flex-col items-end gap-2.5 mt-1">
        <RouterLink
          to="/notificaciones"
          class="relative shrink-0 w-11 h-11 rounded-pill bg-surface shadow-elevation1 flex items-center justify-center hover:shadow-elevation2 transition-shadow"
          aria-label="Notificaciones"
        >
          <BellIcon class="w-5 h-5 text-text-primary" />
          <span
            v-if="unread && unread > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-blush"
          >
            {{ unread > 9 ? '9+' : unread }}
          </span>
        </RouterLink>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-11 px-4 rounded-pill bg-blush text-accent-500 text-small font-semibold hover:bg-accent hover:text-white transition-colors whitespace-nowrap shadow-sm"
          @click="handleNewOrder"
        >
          <PlusIcon class="w-4 h-4" />
          Nuevo pedido
        </button>
      </div>
    </header>

    <!-- Cards de Comisiones & Métricas (Optimizado para móvil como Carrusel Horizontal) -->
    <div class="flex overflow-x-auto md:grid md:grid-cols-5 gap-2 pb-3 mb-4 -mr-4 md:mr-0 scrollbar-hide snap-x snap-mandatory">
      <!-- Aprobados -->
      <div class="snap-start shrink-0 w-[160px] md:w-auto p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <div class="text-caption text-text-secondary flex items-center gap-1.5 font-medium">
          <CheckCircleIcon class="w-4 h-4 text-success" />
          Aprobados
        </div>
        <div class="text-[18px] font-bold text-text-primary leading-tight">
          {{ stats?.approvedOrdersCount ?? 0 }}
        </div>
        <p class="text-[10px] text-text-secondary">
          Pedidos aprobados
        </p>
      </div>

      <!-- Pedidos en Revisión -->
      <div class="snap-start shrink-0 w-[160px] md:w-auto p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <div class="text-caption text-text-secondary flex items-center gap-1.5 font-medium">
          <ClockIcon class="w-4 h-4 text-warning" />
          En Revisión
        </div>
        <div class="text-[18px] font-bold text-text-primary leading-tight">
          {{ stats?.pendingOrdersCount ?? 0 }}
        </div>
        <p class="text-[10px] text-text-secondary">
          Por aprobar
        </p>
      </div>

      <!-- Comisión Retenida (por cobrar) -->
      <div class="snap-start shrink-0 w-[160px] md:w-auto p-5 rounded-2xl bg-gradient-to-br from-blush/60 to-accent-50/80 border border-blush border-accent/20 shadow-elevation1 space-y-1">
        <div class="text-caption text-text-secondary flex items-center gap-1.5 font-medium">
          <BanknotesIcon class="w-4 h-4 text-accent" />
          Comisión por Cobrar
        </div>
        <div class="text-[18px] font-extrabold text-accent leading-tight">
          ${{ (stats?.retainedCommission ?? 0).toFixed(2) }}
        </div>
        <p class="text-[10px] text-text-secondary">
          Pendiente transferir
        </p>
      </div>

      <!-- Comisión Cobrada (ya pagada) -->
      <div class="snap-start shrink-0 w-[160px] md:w-auto p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <div class="text-caption text-text-secondary flex items-center gap-1.5 font-medium">
          <CheckCircleIcon class="w-4 h-4 text-success" />
          Comisión Cobrada
        </div>
        <div class="text-[18px] font-bold text-success leading-tight">
          ${{ (stats?.paidCommission ?? 0).toFixed(2) }}
        </div>
        <p class="text-[10px] text-text-secondary">
          Transferencias listadas
        </p>
      </div>

      <!-- Ventas Totales Aprobadas -->
      <div class="snap-start shrink-0 w-[160px] md:w-auto p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-1">
        <div class="text-caption text-text-secondary flex items-center gap-1.5 font-medium">
          <CurrencyDollarIcon class="w-4 h-4 text-text-primary" />
          Ventas Aprobadas
        </div>
        <div class="text-[18px] font-bold text-text-primary leading-tight">
          ${{ (stats?.totalSales ?? 0).toFixed(2) }}
        </div>
        <p class="text-[10px] text-text-secondary">
          {{ stats?.approvedOrdersCount ?? 0 }} pedidos aprobados
        </p>
      </div>

      <!-- Espaciador derecho en móvil -->
      <div class="w-4 shrink-0 md:hidden" />
    </div>

    <!-- Lista de Órdenes -->
    <div class="space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 class="text-title font-semibold text-text-primary flex items-center gap-2">
          <ShoppingBagIcon class="w-5 h-5 text-accent" />
          Historial de Pedidos
        </h2>

        <!-- Filtros de Estado con Recuentos (Embajadora) -->
        <div v-if="orders && orders.length > 0" class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="st in [
              { key: 'all', label: 'Todos', count: statusCounts.all },
              { key: 'pending', label: 'En Revisión', count: statusCounts.pending },
              { key: 'approved', label: 'Aprobados', count: statusCounts.approved },
              { key: 'dispatched', label: 'Despachados', count: statusCounts.dispatched },
              { key: 'rejected', label: 'Rechazados', count: statusCounts.rejected },
            ]"
            :key="st.key"
            class="px-3 py-1 rounded-pill text-caption font-bold transition-all border flex items-center gap-1"
            :class="filterStatus === st.key ? 'bg-accent text-white border-accent shadow-2xs' : 'bg-surface border-divider text-text-secondary hover:border-accent/40'"
            @click="filterStatus = st.key"
          >
            <span>{{ st.label }}</span>
            <span
              class="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold"
              :class="filterStatus === st.key ? 'bg-white/20 text-white' : 'bg-divider text-text-secondary'"
            >
              {{ st.count }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="p-8 text-center text-text-secondary">
        Cargando pedidos...
      </div>

      <div v-else-if="!orders || orders.length === 0" class="p-8 rounded-2xl bg-surface border border-divider text-center space-y-3 shadow-elevation1">
        <ShoppingBagIcon class="w-12 h-12 text-text-secondary/40 mx-auto" />
        <p class="text-small font-medium text-text-primary">Aún no has registrado ningún pedido</p>
        <p class="text-caption text-text-secondary max-w-sm mx-auto">
          Haz clic en "+ Nuevo pedido" para registrar tu primera venta y comenzar a acumular comisiones.
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-10 px-4 rounded-pill bg-blush text-accent-500 text-small font-semibold hover:bg-accent hover:text-white transition-colors"
          @click="handleNewOrder"
        >
          Registrar Primer Pedido
        </button>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="p-8 rounded-2xl bg-surface border border-divider text-center text-text-secondary shadow-elevation1">
        No hay pedidos registrados con este filtro.
      </div>

      <div v-else class="space-y-3.5">
        <OrderCard
          v-for="ord in filteredOrders"
          :key="ord.id"
          :order="ord"
          @edit="handleEditOrder"
          @delete="openDeleteModal"
        />
      </div>
    </div>

    <!-- Modal Formulario de Registro / Edición de Pedido -->
    <OrderFormModal
      v-if="showCreateModal"
      :initial-product-id="initialProductId"
      :order-to-edit="orderToEdit"
      @close="showCreateModal = false; orderToEdit = null"
      @created="refetch()"
      @updated="refetch()"
    />

    <!-- Modal Confirmación de Eliminación -->
    <AppModal
      v-if="deletingOrder"
      :model-value="true"
      size="sm"
      @update:model-value="(v: boolean) => !v && (deletingOrder = null)"
    >
      <div class="space-y-3">
        <p class="text-small text-text-primary font-medium">
          ¿Estás segura de eliminar el pedido <strong class="font-mono text-accent">{{ deletingOrder.orderNumber }}</strong>?
        </p>
        <p class="text-caption text-text-secondary leading-relaxed">
          Esta acción eliminará el registro del cliente ({{ deletingOrder.clientName }}) y sus productos solicitados de forma permanente.
        </p>
      </div>

      <template #header>
        <h2 class="text-title font-bold text-error">Eliminar Pedido</h2>
      </template>

      <template #footer>
        <AppButton variant="ghost" @click="deletingOrder = null">Cancelar</AppButton>
        <AppButton variant="primary" class="!bg-error text-white" @click="confirmDeleteOrder">
          Sí, Eliminar Pedido
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
