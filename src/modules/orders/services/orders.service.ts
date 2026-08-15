import { supabase } from '~supabase/client'
import type { CommissionStats, CreateOrderPayload, Order, OrderItem, OrderStatus } from '../types/orders.types'

export const ordersService = {
  async getCommissionRate(): Promise<number> {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'commission_rate')
        .maybeSingle()
      if (data?.value && typeof data.value === 'object' && 'rate' in data.value) {
        return Number((data.value as { rate: number }).rate) || 25
      }
    } catch {
      // Fallback
    }
    return 25
  },

  async updateCommissionRate(rate: number): Promise<number> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'commission_rate',
        value: { rate },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
    if (error) throw error
    return rate
  },

  async listOrders(ambassadorIdOnly?: string): Promise<Order[]> {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('No autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false })

    if (ambassadorIdOnly) {
      query = query.eq('ambassador_id', ambassadorIdOnly)
    } else if (!isAdmin) {
      query = query.eq('ambassador_id', userId)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      ambassadorId: row.ambassador_id,
      ambassadorName: row.ambassador_name,
      ambassadorCode: row.ambassador_code,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      shippingStreet: row.shipping_street,
      shippingCity: row.shipping_city,
      shippingState: row.shipping_state,
      shippingZip: row.shipping_zip,
      shippingCountry: row.shipping_country,
      status: row.status as OrderStatus,
      rejectionReason: row.rejection_reason,
      notes: row.notes,
      totalAmount: Number(row.total_amount),
      commissionRate: Number(row.commission_rate),
      commissionAmount: Number(row.commission_amount),
      commissionPaid: row.commission_paid,
      commissionPaidAt: row.commission_paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: (row.items ?? []).map((it: any) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productName: it.product_name,
        productSku: it.product_sku,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      })),
    }))
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data: user } = await supabase.auth.getUser()
    const userId = user.user?.id
    if (!userId) throw new Error('Usuario no autenticado')

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, ambassador_code')
      .eq('user_id', userId)
      .maybeSingle()

    const ambassadorName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Embajadora'
    const ambassadorCode = profile?.ambassador_code ?? `EMB-${userId.substring(0, 6).toUpperCase()}`

    const commissionRate = await this.getCommissionRate()

    // Calculate total amount
    const totalAmount = payload.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const commissionAmount = Number((totalAmount * (commissionRate / 100)).toFixed(2))

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

    // Insert order
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        ambassador_id: userId,
        ambassador_name: ambassadorName,
        ambassador_code: ambassadorCode,
        client_name: payload.clientName,
        client_phone: payload.clientPhone,
        client_email: payload.clientEmail ?? null,
        shipping_street: payload.shippingStreet,
        shipping_city: payload.shippingCity,
        shipping_state: payload.shippingState,
        shipping_zip: payload.shippingZip ?? null,
        shipping_country: payload.shippingCountry || 'Colombia',
        status: 'pending',
        notes: payload.notes ?? null,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const itemsToInsert = payload.items.map((it) => ({
      order_id: orderRow.id,
      product_id: it.productId,
      product_name: it.productName,
      product_sku: it.productSku ?? null,
      color: it.color ?? null,
      size: it.size ?? null,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      subtotal: it.quantity * it.unitPrice,
    }))

    const { data: itemsRows, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select()

    if (itemsError) throw itemsError

    // Enviar notificación a los administradores
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('user_id')
        .in('role', ['admin', 'super_admin'])
      
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((adm) => ({
          user_id: adm.user_id,
          type: 'system',
          title: `Nueva orden de ${ambassadorName}`,
          body: `Se ha registrado el pedido ${orderNumber} por $${totalAmount.toFixed(2)} USD.`,
          data: { link: '/admin/ordenes', orderId: orderRow.id },
        }))
        await supabase.from('notifications').insert(adminNotifs)
      }
    } catch (err) {
      console.error('Error al enviar notificaciones de nueva orden:', err)
    }

    return {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      ambassadorId: orderRow.ambassador_id,
      ambassadorName: orderRow.ambassador_name,
      ambassadorCode: orderRow.ambassador_code,
      clientName: orderRow.client_name,
      clientPhone: orderRow.client_phone,
      clientEmail: orderRow.client_email,
      shippingStreet: orderRow.shipping_street,
      shippingCity: orderRow.shipping_city,
      shippingState: orderRow.shipping_state,
      shippingZip: orderRow.shipping_zip,
      shippingCountry: orderRow.shipping_country,
      status: orderRow.status as OrderStatus,
      rejectionReason: orderRow.rejection_reason,
      notes: orderRow.notes,
      totalAmount: Number(orderRow.total_amount),
      commissionRate: Number(orderRow.commission_rate),
      commissionAmount: Number(orderRow.commission_amount),
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
      items: (itemsRows ?? []).map((it: any) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productName: it.product_name,
        productSku: it.product_sku,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      })),
    }
  },

  async approveOrder(orderId: string): Promise<void> {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('ambassador_id, order_number')
      .eq('id', orderId)
      .maybeSingle()
    if (fetchError) throw fetchError

    const { error } = await supabase
      .from('orders')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error

    if (order) {
      try {
        await supabase.from('notifications').insert({
          user_id: order.ambassador_id,
          type: 'system',
          title: `Pedido Aprobado ✓`,
          body: `Tu pedido ${order.order_number} ha sido aprobado.`,
          data: { orderId },
        })
      } catch (err) {
        console.error('Error al notificar aprobación de pedido:', err)
      }
    }
  },

  async rejectOrder(orderId: string, reason: string): Promise<void> {
    // Obtener la orden actual para acumular motivos anteriores y saber a quién notificar
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('rejection_reason, ambassador_id, order_number')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchError) throw fetchError

    const nowStr = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    const newReasonLine = `• [${nowStr}]: ${reason}`
    
    let finalReason = newReasonLine
    if (order && order.rejection_reason) {
      finalReason = `${order.rejection_reason}\n${newReasonLine}`
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'rejected', rejection_reason: finalReason, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error

    if (order) {
      try {
        await supabase.from('notifications').insert({
          user_id: order.ambassador_id,
          type: 'system',
          title: `Pedido Rechazado ✗`,
          body: `Tu pedido ${order.order_number} tiene observaciones: "${reason}"`,
          data: { orderId },
        })
      } catch (err) {
        console.error('Error al notificar rechazo de pedido:', err)
      }
    }
  },

  async dispatchOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'dispatched', updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error
  },

  async setToPending(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error
  },

  async getAmbassadorCommissionStats(ambassadorId?: string): Promise<CommissionStats> {
    const { data: user } = await supabase.auth.getUser()
    const targetUserId = ambassadorId || user.user?.id
    if (!targetUserId) {
      return {
        totalSales: 0,
        retainedCommission: 0,
        paidCommission: 0,
        approvedOrdersCount: 0,
        pendingOrdersCount: 0,
        dispatchedOrdersCount: 0,
        commissionRate: 25,
      }
    }

    const currentRate = await this.getCommissionRate()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total_amount, commission_amount, commission_paid')
      .eq('ambassador_id', targetUserId)

    if (error || !orders) {
      return {
        totalSales: 0,
        retainedCommission: 0,
        paidCommission: 0,
        approvedOrdersCount: 0,
        pendingOrdersCount: 0,
        dispatchedOrdersCount: 0,
        commissionRate: currentRate,
      }
    }

    let totalSales = 0
    let retainedCommission = 0
    let paidCommission = 0
    let approvedOrdersCount = 0
    let pendingOrdersCount = 0
    let dispatchedOrdersCount = 0

    for (const ord of orders) {
      if (ord.status === 'approved' || ord.status === 'dispatched') {
        const orderTotal = Number(ord.total_amount) || 0
        const orderComm = Number(ord.commission_amount) || (orderTotal * (currentRate / 100))
        totalSales += orderTotal
        
        if (ord.commission_paid) {
          paidCommission += orderComm
        } else {
          retainedCommission += orderComm
        }
        
        if (ord.status === 'approved') approvedOrdersCount++
        if (ord.status === 'dispatched') dispatchedOrdersCount++
      } else if (ord.status === 'pending') {
        pendingOrdersCount++
      }
    }

    return {
      totalSales,
      retainedCommission,
      paidCommission,
      approvedOrdersCount,
      pendingOrdersCount,
      dispatchedOrdersCount,
      commissionRate: currentRate,
    }
  },

  async updateOrder(orderId: string, payload: CreateOrderPayload): Promise<Order> {
    const commissionRate = await this.getCommissionRate()
    const totalAmount = payload.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const commissionAmount = Number((totalAmount * (commissionRate / 100)).toFixed(2))

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .update({
        client_name: payload.clientName,
        client_phone: payload.clientPhone,
        client_email: payload.clientEmail ?? null,
        shipping_street: payload.shippingStreet,
        shipping_city: payload.shippingCity,
        shipping_state: payload.shippingState,
        shipping_zip: payload.shippingZip ?? null,
        shipping_country: payload.shippingCountry || 'Colombia',
        notes: payload.notes ?? null,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending', // Regresa a pendiente al ser modificado
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single()

    if (orderError) throw orderError

    await supabase.from('order_items').delete().eq('order_id', orderId)

    const itemsToInsert = payload.items.map((it) => ({
      order_id: orderId,
      product_id: it.productId,
      product_name: it.productName,
      product_sku: it.productSku ?? null,
      color: it.color ?? null,
      size: it.size ?? null,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      subtotal: it.quantity * it.unitPrice,
    }))

    const { data: itemsRows, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select()

    if (itemsError) throw itemsError

    return {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      ambassadorId: orderRow.ambassador_id,
      ambassadorName: orderRow.ambassador_name,
      ambassadorCode: orderRow.ambassador_code,
      clientName: orderRow.client_name,
      clientPhone: orderRow.client_phone,
      clientEmail: orderRow.client_email,
      shippingStreet: orderRow.shipping_street,
      shippingCity: orderRow.shipping_city,
      shippingState: orderRow.shipping_state,
      shippingZip: orderRow.shipping_zip,
      shippingCountry: orderRow.shipping_country,
      status: orderRow.status as OrderStatus,
      rejectionReason: orderRow.rejection_reason,
      notes: orderRow.notes,
      totalAmount: Number(orderRow.total_amount),
      commissionRate: Number(orderRow.commission_rate),
      commissionAmount: Number(orderRow.commission_amount),
      commissionPaid: orderRow.commission_paid,
      commissionPaidAt: orderRow.commission_paid_at,
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
      items: (itemsRows ?? []).map((it: any) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productName: it.product_name,
        productSku: it.product_sku,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      })),
    }
  },

  async payCommission(orderId: string): Promise<void> {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('ambassador_id, order_number, commission_amount')
      .eq('id', orderId)
      .maybeSingle()
    if (fetchError) throw fetchError

    const { error } = await supabase
      .from('orders')
      .update({
        commission_paid: true,
        commission_paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    if (error) throw error

    if (order) {
      try {
        await supabase.from('notifications').insert({
          user_id: order.ambassador_id,
          type: 'recognition',
          title: `Comisión Pagada ✓`,
          body: `Se ha registrado el pago de tu comisión por $${Number(order.commission_amount).toFixed(2)} USD para la orden ${order.order_number}.`,
          data: { orderId },
        })
      } catch (err) {
        console.error('Error al enviar notificación de pago de comisión:', err)
      }
    }
  },

  async revertCommissionPayment(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        commission_paid: false,
        commission_paid_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    if (error) throw error
  },

  async deleteOrder(orderId: string): Promise<void> {
    await supabase.from('order_items').delete().eq('order_id', orderId)
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (error) throw error
  },
}
