<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ShoppingCartIcon,
  UserIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth.store'
import { useUiStore } from '@stores/ui.store'
import { libraryService } from '@modules/library/services/library.service'
import type { Order } from '../types/orders.types'
import { useCreateOrder, useUpdateOrder } from '../composables/useOrders'
import ProductSearchSelect from './ProductSearchSelect.vue'

const props = defineProps<{
  initialProductId?: string
  orderToEdit?: Order | null
}>()

const emit = defineEmits<{
  close: []
  created: []
  updated: []
}>()

const auth = useAuthStore()
const ui = useUiStore()
const createOrderMutation = useCreateOrder()
const updateOrderMutation = useUpdateOrder()

const currentStep = ref(1) // 1: Cliente & Envío, 2: Productos, 3: Confirmación
const productsList = ref<LibraryDocument[]>([])
const isLoadingProducts = ref(true)

const ambassadorName = computed(() => {
  if (auth.profile?.first_name || auth.profile?.last_name) {
    const full = `${auth.profile.first_name ?? ''} ${auth.profile.last_name ?? ''}`.trim()
    if (full) return full
  }
  return auth.user?.email || 'Embajadora Intimas'
})

const ambassadorCode = computed(() => {
  if (auth.profile?.ambassador_code) {
    return auth.profile.ambassador_code
  }
  return `EMB-${(auth.user?.id || '1864ED').substring(0, 6).toUpperCase()}`
})

const ambassadorInitials = computed(() => {
  if (auth.profile?.first_name && auth.profile?.last_name) {
    return `${auth.profile.first_name[0]}${auth.profile.last_name[0]}`.toUpperCase()
  }
  if (ambassadorName.value && ambassadorName.value !== 'Embajadora Intimas') {
    const parts = ambassadorName.value.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return ambassadorName.value.substring(0, 2).toUpperCase()
  }
  return 'EM'
})

const form = reactive({
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  shippingStreet: '',
  shippingCity: '',
  shippingState: '',
  shippingZip: '',
  shippingCountry: 'Colombia',
  notes: '',
  items: [
    {
      productId: '',
      productName: '',
      productSku: '',
      color: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      availableColors: [] as string[],
      availableSizes: [] as string[],
    },
  ],
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

function parseOptions(rawString: string | null | undefined): string[] {
  if (!rawString || !rawString.trim()) return []
  const tokens = rawString.split(/[\/,|\n]/).map((s) => s.trim()).filter(Boolean)
  const finalTokens: string[] = []
  for (const tok of tokens) {
    if (tok.includes(' ') && !tok.toLowerCase().includes('color') && !tok.toLowerCase().includes('talla')) {
      const sub = tok.split(/\s+/).map((s) => s.trim()).filter(Boolean)
      finalTokens.push(...sub)
    } else {
      finalTokens.push(tok)
    }
  }
  return Array.from(new Set(finalTokens))
}

onMounted(async () => {
  if (props.orderToEdit) {
    const o = props.orderToEdit
    form.clientName = o.clientName || ''
    form.clientPhone = o.clientPhone || ''
    form.clientEmail = o.clientEmail || ''
    form.shippingStreet = o.shippingStreet || ''
    form.shippingCity = o.shippingCity || ''
    form.shippingState = o.shippingState || ''
    form.shippingZip = o.shippingZip || ''
    form.shippingCountry = o.shippingCountry || 'Colombia'
    form.notes = o.notes || ''
    if (o.items && o.items.length > 0) {
      form.items = o.items.map((it) => ({
        productId: it.productId || '',
        productName: it.productName || '',
        productSku: it.productSku || '',
        color: it.color || '',
        size: it.size || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        availableColors: it.color ? [it.color] : [],
        availableSizes: it.size ? [it.size] : [],
      }))
    }
  }

  try {
    const cats = await libraryService.listCategories()
    const productCategory = cats.find((c) => c.slug === 'productos')
    const categoryIds = productCategory ? [productCategory.id] : undefined
    let docs = await libraryService.listDocuments({ categoryIds })
    if (docs.length === 0) {
      docs = await libraryService.listDocuments()
    }

    // Filtrar estrictamente SOLO productos (excluyendo catálogos o enlaces)
    const onlyProducts = docs.filter((d) => {
      const isCat = d.categorySlug === 'catalogos' || !!d.link
      const isProd = d.categorySlug === 'productos' || !!d.sku || d.price != null
      return isProd && !isCat
    })

    productsList.value = onlyProducts

    if (props.initialProductId && !props.orderToEdit) {
      const prod = onlyProducts.find((p) => p.id === props.initialProductId)
      if (prod) {
        onProductSelect(0, prod.id)
      }
    }
  } catch (e) {
    console.error('Error cargando productos:', e)
  } finally {
    isLoadingProducts.value = false
  }
})

function addItem() {
  form.items.push({
    productId: '',
    productName: '',
    productSku: '',
    color: '',
    size: '',
    quantity: 1,
    unitPrice: 0,
    availableColors: [],
    availableSizes: [],
  })
}

function removeItem(index: number) {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  }
}

function onProductSelect(index: number, selectedId: string) {
  if (!selectedId) {
    form.items[index].productId = ''
    form.items[index].productName = ''
    form.items[index].productSku = ''
    form.items[index].color = ''
    form.items[index].size = ''
    form.items[index].unitPrice = 0
    form.items[index].availableColors = []
    form.items[index].availableSizes = []
    return
  }

  const prod = productsList.value.find((p) => p.id === selectedId)
  if (prod) {
    const colors = parseOptions(prod.color)
    const sizes = parseOptions(prod.size)

    form.items[index].productId = prod.id
    form.items[index].productName = prod.title
    form.items[index].productSku = prod.sku || ''
    form.items[index].availableColors = colors
    form.items[index].color = colors[0] || prod.color || ''
    form.items[index].availableSizes = sizes
    form.items[index].size = sizes[0] || prod.size || ''
    form.items[index].unitPrice = prod.price || 0
  }
}

const grandTotal = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
})

function validateStep1(): boolean {
  errors.value = {}

  if (!form.clientName.trim()) {
    errors.value.clientName = 'El nombre del cliente es obligatorio'
  } else if (form.clientName.trim().length < 3) {
    errors.value.clientName = 'El nombre debe tener al menos 3 caracteres'
  }

  const cleanPhone = form.clientPhone.replace(/\D/g, '')
  if (!form.clientPhone.trim()) {
    errors.value.clientPhone = 'El teléfono (WhatsApp) es obligatorio'
  } else if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    errors.value.clientPhone = 'Ingresa un teléfono válido de 7 a 15 dígitos'
  }

  if (!form.shippingStreet.trim()) {
    errors.value.shippingStreet = 'La calle/dirección es obligatoria'
  } else if (form.shippingStreet.trim().length < 5) {
    errors.value.shippingStreet = 'Ingresa una dirección válida (mínimo 5 caracteres)'
  }

  if (!form.shippingCity.trim()) {
    errors.value.shippingCity = 'La ciudad es obligatoria'
  }

  if (!form.shippingState.trim()) {
    errors.value.shippingState = 'El departamento es obligatorio'
  }

  return Object.keys(errors.value).length === 0
}

function validateStep2(): boolean {
  errors.value = {}
  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i]
    if (!item.productName.trim()) {
      errors.value[`item_${i}`] = 'Debes seleccionar o escribir un producto'
      return false
    }
    if (item.quantity <= 0) {
      errors.value[`item_${i}`] = 'La cantidad debe ser mayor a 0'
      return false
    }
  }
  return true
}

function nextStep() {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return
    currentStep.value = 3
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function close() {
  emit('close')
}

async function submit() {
  if (!validateStep1() || !validateStep2()) return

  isSubmitting.value = true
  try {
    const payloadData = {
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      clientEmail: form.clientEmail.trim() || null,
      shippingStreet: form.shippingStreet.trim(),
      shippingCity: form.shippingCity.trim(),
      shippingState: form.shippingState.trim(),
      shippingZip: form.shippingZip.trim() || null,
      shippingCountry: form.shippingCountry.trim() || 'Colombia',
      notes: form.notes.trim() || null,
      items: form.items.map((it) => ({
        productId: it.productId || null,
        productName: it.productName.trim(),
        productSku: it.productSku.trim() || null,
        color: it.color.trim() || null,
        size: it.size.trim() || null,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
    }

    if (props.orderToEdit) {
      await updateOrderMutation.mutateAsync({
        orderId: props.orderToEdit.id,
        payload: payloadData,
      })
      ui.pushToast({ title: 'Pedido actualizado', description: 'Los cambios fueron guardados exitosamente', variant: 'success' })
      emit('updated')
    } else {
      await createOrderMutation.mutateAsync(payloadData)
      ui.pushToast({ title: 'Pedido registrado', description: 'El pedido fue enviado exitosamente al administrador', variant: 'success' })
      emit('created')
    }

    close()
  } catch (e) {
    ui.pushToast({ title: 'Error al procesar pedido', description: (e as Error).message, variant: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="true"
    size="lg"
    @update:model-value="(v: boolean) => !v && close()"
  >
    <div class="space-y-4 sm:space-y-5">
      <!-- Indicador de Pasos (Responsive Stepper) -->
      <div class="w-full flex items-center justify-between border-b border-divider pb-3.5 mb-1">
        <!-- Paso 1 -->
        <button
          type="button"
          class="flex items-center gap-1.5 sm:gap-2 text-caption sm:text-small font-bold transition-colors shrink-0"
          :class="currentStep === 1 ? 'text-accent' : currentStep > 1 ? 'text-success' : 'text-text-secondary'"
          @click="currentStep > 1 && (currentStep = 1)"
        >
          <span
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-caption font-extrabold shrink-0"
            :class="
              currentStep === 1
                ? 'bg-accent text-white shadow-sm'
                : currentStep > 1
                ? 'bg-mint text-success'
                : 'bg-background border border-divider text-text-secondary'
            "
          >
            <CheckIcon v-if="currentStep > 1" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span v-else>1</span>
          </span>
          <span>Cliente</span>
        </button>

        <div class="flex-1 h-0.5 mx-1.5 sm:mx-3 bg-divider min-w-[8px]" />

        <!-- Paso 2 -->
        <button
          type="button"
          class="flex items-center gap-1.5 sm:gap-2 text-caption sm:text-small font-bold transition-colors shrink-0"
          :class="currentStep === 2 ? 'text-accent' : currentStep > 2 ? 'text-success' : 'text-text-secondary'"
          @click="currentStep > 2 && (currentStep = 2)"
        >
          <span
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-caption font-extrabold shrink-0"
            :class="
              currentStep === 2
                ? 'bg-accent text-white shadow-sm'
                : currentStep > 2
                ? 'bg-mint text-success'
                : 'bg-background border border-divider text-text-secondary'
            "
          >
            <CheckIcon v-if="currentStep > 2" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span v-else>2</span>
          </span>
          <span>Productos</span>
        </button>

        <div class="flex-1 h-0.5 mx-1.5 sm:mx-3 bg-divider min-w-[8px]" />

        <!-- Paso 3 -->
        <button
          type="button"
          class="flex items-center gap-1.5 sm:gap-2 text-caption sm:text-small font-bold transition-colors shrink-0"
          :class="currentStep === 3 ? 'text-accent' : 'text-text-secondary'"
        >
          <span
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-caption font-extrabold shrink-0"
            :class="currentStep === 3 ? 'bg-accent text-white shadow-sm' : 'bg-background border border-divider text-text-secondary'"
          >
            3
          </span>
          <span>Resumen</span>
        </button>
      </div>

      <!-- PASO 1: DATOS DEL CLIENTE Y DIRECCIÓN DE ENVÍO -->
      <div v-if="currentStep === 1" class="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
        <!-- EMBAJADORA DE VENTAS -->
        <div class="p-3 sm:p-3.5 rounded-2xl bg-surface border border-divider flex items-center gap-3 shadow-sm">
          <div class="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-accent-50 overflow-hidden border-2 border-accent/30 flex items-center justify-center text-accent font-extrabold text-small">
            <img
              v-if="auth.profile?.avatar_url"
              :src="auth.profile.avatar_url"
              :alt="ambassadorName"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ ambassadorInitials }}</span>
          </div>

          <div class="flex-1 min-w-0 space-y-0.5">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Embajadora de Ventas</span>
            <h4 class="text-small font-bold text-text-primary truncate leading-tight">{{ ambassadorName }}</h4>
            <p class="text-caption font-mono text-accent">Código: <strong class="font-bold">{{ ambassadorCode }}</strong></p>
          </div>
        </div>

        <!-- DATOS DEL CLIENTE -->
        <div class="space-y-3">
          <h3 class="text-small font-bold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
            <UserIcon class="w-4 h-4 text-accent" />
            DATOS DEL CLIENTE
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput
              v-model="form.clientName"
              label="Nombre del Cliente"
              placeholder="Nombre completo"
              maxlength="70"
              :error="errors.clientName"
              required
            />
            <AppInput
              v-model="form.clientPhone"
              type="tel"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="15"
              label="Teléfono / WhatsApp"
              placeholder="3001234567"
              :error="errors.clientPhone"
              required
            />
          </div>
          <AppInput
            v-model="form.clientEmail"
            type="email"
            inputmode="email"
            maxlength="100"
            label="Correo electrónico (opcional)"
            placeholder="cliente@ejemplo.com"
          />
        </div>

        <!-- DIRECCIÓN DE ENVÍO -->
        <div class="space-y-3">
          <h3 class="text-small font-bold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
            <MapPinIcon class="w-4 h-4 text-accent" />
            DIRECCIÓN DE ENVÍO
          </h3>
          <AppInput
            v-model="form.shippingStreet"
            label="Calle y número"
            placeholder="Calle 100 #15-20 Apt 301"
            maxlength="120"
            :error="errors.shippingStreet"
            required
          />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput
              v-model="form.shippingCity"
              label="Ciudad"
              placeholder="Bogotá"
              maxlength="50"
              :error="errors.shippingCity"
              required
            />
            <AppInput
              v-model="form.shippingState"
              label="Departamento / Estado"
              placeholder="Cundinamarca"
              maxlength="50"
              :error="errors.shippingState"
              required
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput
              v-model="form.shippingZip"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="10"
              label="Código Postal (opcional)"
              placeholder="110111"
            />
            <AppInput
              v-model="form.shippingCountry"
              label="País"
              placeholder="Colombia"
              maxlength="50"
              required
            />
          </div>

          <AppTextarea
            v-model="form.notes"
            label="Notas de la orden / Indicaciones especiales (Opcional)"
            placeholder="Ej: Entregar en horario de mañana, empacar para regalo, observaciones del cliente..."
            :rows="2"
          />
        </div>
      </div>

      <!-- PASO 2: SELECCIÓN DE PRODUCTOS -->
      <div v-else-if="currentStep === 2" class="space-y-4 animate-in fade-in duration-200">
        <div class="flex items-center justify-between">
          <h3 class="text-small font-bold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
            <ShoppingCartIcon class="w-4 h-4 text-accent" />
            PRODUCTOS A PEDIR
          </h3>
          <button
            type="button"
            class="text-caption font-semibold text-accent hover:underline flex items-center gap-1"
            @click="addItem"
          >
            <PlusIcon class="w-4 h-4" />
            Agregar otro producto
          </button>
        </div>

        <div v-for="(item, idx) in form.items" :key="idx" class="p-3.5 rounded-2xl bg-surface border border-divider space-y-3 shadow-elevation1">
          <div class="flex items-center justify-between">
            <span class="text-caption font-bold text-text-secondary">Producto #{{ idx + 1 }}</span>
            <button
              v-if="form.items.length > 1"
              type="button"
              class="text-caption text-error hover:underline flex items-center gap-1"
              @click="removeItem(idx)"
            >
              <TrashIcon class="w-3.5 h-3.5" />
              Quitar
            </button>
          </div>

          <!-- Selector de producto con barra de búsqueda -->
          <ProductSearchSelect
            v-model="item.productId"
            :products="productsList"
            placeholder="Buscar por nombre o SKU en biblioteca..."
            @select="(p) => onProductSelect(idx, p ? p.id : '')"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppInput
              v-model="item.productName"
              label="Nombre del producto"
              placeholder="Nombre del producto"
              maxlength="100"
              :disabled="!!item.productId"
              :hint="item.productId ? 'Bloqueado (Nombre oficial)' : ''"
              required
            />
            <AppInput
              v-model="item.productSku"
              label="SKU"
              placeholder="INT-001"
              maxlength="30"
              :disabled="!!item.productId"
              :hint="item.productId ? 'Bloqueado (SKU oficial)' : ''"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Selector de Color -->
            <div class="space-y-1">
              <label class="block text-caption font-medium text-text-primary">Color</label>
              <select
                v-if="item.availableColors && item.availableColors.length > 0"
                v-model="item.color"
                class="w-full h-10 px-3 rounded-lg border border-divider bg-background text-small focus:outline-none focus:border-accent font-medium text-text-primary"
              >
                <option v-for="c in item.availableColors" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
              <AppInput
                v-else
                v-model="item.color"
                placeholder="Rojo / Negro"
                maxlength="40"
              />
            </div>

            <!-- Selector de Talla -->
            <div class="space-y-1">
              <label class="block text-caption font-medium text-text-primary">Talla</label>
              <select
                v-if="item.availableSizes && item.availableSizes.length > 0"
                v-model="item.size"
                class="w-full h-10 px-3 rounded-lg border border-divider bg-background text-small focus:outline-none focus:border-accent font-medium text-text-primary"
              >
                <option v-for="s in item.availableSizes" :key="s" :value="s">
                  {{ s }}
                </option>
              </select>
              <AppInput
                v-else
                v-model="item.size"
                placeholder="M / L"
                maxlength="30"
              />
            </div>

            <AppInput
              v-model="item.quantity"
              type="number"
              inputmode="numeric"
              min="1"
              max="999"
              maxlength="3"
              label="Cantidad"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3 bg-background p-2.5 rounded-lg">
            <div>
              <span class="text-caption text-text-secondary block">Precio Unitario ($):</span>
              <input
                v-model.number="item.unitPrice"
                type="number"
                inputmode="decimal"
                step="0.01"
                class="w-full bg-transparent font-bold text-text-primary focus:outline-none"
              />
            </div>
            <div class="text-right">
              <span class="text-caption text-text-secondary block">Subtotal:</span>
              <span class="text-small font-bold text-accent">${{ (item.quantity * item.unitPrice).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Total parcial -->
        <div class="p-4 rounded-2xl bg-accent-50/50 border border-accent/30 flex items-center justify-between">
          <span class="text-small font-bold text-text-primary">TOTAL DEL PEDIDO:</span>
          <span class="text-title font-extrabold text-accent">${{ grandTotal.toFixed(2) }} USD</span>
        </div>
      </div>

      <!-- PASO 3: RESUMEN Y CONFIRMACIÓN -->
      <div v-else-if="currentStep === 3" class="space-y-4 animate-in fade-in duration-200">
        <div class="p-4 rounded-2xl bg-surface border border-divider space-y-4 shadow-sm">
          <h3 class="text-small font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 border-b border-divider pb-2">
            <CheckIcon class="w-4 h-4 text-success" />
            RESUMEN COMPLETO DEL PEDIDO
          </h3>

          <!-- Embajadora y Cliente -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-small">
            <div class="p-3 rounded-xl bg-background border border-divider space-y-1">
              <span class="text-caption font-bold text-text-secondary uppercase">Cliente</span>
              <p class="font-bold text-text-primary">{{ form.clientName }}</p>
              <p class="text-caption text-text-secondary">Ph: {{ form.clientPhone }}</p>
              <p v-if="form.clientEmail" class="text-caption text-text-secondary">{{ form.clientEmail }}</p>
            </div>

            <div class="p-3 rounded-xl bg-background border border-divider space-y-1">
              <span class="text-caption font-bold text-text-secondary uppercase">Dirección de Envío</span>
              <p class="font-bold text-text-primary">{{ form.shippingStreet }}</p>
              <p class="text-caption text-text-secondary">{{ form.shippingCity }}, {{ form.shippingState }}</p>
              <p class="text-caption text-text-secondary">{{ form.shippingCountry }} {{ form.shippingZip ? `(${form.shippingZip})` : '' }}</p>
            </div>

            <div v-if="form.notes" class="col-span-1 sm:col-span-2 p-3 rounded-xl bg-accent-50/60 border border-accent/20 space-y-1">
              <span class="text-caption font-bold text-accent uppercase flex items-center gap-1">
                <ChatBubbleBottomCenterTextIcon class="w-3.5 h-3.5" />
                Notas e Indicaciones Especiales
              </span>
              <p class="text-small text-text-primary whitespace-pre-wrap">{{ form.notes }}</p>
            </div>
          </div>

          <!-- Items Resumen -->
          <div class="space-y-2">
            <span class="text-caption font-bold text-text-secondary uppercase block">Productos Incluidos ({{ form.items.length }})</span>
            <div class="divide-y divide-divider rounded-xl border border-divider overflow-hidden bg-background">
              <div
                v-for="(it, i) in form.items"
                :key="i"
                class="p-3 flex items-center justify-between text-caption gap-2"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-text-primary truncate">{{ it.productName }}</p>
                  <p class="text-text-secondary text-[11px]">
                    <span v-if="it.productSku">SKU: {{ it.productSku }} • </span>
                    <span v-if="it.color">Color: {{ it.color }} • </span>
                    <span v-if="it.size">Talla: {{ it.size }}</span>
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <span class="font-bold text-text-primary">{{ it.quantity }} x ${{ it.unitPrice.toFixed(2) }}</span>
                  <span class="block font-bold text-accent">${{ (it.quantity * it.unitPrice).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Final -->
          <div class="p-4 rounded-xl bg-mint/40 border border-mint flex items-center justify-between">
            <div>
              <span class="text-caption font-bold text-success uppercase block">Total a Pagar / Procesar</span>
              <span class="text-caption text-text-secondary">Comisión asignada automáticamente</span>
            </div>
            <span class="text-h2 font-editorial font-extrabold text-accent">${{ grandTotal.toFixed(2) }} USD</span>
          </div>
        </div>
      </div>
    </div>

    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-small sm:text-title font-bold text-text-primary truncate">
            {{ currentStep === 1 ? 'DATOS DEL CLIENTE' : currentStep === 2 ? 'SELECCIÓN DE PRODUCTOS' : 'RESUMEN DE LA ORDEN' }}
          </h2>
          <p class="text-[11px] sm:text-caption text-text-secondary">Paso {{ currentStep }} de 3 · Intimas by Lorena</p>
        </div>
        <button
          class="w-8 h-8 sm:w-9 sm:h-9 -mr-2 rounded-pill flex items-center justify-center text-text-secondary hover:bg-background shrink-0"
          aria-label="Cerrar"
          @click="close"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <AppButton
          v-if="currentStep === 1"
          variant="ghost"
          :disabled="isSubmitting"
          @click="close"
        >
          Cancelar
        </AppButton>

        <AppButton
          v-else
          variant="ghost"
          :disabled="isSubmitting"
          @click="prevStep"
        >
          <template #icon-left>
            <ArrowLeftIcon class="w-4 h-4" />
          </template>
          Volver
        </AppButton>

        <AppButton
          v-if="currentStep < 3"
          @click="nextStep"
        >
          <template #icon-right>
            <ArrowRightIcon class="w-4 h-4" />
          </template>
          Continuar
        </AppButton>

        <AppButton
          v-else
          :loading="isSubmitting"
          @click="submit"
        >
          <template #icon-left>
            <CheckIcon class="w-4 h-4" />
          </template>
          Enviar Pedido
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
