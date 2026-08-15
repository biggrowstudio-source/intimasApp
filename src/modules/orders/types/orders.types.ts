export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'dispatched'

export interface OrderItem {
  id?: string
  orderId?: string
  productId: string | null
  productName: string
  productSku?: string | null
  color?: string | null
  size?: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  orderNumber: string
  ambassadorId: string
  ambassadorName: string
  ambassadorCode: string | null
  clientName: string
  clientPhone: string
  clientEmail: string | null
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingZip: string | null
  shippingCountry: string
  status: OrderStatus
  rejectionReason: string | null
  notes?: string | null
  totalAmount: number
  commissionRate: number
  commissionAmount: number
  commissionPaid: boolean
  commissionPaidAt: string | null
  createdAt: string
  updatedAt: string
  items?: OrderItem[]
}

export interface CreateOrderPayload {
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingZip?: string | null
  shippingCountry: string
  notes?: string | null
  items: {
    productId: string | null
    productName: string
    productSku?: string | null
    color?: string | null
    size?: string | null
    quantity: number
    unitPrice: number
  }[]
}

export interface CommissionStats {
  totalSales: number
  retainedCommission: number
  paidCommission: number
  approvedOrdersCount: number
  pendingOrdersCount: number
  dispatchedOrdersCount: number
  commissionRate: number
}
