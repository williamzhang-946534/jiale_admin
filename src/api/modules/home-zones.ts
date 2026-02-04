import { get, post, put, del, patch } from '@/utils/request'
import type { 
  NewcomerOffer, 
  FlashSaleSession, 
  FlashSaleProduct,
  EnterpriseCategory,
  EnterpriseInquiry,
  PremiumCategory,
  PremiumApplication
} from '@/types/api'

// ==================== 新人专区 ====================

// 新人专享服务管理
export const getNewcomerOffers = (params?: any) => {
  return get('/newcomer/offers', params)
}

export const createNewcomerOffer = (data: Partial<NewcomerOffer>) => {
  return post('/newcomer/offers', data)
}

export const updateNewcomerOffer = (id: string, data: Partial<NewcomerOffer>) => {
  return put(`/newcomer/offers/${id}`, data)
}

export const deleteNewcomerOffer = (id: string) => {
  return del(`/newcomer/offers/${id}`)
}

// ==================== 闪购秒杀 ====================

// 闪购场次管理
export const getFlashSaleSessions = (params?: any) => {
  return get('/flash-sale/sessions', params)
}

export const createFlashSaleSession = (data: Partial<FlashSaleSession>) => {
  return post('/flash-sale/sessions', data)
}

export const updateFlashSaleSession = (id: string, data: Partial<FlashSaleSession>) => {
  return put(`/flash-sale/sessions/${id}`, data)
}

export const deleteFlashSaleSession = (id: string) => {
  return del(`/flash-sale/sessions/${id}`)
}

// 闪购商品管理
export const getFlashSaleProducts = (params?: any) => {
  return get('/flash-sale/products', params)
}

export const createFlashSaleProduct = (data: Partial<FlashSaleProduct>) => {
  return post('/flash-sale/products', data)
}

export const updateFlashSaleProduct = (id: string, data: Partial<FlashSaleProduct>) => {
  return put(`/flash-sale/products/${id}`, data)
}

export const deleteFlashSaleProduct = (id: string) => {
  return del(`/flash-sale/products/${id}`)
}

// ==================== 企业定制 ====================

// 企业服务分类管理
export const getEnterpriseCategories = (params?: any) => {
  return get('/enterprise/categories', params)
}

export const createEnterpriseCategory = (data: Partial<EnterpriseCategory>) => {
  return post('/enterprise/categories', data)
}

export const updateEnterpriseCategory = (id: string, data: Partial<EnterpriseCategory>) => {
  return put(`/enterprise/categories/${id}`, data)
}

export const deleteEnterpriseCategory = (id: string) => {
  return del(`/enterprise/categories/${id}`)
}

// 企业询价管理
export const getEnterpriseInquiries = (params?: any) => {
  return get('/enterprise/inquiries', params)
}

export const updateEnterpriseInquiryStatus = (id: string, data: { status: string; assignedSalesId?: string }) => {
  return patch(`/enterprise/inquiries/${id}/status`, data)
}

// ==================== 高端管家 ====================

// 高端管家服务分类管理
export const getPremiumCategories = (params?: any) => {
  return get('/premium/categories', params)
}

export const createPremiumCategory = (data: Partial<PremiumCategory>) => {
  return post('/premium/categories', data)
}

export const updatePremiumCategory = (id: string, data: Partial<PremiumCategory>) => {
  return put(`/premium/categories/${id}`, data)
}

export const deletePremiumCategory = (id: string) => {
  return del(`/premium/categories/${id}`)
}

// 管家申请审核
export const getPremiumApplications = (params?: any) => {
  return get('/premium/applications', params)
}

export const approvePremiumApplication = (id: string) => {
  return post(`/premium/applications/${id}/approve`)
}

export const rejectPremiumApplication = (id: string, reason?: string) => {
  return post(`/premium/applications/${id}/reject`, { reason })
}
