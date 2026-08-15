<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import {
  UsersIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  SparklesIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  FolderOpenIcon,
  ArrowPathIcon,
  EyeIcon,
  ChartPieIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth.store'
import { useUpcomingWorkshops } from '@modules/home/composables/useUpcomingWorkshops'
import AppTopBar from '@components/base/AppTopBar.vue'

const auth = useAuthStore()
const firstName = computed(() => auth.profile?.firstName ?? 'Administrador')
const { data: upcomingWorkshops } = useUpcomingWorkshops()

const chartMode = ref<'area' | 'bar'>('area')
const selectedTimeRange = ref<'today' | 'week' | 'month' | 'custom' | 'all'>('today')

const timeRangeLabel = computed(() => {
  if (selectedTimeRange.value === 'today') return 'diario'
  if (selectedTimeRange.value === 'week') return 'semanal'
  if (selectedTimeRange.value === 'month') return 'mensual'
  if (selectedTimeRange.value === 'custom') return 'personalizado'
  return 'histórico'
})

const formatDateForInput = (d: Date) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const customStartDate = ref(formatDateForInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
const customEndDate = ref(formatDateForInput(new Date()))

// 1. Cargar Estadísticas Generales e Histórico de Órdenes
const { data: dashboardData, isLoading, refetch, isRefetching } = useQuery({
  queryKey: ['admin', 'dashboard-full-stats'],
  queryFn: async () => {
    const [usersRes, docsRes, workshopsRes, ordersRes, itemsRes] = await Promise.all([
      supabase.from('profiles').select('id, role, created_at'),
      supabase.from('documents').select('id, category_id', { count: 'exact', head: true }),
      supabase.from('workshops').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('order_id, product_name, quantity, subtotal'),
    ])

    const profiles = usersRes.data ?? []
    const orders = ordersRes.data ?? []
    const items = itemsRes.data ?? []

    const totalUsers = profiles.length
    const totalAmbassadors = profiles.filter((p) => p.role !== 'admin' && p.role !== 'super_admin').length
    const totalDocs = docsRes.count ?? 0
    const totalWorkshops = workshopsRes.count ?? 0

    return {
      totalUsers,
      totalAmbassadors,
      totalDocs,
      totalWorkshops,
      orders,
      items,
    }
  },
  refetchInterval: 30000,
})

// 2. Procesamiento reactivo local según el rango de tiempo seleccionado
const filteredData = computed(() => {
  if (!dashboardData.value) return null

  const now = new Date()
  let startDate: Date | null = null
  let endDate: Date | null = null

  if (selectedTimeRange.value === 'today') {
    startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
  } else if (selectedTimeRange.value === 'week') {
    startDate = new Date()
    startDate.setDate(now.getDate() - 7)
    startDate.setHours(0, 0, 0, 0)
  } else if (selectedTimeRange.value === 'month') {
    startDate = new Date()
    startDate.setDate(now.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)
  } else if (selectedTimeRange.value === 'custom') {
    if (customStartDate.value) {
      startDate = new Date(customStartDate.value)
      startDate.setHours(0, 0, 0, 0)
    }
    if (customEndDate.value) {
      endDate = new Date(customEndDate.value)
      endDate.setHours(23, 59, 59, 999)
    }
  }

  const allOrders = dashboardData.value.orders
  const filteredOrders = allOrders.filter((o) => {
    const oDate = new Date(o.created_at)
    if (startDate && oDate < startDate) return false
    if (endDate && oDate > endDate) return false
    return true
  })

  let totalSalesUSD = 0
  let totalCommissionUSD = 0
  let pendingCommissionAmount = 0
  let pendingCount = 0
  let approvedCount = 0
  let dispatchedCount = 0
  let rejectedCount = 0

  filteredOrders.forEach((ord) => {
    const amount = Number(ord.total_amount) || 0
    const rate = Number(ord.commission_rate) || 25
    const commission = Number(ord.commission_amount) || (amount * (rate / 100))

    if (ord.status === 'pending') {
      pendingCount++
    } else if (ord.status === 'approved' || ord.status === 'dispatched') {
      if (ord.status === 'approved') approvedCount++
      if (ord.status === 'dispatched') dispatchedCount++
      totalSalesUSD += amount
      totalCommissionUSD += commission
      if (!ord.commission_paid) {
        pendingCommissionAmount += commission
      }
    } else if (ord.status === 'rejected') {
      rejectedCount++
    }
  })


  // Trend list
  let trend: { label: string; sales: number; count: number }[] = []

  if (selectedTimeRange.value === 'today') {
    const hourlyMap: Record<string, { label: string; sales: number; count: number }> = {}
    for (let h = 0; h < 24; h += 2) {
      const label = `${h.toString().padStart(2, '0')}:00`
      hourlyMap[label] = { label, sales: 0, count: 0 }
    }
    filteredOrders.forEach((ord) => {
      const date = new Date(ord.created_at)
      const hour = date.getHours()
      const slotHour = Math.floor(hour / 2) * 2
      const label = `${slotHour.toString().padStart(2, '0')}:00`
      const amount = Number(ord.total_amount) || 0
      if (hourlyMap[label] && (ord.status === 'approved' || ord.status === 'dispatched')) {
        hourlyMap[label].sales += amount
        hourlyMap[label].count += 1
      }
    })
    trend = Object.values(hourlyMap)
  } else if (selectedTimeRange.value === 'week') {
    const dayMap: Record<string, { label: string; sales: number; count: number; orderIdx: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const label = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
      const key = d.toDateString()
      dayMap[key] = { label, sales: 0, count: 0, orderIdx: i }
    }
    filteredOrders.forEach((ord) => {
      const date = new Date(ord.created_at)
      const key = date.toDateString()
      const amount = Number(ord.total_amount) || 0
      if (dayMap[key] && (ord.status === 'approved' || ord.status === 'dispatched')) {
        dayMap[key].sales += amount
        dayMap[key].count += 1
      }
    })
    trend = Object.values(dayMap)
  } else if (selectedTimeRange.value === 'month') {
    const dayMap: Record<string, { label: string; sales: number; count: number; dateVal: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const label = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
      const key = d.toDateString()
      dayMap[key] = { label, sales: 0, count: 0, dateVal: d.getTime() }
    }
    filteredOrders.forEach((ord) => {
      const date = new Date(ord.created_at)
      const key = date.toDateString()
      const amount = Number(ord.total_amount) || 0
      if (dayMap[key] && (ord.status === 'approved' || ord.status === 'dispatched')) {
        dayMap[key].sales += amount
        dayMap[key].count += 1
      }
    })
    trend = Object.values(dayMap).sort((a, b) => a.dateVal - b.dateVal)
  } else if (selectedTimeRange.value === 'custom' && startDate && endDate) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) {
      const hourlyMap: Record<string, { label: string; sales: number; count: number }> = {}
      for (let h = 0; h < 24; h += 2) {
        const label = `${h.toString().padStart(2, '0')}:00`
        hourlyMap[label] = { label, sales: 0, count: 0 }
      }
      filteredOrders.forEach((ord) => {
        const date = new Date(ord.created_at)
        const hour = date.getHours()
        const slotHour = Math.floor(hour / 2) * 2
        const label = `${slotHour.toString().padStart(2, '0')}:00`
        const amount = Number(ord.total_amount) || 0
        if (hourlyMap[label] && (ord.status === 'approved' || ord.status === 'dispatched')) {
          hourlyMap[label].sales += amount
          hourlyMap[label].count += 1
        }
      })
      trend = Object.values(hourlyMap)
    } else if (diffDays <= 31) {
      const dayMap: Record<string, { label: string; sales: number; count: number; dateVal: number }> = {}
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startDate.getTime())
        d.setDate(startDate.getDate() + i)
        const label = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
        const key = d.toDateString()
        dayMap[key] = { label, sales: 0, count: 0, dateVal: d.getTime() }
      }
      filteredOrders.forEach((ord) => {
        const date = new Date(ord.created_at)
        const key = date.toDateString()
        const amount = Number(ord.total_amount) || 0
        if (dayMap[key] && (ord.status === 'approved' || ord.status === 'dispatched')) {
          dayMap[key].sales += amount
          dayMap[key].count += 1
        }
      })
      trend = Object.values(dayMap).sort((a, b) => a.dateVal - b.dateVal)
    } else {
      const monthlySalesMap: Record<string, { label: string; sales: number; count: number; time: number }> = {}
      filteredOrders.forEach((ord) => {
        const amount = Number(ord.total_amount) || 0
        const date = new Date(ord.created_at)
        const monthKey = date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
        if (!monthlySalesMap[monthKey]) {
          monthlySalesMap[monthKey] = { label: monthKey, sales: 0, count: 0, time: date.getTime() }
        }
        if (ord.status === 'approved' || ord.status === 'dispatched') {
          monthlySalesMap[monthKey].sales += amount
          monthlySalesMap[monthKey].count += 1
        }
      })
      trend = Object.values(monthlySalesMap).sort((a, b) => a.time - b.time)
    }
  } else {
    const monthlySalesMap: Record<string, { label: string; sales: number; count: number; time: number }> = {}
    filteredOrders.forEach((ord) => {
      const amount = Number(ord.total_amount) || 0
      const date = new Date(ord.created_at)
      const monthKey = date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      if (!monthlySalesMap[monthKey]) {
        monthlySalesMap[monthKey] = { label: monthKey, sales: 0, count: 0, time: date.getTime() }
      }
      if (ord.status === 'approved' || ord.status === 'dispatched') {
        monthlySalesMap[monthKey].sales += amount
        monthlySalesMap[monthKey].count += 1
      }
    })
    trend = Object.values(monthlySalesMap).sort((a, b) => a.time - b.time).slice(-7)
  }

  // Top products
  const productCountMap: Record<string, { name: string; quantity: number; total: number }> = {}
  const filteredOrderIds = new Set(filteredOrders.map((o) => o.id))
  dashboardData.value.items.forEach((it) => {
    if (it.order_id && !filteredOrderIds.has(it.order_id)) return
    const name = it.product_name
    if (!productCountMap[name]) {
      productCountMap[name] = { name, quantity: 0, total: 0 }
    }
    productCountMap[name].quantity += Number(it.quantity) || 1
    productCountMap[name].total += Number(it.subtotal) || 0
  })

  const topProducts = Object.values(productCountMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    totalOrders: filteredOrders.length,
    totalSalesUSD,
    totalCommissionUSD,
    pendingCommissionAmount,
    pendingCount,
    approvedCount,
    dispatchedCount,
    rejectedCount,
    recentOrders: filteredOrders.slice(0, 5),
    topProducts,
    trend,
  }
})

const maxChartSales = computed(() => {
  const trend = filteredData.value?.trend ?? []
  if (trend.length === 0) return 1000
  const max = Math.max(...trend.map((m) => m.sales))
  return max > 0 ? max : 1000
})

// Cálculo de Puntos SVG para Área de Ventas
const svgPathD = computed(() => {
  const points = filteredData.value?.trend ?? []
  if (points.length === 0) return ''
  const width = 600
  const height = 180
  const padding = 20
  const max = maxChartSales.value

  const coords = points.map((item, idx) => {
    const x = padding + (idx / Math.max(1, points.length - 1)) * (width - padding * 2)
    const y = height - padding - (item.sales / max) * (height - padding * 2)
    return { x, y }
  })

  let d = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]
    const curr = coords[i]
    const cx = (prev.x + curr.x) / 2
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`
  }

  return d
})

const svgAreaD = computed(() => {
  const lineD = svgPathD.value
  if (!lineD) return ''
  const width = 600
  const height = 180
  const padding = 20
  const trend = filteredData.value?.trend ?? []
  const lastX = padding + (Math.max(0, trend.length - 1) / Math.max(1, trend.length - 1)) * (width - padding * 2)
  const firstX = padding

  return `${lineD} L ${lastX} ${height - 10} L ${firstX} ${height - 10} Z`
})

// Modulos de Navegación 100% alineados con Paleta de la Marca (Primary #1A191E, Accent #E07A78, Secondary #EAD0C4)
const adminNavItems = [
  { label: 'Banners y Contenido Home', path: '/admin/contenido', icon: SparklesIcon, badge: 'Home' },
  { label: 'Órdenes y Pedidos', path: '/admin/ordenes', icon: ShoppingBagIcon, badge: 'Ventas' },
  { label: 'Red de Embajadoras', path: '/admin/usuarios', icon: UsersIcon, badge: 'Red' },
  { label: 'Biblioteca', path: '/biblioteca', icon: BookOpenIcon, badge: 'Biblioteca' },
  { label: 'Workshops & Cursos', path: '/admin/workshops', icon: AcademicCapIcon, badge: 'Aulas' },
  { label: 'Comunidad Intimas', path: '/comunidad', icon: MegaphoneIcon, badge: 'Social' },
  { label: 'Recursos Descargables', path: '/biblioteca', icon: FolderOpenIcon, badge: 'Archivos' },
  { label: 'Reconocimientos', path: '/admin/reconocimientos', icon: TrophyIcon, badge: 'Logros' },
  { label: 'Configuración Tasa', path: '/admin/configuracion', icon: Cog6ToothIcon, badge: 'Ajustes' },
]

const rankColors = [
  'from-accent-400 to-accent-500 text-white shadow-accent/20',
  'from-secondary-300 to-secondary-400 text-primary shadow-secondary/20',
  'from-primary-600 to-primary-800 text-white shadow-primary/20',
  'from-accent-50 to-accent-100 text-accent',
  'from-surface to-background text-text-secondary',
]

const activeAlerts = computed(() => {
  if (!upcomingWorkshops.value) return []

  const now = new Date()
  const alerts: { id: string; title: string; date: string; isLive: boolean }[] = []

  upcomingWorkshops.value.forEach((ws) => {
    const wsDate = new Date(ws.date)
    const isSameDay = wsDate.toDateString() === now.toDateString()
    if (!isSameDay) return

    const fifteenMinsBefore = new Date(wsDate.getTime() - 15 * 60 * 1000)
    const twoHoursAfter = new Date(wsDate.getTime() + 2 * 60 * 60 * 1000)
    const isLive = now >= fifteenMinsBefore && now <= twoHoursAfter

    alerts.push({
      id: ws.id,
      title: ws.title,
      date: ws.date,
      isLive,
    })
  })

  return alerts
})

const isTodayWorkshop = (dateStr: string) => {
  const wsDate = new Date(dateStr)
  const today = new Date()
  return wsDate.toDateString() === today.toDateString()
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- HERO HEADER CON COLORES OFICIALES DE LA MARCA (DE ROSA A BEIGE) -->
    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-accent to-secondary text-primary shadow-elevation2 relative overflow-hidden group border border-secondary/20">
      <!-- Resplandor ambiental con colores de la marca -->
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20 blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      <div class="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1 max-w-xl">
          <h1 class="text-title sm:text-h3 font-editorial font-extrabold leading-tight tracking-tight text-primary">
            Hola {{ firstName }}, este es tu resumen {{ timeRangeLabel }}
          </h1>

          <p class="text-[11px] text-primary/80 leading-relaxed font-medium">
            Control de ingresos, seguimiento de comisiones para la red de embajadoras y métricas clave en tiempo real.
          </p>
        </div>

        <!-- Botón de actualización y resumen en vivo -->
        <div class="flex flex-col items-start md:items-end gap-2 shrink-0">
          <button
            type="button"
            class="px-5 py-2 rounded-pill bg-primary text-white hover:bg-primary-900 font-bold text-caption flex items-center gap-2 transition-all shadow-md active:scale-95 border border-primary/20"
            @click="refetch()"
          >
            <ArrowPathIcon :class="['w-4 h-4', isRefetching ? 'animate-spin' : '']" />
            <span>{{ isRefetching ? 'Sincronizando...' : 'Actualizar Datos' }}</span>
          </button>

          <div class="text-caption text-primary/70 font-bold">
            Última actualización: <strong class="text-primary">{{ new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas de Eventos Activos de Hoy / En Vivo -->
    <div v-if="activeAlerts && activeAlerts.length > 0" class="space-y-3">
      <div
        v-for="alert in activeAlerts"
        :key="alert.id"
        class="p-4 rounded-2xl flex items-center justify-between gap-4 border shadow-sm transition-all"
        :class="alert.isLive 
          ? 'bg-red-50 border-red-200 text-red-950 animate-pulse ring-1 ring-red-300' 
          : 'bg-accent/10 border-accent/30 text-text-primary'"
      >
        <div class="flex items-start gap-3">
          <div class="relative shrink-0 mt-0.5">
            <span v-if="alert.isLive" class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <CalendarDaysIcon class="w-6 h-6 text-accent shrink-0" />
          </div>

          <div>
            <h4 class="text-caption font-black flex items-center gap-2">
              <span 
                v-if="alert.isLive" 
                class="px-2 py-0.5 rounded text-[9px] font-black bg-red-600 text-white tracking-widest uppercase animate-bounce"
              >
                EN VIVO
              </span>
              <span 
                v-else 
                class="px-2 py-0.5 rounded text-[9px] font-bold bg-accent text-white tracking-wider uppercase"
              >
                HOY
              </span>
              {{ alert.title }}
            </h4>
            <p class="text-[11px] opacity-90 mt-0.5">
              {{ alert.isLive 
                ? 'El taller está sucediendo ahora mismo. ¡Ingresa ya para interactuar!' 
                : `Este taller está programado para hoy a las ${new Date(alert.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.` }}
            </p>
          </div>
        </div>

        <RouterLink
          to="/admin/workshops"
          class="shrink-0 px-4 py-1.5 rounded-pill font-black text-caption transition-colors active:scale-95 text-center shadow-2xs"
          :class="alert.isLive 
            ? 'bg-red-600 text-white hover:bg-red-700' 
            : 'bg-accent text-white hover:bg-accent-600'"
        >
          {{ alert.isLive ? 'Unirse Ahora' : 'Ver Detalles' }}
        </RouterLink>
      </div>
    </div>

    <!-- FILTRO DE RANGO DE TIEMPO GLOBAL PREMIUM Y PERSONALIZADO -->
    <div class="flex flex-col gap-3.5 max-w-xl">
      <div class="flex items-center justify-between p-1 bg-surface border border-divider rounded-2xl shadow-elevation1">
        <button
          v-for="range in [
            { key: 'today', label: 'Hoy' },
            { key: 'week', label: 'Esta Semana' },
            { key: 'month', label: 'Este Mes' },
            { key: 'custom', label: 'Personalizado' },
            { key: 'all', label: 'Histórico' }
          ] as const"
          :key="range.key"
          type="button"
          class="flex-1 py-2 text-caption font-extrabold rounded-xl transition-all duration-200 text-center"
          :class="selectedTimeRange === range.key ? 'bg-accent text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
          @click="selectedTimeRange = range.key"
        >
          {{ range.label }}
        </button>
      </div>

      <!-- Inputs para Rango de Fechas Personalizado -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 -translate-y-2 scale-95"
      >
        <div v-if="selectedTimeRange === 'custom'" class="flex items-center gap-3 p-4 bg-surface border border-divider rounded-2xl shadow-elevation1">
          <div class="flex-1">
            <label class="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Desde</label>
            <input
              type="date"
              v-model="customStartDate"
              class="w-full px-3 py-1.5 rounded-xl border border-divider text-caption font-bold bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div class="flex-1">
            <label class="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Hasta</label>
            <input
              type="date"
              v-model="customEndDate"
              class="w-full px-3 py-1.5 rounded-xl border border-divider text-caption font-bold bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Alerta de Comisiones Pendientes por Cobrar -->
    <div
      v-if="filteredData && filteredData.pendingCommissionAmount > 0"
      class="p-5 rounded-3xl bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/30 flex items-center justify-between gap-4 shadow-sm"
    >
      <div class="flex items-start gap-3">
        <ClockIcon class="w-6 h-6 text-warning shrink-0 mt-0.5" />
        <div>
          <h4 class="text-caption font-bold text-text-primary">Tienes comisiones pendientes de pago</h4>
          <p class="text-[11px] text-text-secondary mt-0.5">
            Hay comisiones acumuladas por un valor de <strong class="text-warning">${{ filteredData.pendingCommissionAmount.toFixed(2) }} USD</strong> esperando liquidación.
          </p>
        </div>
      </div>
      <RouterLink
        to="/admin/comisiones"
        class="shrink-0 text-caption font-extrabold text-accent hover:text-accent-600 hover:underline"
      >
        Pagar comisiones →
      </RouterLink>
    </div>

    <!-- TARJETAS MÉTRICAS EJECUTIVAS (KPIs EN PALETA ÍNTIMAS) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Ventas Totales Aprobadas -->
      <div class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation3 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div class="flex items-center justify-between">
          <span class="text-caption font-extrabold text-text-secondary uppercase tracking-wider">Ventas Confirmadas</span>
          <div class="w-10 h-10 rounded-xl bg-mint text-success flex items-center justify-center group-hover:scale-110 transition-transform">
            <CurrencyDollarIcon class="w-6 h-6" />
          </div>
        </div>
        <div>
          <div class="text-h2 font-editorial font-black text-text-primary tracking-tight">
            ${{ (filteredData?.totalSalesUSD ?? 0).toFixed(2) }}
          </div>
          <p class="text-[11px] text-text-secondary mt-0.5">Ventas aprobadas y despachadas</p>
        </div>
        <div class="pt-2 border-t border-divider flex items-center justify-between text-caption font-semibold">
          <span class="text-success flex items-center gap-1 text-[11px]">
            <ArrowTrendingUpIcon class="w-3.5 h-3.5" /> +{{ filteredData?.approvedCount ?? 0 }} pedidos
          </span>
          <RouterLink to="/admin/ventas" class="text-success font-bold hover:underline text-[11px]">Ver ventas →</RouterLink>
        </div>
      </div>

      <!-- 2. Comisiones Retenidas -->
      <div class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation3 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div class="flex items-center justify-between">
          <span class="text-caption font-extrabold text-text-secondary uppercase tracking-wider">Comisiones Retenidas</span>
          <div class="w-10 h-10 rounded-xl bg-accent-50 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrophyIcon class="w-6 h-6" />
          </div>
        </div>
        <div>
          <div class="text-h2 font-editorial font-black text-accent tracking-tight">
            ${{ (filteredData?.pendingCommissionAmount ?? 0).toFixed(2) }}
          </div>
          <p class="text-[11px] text-text-secondary mt-0.5">Pendiente por liquidar a embajadoras (25%)</p>

        </div>
        <div class="pt-2 border-t border-divider flex items-center justify-between text-caption font-semibold">
          <span class="text-accent text-[11px]">Red activa</span>
          <RouterLink to="/admin/comisiones" class="text-accent font-bold hover:underline text-[11px]">Ver comisiones →</RouterLink>
        </div>
      </div>

      <!-- 3. Total de Pedidos Registrados -->
      <div class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation3 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div class="flex items-center justify-between">
          <span class="text-caption font-extrabold text-text-secondary uppercase tracking-wider">Pedidos Registrados</span>
          <div class="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBagIcon class="w-6 h-6" />
          </div>
        </div>
        <div>
          <div class="text-h2 font-editorial font-black text-text-primary tracking-tight">
            {{ filteredData?.totalOrders ?? 0 }}
          </div>
          <p class="text-[11px] text-text-secondary mt-0.5">Órdenes totales en período</p>
        </div>
        <div class="pt-2 border-t border-divider flex items-center justify-between text-caption font-semibold">
          <span class="px-2 py-0.5 rounded-full bg-warning/15 text-warning font-bold text-[11px] flex items-center gap-1">
            <ClockIcon class="w-3 h-3" /> {{ filteredData?.pendingCount ?? 0 }} en revisión
          </span>
        </div>
      </div>

      <!-- 4. Red de Embajadoras -->
      <div class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 space-y-3 hover:shadow-elevation3 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div class="flex items-center justify-between">
          <span class="text-caption font-extrabold text-text-secondary uppercase tracking-wider">Red de Embajadoras</span>
          <div class="w-10 h-10 rounded-xl bg-blush text-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UsersIcon class="w-6 h-6" />
          </div>
        </div>
        <div>
          <div class="text-h2 font-editorial font-black text-text-primary tracking-tight">
            {{ dashboardData?.totalAmbassadors ?? 0 }}
          </div>
          <p class="text-[11px] text-text-secondary mt-0.5">{{ dashboardData?.totalUsers ?? 0 }} usuarias en total</p>
        </div>
        <div class="pt-2 border-t border-divider flex items-center justify-between text-caption font-semibold">
          <span class="text-text-secondary text-[11px]">Comunidad activa</span>
          <RouterLink to="/admin/usuarios" class="text-accent font-bold hover:underline text-[11px]">Ver red →</RouterLink>
        </div>
      </div>
    </div>

    <!-- SECCIÓN DE PRÓXIMOS WORKSHOPS (EN LA MITAD DEL DASHBOARD) -->
    <div class="space-y-4 pt-2">
      <div class="flex items-center justify-between pb-2 border-b border-divider">
        <h3 class="text-title font-bold text-text-primary flex items-center gap-2">
          <CalendarDaysIcon class="w-5 h-5 text-accent" />
          Próximos Aulas y Talleres Activos
        </h3>
        <RouterLink to="/admin/workshops" class="text-caption font-bold text-accent hover:underline flex items-center gap-1">
          <span>Administrar Talleres</span>
          <ArrowRightIcon class="w-3.5 h-3.5" />
        </RouterLink>
      </div>

      <div v-if="upcomingWorkshops && upcomingWorkshops.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink
          v-for="ws in upcomingWorkshops.slice(0, 3)"
          :key="ws.id"
          to="/admin/workshops"
          :class="isTodayWorkshop(ws.date) ? 'border-accent ring-1 ring-accent/30 shadow-md bg-accent-50/10' : 'border-divider shadow-elevation1 bg-surface'"
          class="p-4 rounded-2xl transition-all flex flex-col justify-between gap-3 relative overflow-hidden group cursor-pointer border"
        >
          <div class="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors pointer-events-none" />

          <div class="space-y-1.5 z-10">
            <div class="flex items-center justify-between">
              <span
                v-if="isTodayWorkshop(ws.date)"
                class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-accent text-white uppercase tracking-wider animate-pulse border border-accent-300 shadow-sm"
              >
                HOY
              </span>
              <span
                v-else
                class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent-50 text-accent uppercase tracking-wider"
              >
                Disponible
              </span>
              <span class="text-[11px] text-text-secondary font-mono font-bold">
                Cap: {{ ws.capacity }}
              </span>
            </div>

            <h4 class="font-bold text-text-primary text-small group-hover:text-accent transition-colors line-clamp-1">
              {{ ws.title }}
            </h4>
            <p class="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
              {{ ws.description || 'Sin descripción disponible.' }}
            </p>
          </div>

          <div class="pt-3 border-t border-divider flex items-center justify-between text-[11px] text-text-secondary font-semibold z-10">
            <span class="flex items-center gap-1">
              <CalendarDaysIcon class="w-4 h-4 text-accent" />
              {{ new Date(ws.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
            </span>
            <span class="text-accent font-bold">
              {{ ws.location || 'Online' }}
            </span>
          </div>
        </RouterLink>
      </div>
      <div v-else class="p-6 text-center text-caption text-text-secondary bg-surface border border-divider rounded-2xl italic">
        No hay próximos talleres programados en este momento.
      </div>
    </div>

    <!-- SECCIÓN DE GRÁFICOS CON TONOS MARCA (ACCENT #E07A78) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- 1. GRÁFICO SVG INTERACTIVO: TENDENCIA DE INGRESOS ($ USD) -->
      <div class="lg:col-span-2 p-6 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-divider">
          <div>
            <h3 class="text-title font-bold text-text-primary flex items-center gap-2">
              <ChartBarIcon class="w-5 h-5 text-accent" />
              Tendencia de Ingresos & Ventas ($ USD)
            </h3>
            <p class="text-caption text-text-secondary">Evolución del volumen de ventas procesadas en el rango seleccionado</p>
          </div>

          <!-- Modos de Visualización del Gráfico -->
          <div class="flex items-center gap-1.5 p-1 rounded-pill bg-background border border-divider">
            <button
              type="button"
              class="px-3 py-1 rounded-pill text-caption font-bold transition-all"
              :class="chartMode === 'area' ? 'bg-accent text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
              @click="chartMode = 'area'"
            >
              Curva Íntimas
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-pill text-caption font-bold transition-all"
              :class="chartMode === 'bar' ? 'bg-accent text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'"
              @click="chartMode = 'bar'"
            >
              Barras
            </button>
          </div>
        </div>

        <!-- MODO 1: GRÁFICO SVG ÁREA CON GRADIENTE DE MARCA -->
        <div v-if="chartMode === 'area' && filteredData?.trend && filteredData.trend.length > 0" class="pt-2 space-y-3">
          <div class="relative w-full h-52">
            <svg viewBox="0 0 600 180" class="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#E07A78" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#E07A78" stop-opacity="0.0" />
                </linearGradient>

                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#E07A78" />
                  <stop offset="50%" stop-color="#C95F5D" />
                  <stop offset="100%" stop-color="#1A191E" />
                </linearGradient>
              </defs>

              <line x1="20" y1="20" x2="580" y2="20" stroke="currentColor" class="text-divider" stroke-dasharray="4 4" stroke-width="1" />
              <line x1="20" y1="90" x2="580" y2="90" stroke="currentColor" class="text-divider" stroke-dasharray="4 4" stroke-width="1" />
              <line x1="20" y1="160" x2="580" y2="160" stroke="currentColor" class="text-divider" stroke-width="1" />

              <path :d="svgAreaD" fill="url(#salesGrad)" />
              <path :d="svgPathD" fill="none" stroke="url(#lineGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

              <g v-for="(item, idx) in filteredData.trend" :key="item.label">
                <circle
                  :cx="20 + (idx / Math.max(1, filteredData.trend.length - 1)) * 560"
                  :cy="160 - (item.sales / maxChartSales) * 140"
                  r="5"
                  class="fill-surface stroke-accent stroke-[3] hover:r-7 transition-all cursor-pointer shadow-md"
                />
              </g>
            </svg>
          </div>

          <div class="flex justify-between px-3 text-caption font-bold text-text-secondary capitalize overflow-x-auto scrollbar-hide">
            <span v-for="item in filteredData.trend" :key="item.label" class="text-center shrink-0 min-w-[50px] px-1">
              {{ item.label }}
              <strong class="block text-[10px] text-accent">${{ item.sales.toFixed(0) }}</strong>
            </span>
          </div>
        </div>

        <!-- MODO 2: GRÁFICO DE BARRAS GRADIENTES -->
        <div v-else-if="chartMode === 'bar' && filteredData?.trend && filteredData.trend.length > 0" class="pt-2 space-y-3">
          <div class="h-52 flex items-end gap-3 sm:gap-6 px-2 justify-around border-b border-divider pb-2 overflow-x-auto scrollbar-hide">
            <div
              v-for="item in filteredData.trend"
              :key="item.label"
              class="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[32px]"
            >
              <span class="opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                ${{ item.sales.toFixed(2) }}
              </span>

              <div
                class="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-accent to-secondary-300 group-hover:from-accent-500 group-hover:to-accent transition-all duration-300 shadow-sm relative"
                :style="{ height: `${Math.max(12, (item.sales / maxChartSales) * 100)}%` }"
              />

              <span class="text-[11px] font-bold text-text-secondary capitalize truncate max-w-[50px]">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div v-else class="h-44 flex items-center justify-center text-caption text-text-secondary italic">
          No hay suficiente histórico de ventas para graficar en este período
        </div>
      </div>

      <!-- 2. DISTRIBUCIÓN DE ESTADO DE ÓRDENES -->
      <div class="p-6 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-5 flex flex-col justify-between">
        <div class="pb-3 border-b border-divider">
          <h3 class="text-title font-bold text-text-primary flex items-center gap-2">
            <ChartPieIcon class="w-5 h-5 text-accent" />
            Flujo de Órdenes
          </h3>
          <p class="text-caption text-text-secondary">Desglose porcentual según el estado del pedido</p>
        </div>

        <div class="space-y-4">
          <!-- Pendientes -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-caption font-bold">
              <span class="text-warning flex items-center gap-1.5">
                <ClockIcon class="w-4 h-4" /> En Revisión
              </span>
              <span class="text-text-primary font-mono">{{ filteredData?.pendingCount ?? 0 }} ({{ filteredData?.totalOrders ? Math.round((filteredData.pendingCount / filteredData.totalOrders) * 100) : 0 }}%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-warning/20 overflow-hidden">
              <div
                class="h-full bg-warning rounded-full transition-all duration-500 shadow-2xs"
                :style="{ width: `${filteredData?.totalOrders ? ((filteredData.pendingCount / filteredData.totalOrders) * 100) : 0}%` }"
              />
            </div>
          </div>

          <!-- Aprobadas -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-caption font-bold">
              <span class="text-success flex items-center gap-1.5">
                <CheckCircleIcon class="w-4 h-4" /> Aprobadas
              </span>
              <span class="text-text-primary font-mono">{{ filteredData?.approvedCount ?? 0 }} ({{ filteredData?.totalOrders ? Math.round((filteredData.approvedCount / filteredData.totalOrders) * 100) : 0 }}%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-mint overflow-hidden">
              <div
                class="h-full bg-success rounded-full transition-all duration-500 shadow-2xs"
                :style="{ width: `${filteredData?.totalOrders ? ((filteredData.approvedCount / filteredData.totalOrders) * 100) : 0}%` }"
              />
            </div>
          </div>

          <!-- Despachadas -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-caption font-bold">
              <span class="text-accent flex items-center gap-1.5">
                <TruckIcon class="w-4 h-4" /> Despachadas
              </span>
              <span class="text-text-primary font-mono">{{ filteredData?.dispatchedCount ?? 0 }} ({{ filteredData?.totalOrders ? Math.round((filteredData.dispatchedCount / filteredData.totalOrders) * 100) : 0 }}%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-accent-50 overflow-hidden">
              <div
                class="h-full bg-accent rounded-full transition-all duration-500 shadow-2xs"
                :style="{ width: `${filteredData?.totalOrders ? ((filteredData.dispatchedCount / filteredData.totalOrders) * 100) : 0}%` }"
              />
            </div>
          </div>

          <!-- Rechazadas -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-caption font-bold">
              <span class="text-error flex items-center gap-1.5">
                <XCircleIcon class="w-4 h-4" /> Rechazadas
              </span>
              <span class="text-text-primary font-mono">{{ filteredData?.rejectedCount ?? 0 }} ({{ filteredData?.totalOrders ? Math.round((filteredData.rejectedCount / filteredData.totalOrders) * 100) : 0 }}%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-error/20 overflow-hidden">
              <div
                class="h-full bg-error rounded-full transition-all duration-500 shadow-2xs"
                :style="{ width: `${filteredData?.totalOrders ? ((filteredData.rejectedCount / filteredData.totalOrders) * 100) : 0}%` }"
              />
            </div>
          </div>
        </div>

        <RouterLink
          to="/admin/ordenes"
          class="w-full h-11 rounded-pill bg-accent text-white font-bold text-caption flex items-center justify-center gap-2 hover:bg-accent-500 transition-colors shadow-sm active:scale-95"
        >
          <span>Gestión Completa de Pedidos</span>
          <ArrowRightIcon class="w-4 h-4" />
        </RouterLink>
      </div>
    </div>

    <!-- LEADERBOARD TOP PRODUCTOS FAVORITOS & ACTIVIDAD RECIENTE -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- LEADERBOARD PRODUCTOS POPULARES -->
      <div class="p-6 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-divider">
          <h3 class="text-title font-bold text-text-primary flex items-center gap-2">
            <TrophyIcon class="w-5 h-5 text-accent" />
            Top Prendas Favoritas
          </h3>
          <span class="text-caption text-text-secondary font-medium">Por unidades vendidas</span>
        </div>

        <div v-if="filteredData?.topProducts && filteredData.topProducts.length > 0" class="space-y-3">
          <div
            v-for="(prod, idx) in filteredData.topProducts"
            :key="prod.name"
            class="p-3.5 rounded-2xl bg-background border border-divider flex items-center justify-between gap-3 shadow-2xs hover:border-accent/40 transition-all"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="w-8 h-8 rounded-full bg-gradient-to-br font-extrabold text-caption flex items-center justify-center shrink-0 shadow-sm"
                :class="rankColors[idx] || rankColors[4]"
              >
                #{{ idx + 1 }}
              </span>

              <div class="min-w-0">
                <h4 class="font-bold text-text-primary text-caption truncate">{{ prod.name }}</h4>
                <span class="text-[11px] text-text-secondary block font-medium">${{ prod.total.toFixed(2) }} USD acumulados</span>
              </div>
            </div>

            <span class="px-3 py-1 rounded-full bg-mint text-success font-extrabold text-caption shrink-0">
              {{ prod.quantity }} uds
            </span>
          </div>
        </div>

        <div v-else class="p-8 text-center text-caption text-text-secondary italic">
          Aún no hay suficientes ventas registradas en este período para calcular el Top Productos
        </div>
      </div>

      <!-- ÚLTIMAS ÓRDENES REGISTRADAS EN LA PLATAFORMA -->
      <div class="p-6 rounded-3xl bg-surface border border-divider shadow-elevation2 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-divider">
          <h3 class="text-title font-bold text-text-primary flex items-center gap-2">
            <ClockIcon class="w-5 h-5 text-accent" />
            Feed de Últimas Órdenes
          </h3>
          <RouterLink to="/admin/ordenes" class="text-caption font-bold text-accent hover:underline flex items-center gap-1">
            <span>Ver todas</span>
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </RouterLink>
        </div>

        <div v-if="filteredData?.recentOrders && filteredData.recentOrders.length > 0" class="space-y-3">
          <div
            v-for="ord in filteredData.recentOrders"
            :key="ord.id"
            class="p-3.5 rounded-2xl bg-background border border-divider flex items-center justify-between gap-3 shadow-2xs hover:border-accent/40 transition-all"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono font-extrabold text-accent text-caption">{{ ord.order_number }}</span>
                <span class="text-[11px] text-text-secondary truncate">• {{ ord.ambassador_name }}</span>
              </div>
              <p class="text-caption font-bold text-text-primary truncate mt-0.5">Cliente: {{ ord.client_name }}</p>
            </div>

            <div class="text-right shrink-0">
              <span class="font-black text-text-primary text-caption block font-mono">${{ Number(ord.total_amount).toFixed(2) }}</span>
              <span
                class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5"
                :class="{
                  'bg-warning/15 text-warning': ord.status === 'pending',
                  'bg-mint text-success': ord.status === 'approved',
                  'bg-accent-50 text-accent': ord.status === 'dispatched',
                  'bg-error/15 text-error': ord.status === 'rejected'
                }"
              >
                {{ ord.status }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-caption text-text-secondary italic">
          No hay órdenes recientes registradas en este período
        </div>
      </div>
    </div>

    <!-- MÓDULOS DE ADMINISTRACIÓN - GRID TARJETAS ESTILO GLASS EN TONOS MARCA -->
    <div class="space-y-4 pt-4">
      <h3 class="text-title font-bold text-text-primary flex items-center gap-2">
        <Cog6ToothIcon class="w-5 h-5 text-accent" />
        Módulos Administrativos de la Plataforma
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="nav in adminNavItems"
          :key="nav.path"
          :to="nav.path"
          class="p-5 rounded-2xl bg-surface border border-divider shadow-elevation1 hover:shadow-elevation3 hover:-translate-y-1 transition-all duration-300 space-y-3 group"
        >
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-2xl bg-blush text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300 shadow-2xs group-hover:scale-110 shrink-0">
              <component :is="nav.icon" class="w-5 h-5" />
            </div>
            <span class="px-2.5 py-1 rounded-full bg-background border border-divider text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
              {{ nav.badge }}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-small text-text-primary group-hover:text-accent transition-colors leading-snug">
              {{ nav.label }}
            </h4>
            <p class="text-[11px] text-text-secondary mt-0.5">Acceder al panel de administración</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
