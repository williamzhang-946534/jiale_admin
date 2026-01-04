import { get, post, put, patch, del } from '@/utils/request'
import type { Service, ServiceDetail, ServiceListParams, PaginationResponse } from '@/types/api'

/**
 * 获取服务列表
 */
export const getServices = (params?: ServiceListParams) => {
  return get<PaginationResponse<Service>>('/services', params)
}

/**
 * 获取服务详情
 */
export const getServiceDetail = (id: string) => {
  return get<ServiceDetail>(`/services/${id}/detail`)
}

/**
 * 新增服务
 */
export const createService = (data: Omit<Service, 'id' | 'createTime' | 'updateTime'>) => {
  return post<Service>('/services', data)
}

/**
 * 更新服务
 */
export const updateService = (id: string, data: Partial<Service>) => {
  return put<Service>(`/services/${id}`, data)
}

/**
 * 上下架服务
 */
export const updateServiceStatus = (id: string, status: 'active' | 'inactive') => {
  return patch(`/services/${id}/status`, { status })
}

/**
 * 删除服务
 */
export const deleteService = (id: string) => {
  return del(`/services/${id}`)
}
