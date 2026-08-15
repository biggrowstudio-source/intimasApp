<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import { useUiStore } from '@stores/ui.store'
import type { Order } from '@modules/orders/types/orders.types'

const props = defineProps<{
  order: Order
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  approve: [id: string]
  reject: [order: Order]
  dispatch: [id: string]
  edit: [order: Order]
  delete: [order: Order]
  toPending: [id: string]
}>()

const ui = useUiStore()
const isExpanded = ref(false)
const isCopied = ref(false)
const showMenu = ref(false)

const closeMenu = () => {
  showMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

function copyOrderNumber() {
  if (!props.order.orderNumber) return
  navigator.clipboard.writeText(props.order.orderNumber)
  isCopied.value = true
  ui.pushToast({
    title: 'Número de orden copiado',
    description: props.order.orderNumber,
    variant: 'success',
  })
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

const statusBadges: Record<string, { label: string; class: string; icon: any; dotClass: string }> = {
  pending: {
    label: 'En Revisión',
    class: 'bg-warning/15 text-warning border-warning/30',
    dotClass: 'bg-warning animate-pulse',
    icon: ClockIcon,
  },
  approved: {
    label: 'Aprobado',
    class: 'bg-mint text-success border-success/30',
    dotClass: 'bg-success',
    icon: CheckCircleIcon,
  },
  rejected: {
    label: 'Rechazado',
    class: 'bg-error/15 text-error border-error/30',
    dotClass: 'bg-error',
    icon: XCircleIcon,
  },
  dispatched: {
    label: 'Despachado',
    class: 'bg-accent/15 text-accent border-accent/30',
    dotClass: 'bg-accent',
    icon: TruckIcon,
  },
}

const cleanPhone = computed(() => {
  if (!props.order.clientPhone) return ''
  return props.order.clientPhone.replace(/\D/g, '')
})

const whatsappUrl = computed(() => {
  if (!cleanPhone.value) return '#'
  return `https://wa.me/${cleanPhone.value}?text=Hola%20${encodeURIComponent(props.order.clientName)},%20te%20contactamos%20sobre%20tu%20pedido%20${props.order.orderNumber}`
})

const formattedDateTime = computed(() => {
  if (!props.order.createdAt) return ''
  const date = new Date(props.order.createdAt)
  const dateStr = date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${dateStr} · ${timeStr}`
})

const productSummary = computed(() => {
  if (!props.order.items || props.order.items.length === 0) return 'Sin productos'
  const first = props.order.items[0]
  if (props.order.items.length === 1) {
    return `${first.quantity}x ${first.productName}`
  }
  return `${first.quantity}x ${first.productName} y ${props.order.items.length - 1} producto(s) más`
})

const rejectionTimelineSteps = computed(() => {
  if (!props.order.rejectionReason) return []
  return props.order.rejectionReason
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^•?\s*\[(.*?)\]:\s*(.*)$/)
      if (match) {
        return {
          date: match[1],
          text: match[2]
        }
      }
      const date = props.order.updatedAt ? new Date(props.order.updatedAt) : new Date()
      const dateStr = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
      const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
      
      const cleanText = line.startsWith('•') ? line.substring(1).trim() : line
      return {
        date: `${dateStr}, ${timeStr}`,
        text: cleanText
      }
    })
})
</script>

<template>
  <div
    class="relative rounded-2xl bg-surface border border-divider shadow-elevation1 hover:shadow-elevation2 hover:border-accent/30 transition-all duration-200"
    :class="{ '!z-40': showMenu }"
  >
    <!-- CLICKABLE HEADER AREA (Always visible) -->
    <div
      class="flex items-center justify-between gap-3 w-full p-4 sm:p-5 cursor-pointer select-none pr-14"
      @click="isExpanded = !isExpanded"
    >
      <!-- Left side: Order Number, Copy & Badge -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1.5">
          <span class="font-mono font-extrabold text-body sm:text-title text-accent tracking-tight">
            {{ order.orderNumber }}
          </span>
          <button
            type="button"
            class="p-1 rounded-md text-accent/70 hover:text-accent hover:bg-accent-50 active:scale-90 transition-all"
            title="Copiar número de orden"
            aria-label="Copiar número de orden"
            @click.stop="copyOrderNumber"
          >
            <CheckIcon v-if="isCopied" class="w-4 h-4 text-success font-bold" />
            <DocumentDuplicateIcon v-else class="w-4 h-4" />
          </button>
        </div>

        <span
          class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs ml-1"
          :class="statusBadges[order.status]?.class"
        >
          <component :is="statusBadges[order.status]?.icon" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ statusBadges[order.status]?.label }}</span>
        </span>
      </div>

      <!-- Right side: Date/Time & Chevron -->
      <div class="flex items-center gap-3 text-text-secondary shrink-0">
        <span class="text-caption font-medium flex items-center gap-1.5 whitespace-nowrap hidden sm:inline-flex">
          <ClockIcon class="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
          <span class="capitalize">{{ formattedDateTime }}</span>
        </span>
        <component :is="isExpanded ? ChevronUpIcon : ChevronDownIcon" class="w-5 h-5 text-text-secondary/80 transition-transform duration-200" />
      </div>
    </div>

    <!-- On mobile view, show date below title ONLY if collapsed to look extremely tidy -->
    <div
      v-if="!isExpanded"
      class="sm:hidden px-4 pb-4 -mt-2 text-[11px] text-text-secondary flex items-center gap-1.5 cursor-pointer select-none"
      @click="isExpanded = true"
    >
      <ClockIcon class="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
      <span>{{ formattedDateTime }}</span>
    </div>

    <!-- Menú de Opciones (Absolute overlay positioned top right corner) -->
    <div
      v-if="isAdmin || (!isAdmin && (order.status === 'pending' || order.status === 'rejected'))"
      class="absolute top-3.5 right-3 sm:top-4.5 sm:right-4 z-30"
    >
      <div class="relative">
        <button
          type="button"
          class="w-8 h-8 rounded-full bg-surface border border-divider hover:bg-accent-50 text-text-secondary hover:text-accent flex items-center justify-center transition-all shadow-2xs active:scale-95"
          title="Más Opciones del Pedido"
          aria-label="Más Opciones del Pedido"
          @click.stop="showMenu = !showMenu"
        >
          <EllipsisVerticalIcon class="w-5 h-5" />
        </button>

        <div
          v-if="showMenu"
          class="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-divider shadow-elevation3 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          @click.stop
        >
          <!-- OPCIONES ADMINISTRADOR -->
          <template v-if="isAdmin">
            <button
              v-if="order.status === 'pending'"
              type="button"
              class="w-full px-4 py-2.5 text-left text-caption font-bold text-success hover:bg-mint/40 flex items-center gap-2.5 transition-colors"
              @click="showMenu = false; emit('approve', order.id)"
            >
              <CheckCircleIcon class="w-4 h-4 text-success" />
              <span>Aprobar Pedido</span>
            </button>

            <button
              v-if="order.status === 'approved'"
              type="button"
              class="w-full px-4 py-2.5 text-left text-caption font-bold text-accent hover:bg-accent-50 flex items-center gap-2.5 transition-colors"
              @click="showMenu = false; emit('dispatch', order.id)"
            >
              <TruckIcon class="w-4 h-4 text-accent" />
              <span>Marcar como Despachado</span>
            </button>

            <button
              v-if="order.status !== 'rejected'"
              type="button"
              class="w-full px-4 py-2.5 text-left text-caption font-bold text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors border-t border-divider/60"
              @click="showMenu = false; emit('reject', order)"
            >
              <XCircleIcon class="w-4 h-4 text-error" />
              <span>Rechazar / Cancelar Pedido</span>
            </button>

            <button
              v-if="order.status !== 'pending'"
              type="button"
              class="w-full px-4 py-2.5 text-left text-caption font-bold text-accent hover:bg-accent-50 flex items-center gap-2.5 transition-colors border-t border-divider/60"
              @click="showMenu = false; emit('toPending', order.id)"
            >
              <ArrowPathIcon class="w-4 h-4 text-accent" />
              <span>Pasar a Pendiente</span>
            </button>
          </template>

          <!-- OPCIONES EMBAJADORA -->
          <template v-else>
            <button
              v-if="order.status === 'pending' || order.status === 'rejected'"
              type="button"
              class="w-full px-4 py-2.5 text-left text-caption font-bold text-text-primary hover:bg-accent-50 flex items-center gap-2.5 transition-colors"
              @click="showMenu = false; emit('edit', order)"
            >
              <PencilSquareIcon class="w-4 h-4 text-accent" />
              <span>Editar Pedido</span>
            </button>

            <button
              v-if="order.status === 'pending' || order.status === 'rejected'"
              type="button"
              class="w-full px-4 py-2.5 text-left text-caption font-bold text-error hover:bg-error/10 flex items-center gap-2.5 transition-colors border-t border-divider/60"
              @click="showMenu = false; emit('delete', order)"
            >
              <TrashIcon class="w-4 h-4 text-error" />
              <span>Cancelar / Eliminar Pedido</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- COLLAPSIBLE CONTENT AREA (Visible only when expanded) -->
    <div
      v-if="isExpanded"
      class="px-4 pb-5 sm:px-5 sm:pb-6 border-t border-divider/60 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <!-- CONTENIDO PRINCIPAL (Cliente, Total, Comisión, Resumen Productos) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 text-small">
        <!-- Datos del Cliente -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-full bg-accent-50 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <UserIcon class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Cliente</span>
            <h4 class="font-bold text-text-primary truncate leading-tight">{{ order.clientName }}</h4>
            <a
              v-if="cleanPhone"
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-medium mt-0.5"
            >
              <ChatBubbleLeftIcon class="w-3 h-3" />
              <span>{{ order.clientPhone }}</span>
            </a>
          </div>
        </div>

        <!-- Resumen de Productos -->
        <div class="min-w-0 flex-1 md:px-4">
          <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Pedido</span>
          <p class="font-medium text-text-primary text-caption truncate">{{ productSummary }}</p>
        </div>

        <!-- Precios, Totales & Comisiones -->
        <div class="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <!-- Rol Administrador -->
          <template v-if="isAdmin">
            <div class="text-right">
              <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Monto Venta</span>
              <span class="text-caption font-semibold text-text-secondary">${{ order.totalAmount.toFixed(2) }} USD</span>
            </div>

            <div class="px-2 py-0.5 rounded-md bg-error/10 border border-error/20 text-right">
              <span class="text-[9px] font-bold text-error uppercase block">Comisión ({{ order.commissionRate }}%)</span>
              <span class="text-caption font-bold text-error">-${{ order.commissionAmount.toFixed(2) }} USD</span>
            </div>

            <div class="px-2.5 py-1 rounded-lg bg-mint/50 border border-mint text-right">
              <span class="text-[10px] font-bold text-success uppercase block">Monto Final</span>
              <span class="text-small font-extrabold text-success">${{ (order.totalAmount - order.commissionAmount).toFixed(2) }} USD</span>
            </div>
          </template>

          <!-- Rol Embajadora -->
          <template v-else>
            <div class="text-right">
              <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Monto Total</span>
              <span class="text-small font-extrabold text-accent">${{ order.totalAmount.toFixed(2) }} USD</span>
            </div>

            <div class="px-2.5 py-1 rounded-lg bg-mint/50 border border-mint text-right">
              <span class="text-[10px] font-bold text-success uppercase block">Comisión ({{ order.commissionRate }}%)</span>
              <span class="text-caption font-bold text-success">${{ order.commissionAmount.toFixed(2) }} USD</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Dirección Completa de Envío -->
      <div class="p-3.5 rounded-xl bg-background/80 border border-divider flex items-start gap-3 text-small">
        <div class="w-8 h-8 rounded-full bg-mint border border-mint/60 flex items-center justify-center text-success shrink-0 mt-0.5">
          <MapPinIcon class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Dirección de Envío</span>
          <p class="font-bold text-text-primary leading-tight">{{ order.shippingStreet }}</p>
          <p class="text-caption text-text-secondary">
            {{ order.shippingCity }}, {{ order.shippingState }} — {{ order.shippingCountry }} {{ order.shippingZip ? `(CP: ${order.shippingZip})` : '' }}
          </p>
        </div>
      </div>

      <!-- Notas e Indicaciones Especiales del Pedido -->
      <div v-if="order.notes" class="p-3.5 rounded-xl bg-blush/40 border border-blush flex items-start gap-3 text-small">
        <div class="w-8 h-8 rounded-full bg-accent-50 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
          <DocumentTextIcon class="w-4 h-4" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="text-[10px] font-bold text-accent uppercase tracking-wider block">Notas e Indicaciones Especiales</span>
          <p class="text-caption font-medium text-text-primary whitespace-pre-wrap leading-snug mt-0.5">{{ order.notes }}</p>
        </div>
      </div>

      <!-- Desglose Completo de Productos -->
      <div v-if="order.items && order.items.length > 0" class="space-y-2">
        <span class="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <TagIcon class="w-3.5 h-3.5 text-accent" />
          Desglose de Productos
        </span>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div
            v-for="it in order.items"
            :key="it.id"
            class="p-2.5 rounded-xl bg-background border border-divider flex items-center justify-between gap-2 shadow-2xs"
          >
            <div class="min-w-0 flex-1">
              <p class="font-bold text-text-primary text-caption truncate">{{ it.productName }}</p>
              <div class="flex items-center gap-1 flex-wrap text-[11px] text-text-secondary mt-0.5">
                <span v-if="it.productSku" class="font-mono text-accent">SKU: {{ it.productSku }}</span>
                <span v-if="it.size" class="px-1.5 py-0.5 rounded bg-surface border border-divider font-mono font-medium">{{ it.size }}</span>
                <span v-if="it.color" class="px-1.5 py-0.5 rounded bg-surface border border-divider font-medium text-text-primary">{{ it.color }}</span>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-caption font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent-50 border border-accent/20">
                {{ it.quantity }}x
              </span>
              <span class="block text-[11px] font-bold text-text-primary mt-1">${{ it.subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Observaciones / Rechazos -->
      <div v-if="rejectionTimelineSteps.length > 0" class="p-4 rounded-2xl bg-error/5 border border-error/20 space-y-3">
        <h5 class="text-caption font-bold text-error uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-error/10">
          <XCircleIcon class="w-5 h-5 text-error shrink-0" />
          <span>Historial de Observaciones</span>
        </h5>

        <div class="relative pl-4 border-l-2 border-error/20 space-y-4 py-1">
          <div v-for="(step, idx) in rejectionTimelineSteps" :key="idx" class="relative group">
            <span class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-error border border-white ring-4 ring-error/15 shadow-2xs" />
            <div class="space-y-0.5">
              <span v-if="step.date" class="text-[10px] font-bold text-error/85 tracking-tight block">{{ step.date }}</span>
              <p class="text-caption font-semibold text-text-primary leading-relaxed">{{ step.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de Acción Rápidas en el Pie de Tarjeta -->
      <div
        v-if="(isAdmin && (order.status === 'pending' || order.status === 'approved')) || (!isAdmin && (order.status === 'pending' || order.status === 'rejected'))"
        class="pt-4 border-t border-divider flex items-center justify-between flex-wrap gap-2"
      >
        <div v-if="!isAdmin && (order.status === 'pending' || order.status === 'rejected')" class="flex items-center gap-2">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-pill bg-background border border-divider text-text-primary hover:bg-accent-50 text-caption font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            @click="emit('edit', order)"
          >
            <PencilSquareIcon class="w-3.5 h-3.5 text-accent" />
            Editar Pedido
          </button>

          <button
            type="button"
            class="px-3.5 py-1.5 rounded-pill bg-error/10 text-error hover:bg-error hover:text-white text-caption font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            @click="emit('delete', order)"
          >
            <TrashIcon class="w-3.5 h-3.5" />
            Eliminar
          </button>
        </div>
        <div v-else />

        <div v-if="isAdmin && order.status === 'pending'" class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            class="px-5 py-2 rounded-pill bg-error/10 text-error hover:bg-error hover:text-white text-caption font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            @click="emit('reject', order)"
          >
            <XCircleIcon class="w-4 h-4" />
            <span>Rechazar</span>
          </button>

          <button
            type="button"
            class="px-5 py-2 rounded-pill bg-mint text-success hover:bg-success hover:text-white text-caption font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            @click="emit('approve', order.id)"
          >
            <CheckCircleIcon class="w-4 h-4" />
            <span>Aprobar Pedido</span>
          </button>
        </div>

        <div v-else-if="isAdmin && order.status === 'approved'" class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            class="px-5 py-2 rounded-pill bg-accent text-white hover:bg-accent-600 text-caption font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            @click="emit('dispatch', order.id)"
          >
            <TruckIcon class="w-4 h-4" />
            Marcar como Despachado
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
