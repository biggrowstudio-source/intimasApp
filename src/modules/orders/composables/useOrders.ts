import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { ordersService } from '../services/orders.service'
import type { CreateOrderPayload } from '../types/orders.types'

export function useOrders(ambassadorIdRef?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['orders', ambassadorIdRef?.value],
    queryFn: () => ordersService.listOrders(ambassadorIdRef?.value),
    refetchInterval: 15000,
  })
}

export function useCommissionStats(ambassadorIdRef?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['commission-stats', ambassadorIdRef?.value],
    queryFn: () => ordersService.getAmbassadorCommissionStats(ambassadorIdRef?.value),
    refetchInterval: 15000,
  })
}

export function useCommissionRate() {
  return useQuery({
    queryKey: ['commission-rate'],
    queryFn: () => ordersService.getCommissionRate(),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useApproveOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersService.approveOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useRejectOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      ordersService.rejectOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useDispatchOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersService.dispatchOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useSetOrderToPending() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersService.setToPending(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function usePayCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersService.payCommission(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useRevertCommissionPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersService.revertCommissionPayment(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useUpdateCommissionRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rate: number) => ordersService.updateCommissionRate(rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rate'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: CreateOrderPayload }) =>
      ordersService.updateOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersService.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] })
    },
  })
}
