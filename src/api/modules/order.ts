import { get, post } from '@/utils/request'
import type { Order, OrderListParams, OrderAssignParams, OrderRefundParams, PaginationResponse } from '@/types/api'

/**
 * 获取订单列表
 */
export const getOrders = (params?: OrderListParams) => {
  return get<PaginationResponse<Order>>('/orders', params)
}

/**
 * 获取订单详情
 */
export const getOrderDetail = (id: string) => {
  return get<Order>(`/orders/${id}`)
}

/**
 * 指派订单
 */
export const assignOrder = (id: string, params: OrderAssignParams) => {
  return post(`/orders/${id}/assign`, params)
}

/**
 * 强制退款
 */
export const refundOrder = (id: string, params: OrderRefundParams) => {
  return post(`/orders/${id}/refund`, params)
}
