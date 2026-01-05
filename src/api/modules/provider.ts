import { get, post, patch } from '@/utils/request'
import type { Provider, ProviderDetail, ProviderListParams, ProviderAuditParams, PaginationResponse } from '@/types/api'

/**
 * 获取服务者列表
 */
export const getProviders = (params?: ProviderListParams) => {
  return get<PaginationResponse<Provider>>('/providers', params)
}

/**
 * 获取服务者详情
 */
export const getProviderDetail = (id: string) => {
  return get<ProviderDetail>(`/providers/${id}/detail`)
}

/**
 * 更新服务者信息
 */
export const updateProvider = (id: string, data: Partial<ProviderDetail>) => {
  return post<ProviderDetail>(`/providers/${id}`, data)
}

/**
 * 审核服务者
 */
export const auditProvider = (id: string, params: ProviderAuditParams) => {
  return post(`/providers/${id}/audit`, params)
}

/**
 * 封禁/解封服务者
 */
export const banProvider = (id: string, isBanned: boolean) => {
  return patch(`/providers/${id}/account-status`, { isBanned })
}
