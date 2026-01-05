import { get, post, del, patch } from '@/utils/request'
import type { MarketingStats, Coupon, CouponParams, Banner, BannerParams, PaginationResponse } from '@/types/api'

/**
 * 获取营销统计数据
 */
export const getMarketingStats = () => {
  return get<MarketingStats>('/marketing/stats')
}

/**
 * 获取优惠券列表
 */
export const getCoupons = (params?: CouponParams) => {
  return get<PaginationResponse<Coupon>>('/marketing/coupons', params)
}

/**
 * 创建优惠券
 */
export const createCoupon = (data: Omit<Coupon, 'couponId' | 'createTime'>) => {
  return post<Coupon>('/marketing/coupons', data)
}

/**
 * 更新优惠券
 */
export const updateCoupon = (id: string, data: Partial<Coupon>) => {
  return post<Coupon>(`/marketing/coupons/${id}`, data)
}

/**
 * 删除优惠券
 */
export const deleteCoupon = (id: string) => {
  return del(`/marketing/coupons/${id}`)
}

/**
 * 发布优惠券
 */
export const publishCoupon = (id: string) => {
  return post(`/marketing/coupons/${id}/publish`)
}

/**
 * 获取轮播图列表
 */
export const getBanners = (params?: BannerParams) => {
  return get<Banner[]>('/marketing/banners', params)
}

/**
 * 创建轮播图
 */
export const createBanner = (data: Omit<Banner, 'bannerId'>) => {
  return post<Banner>('/marketing/banners', data)
}

/**
 * 更新轮播图
 */
export const updateBanner = (id: string, data: Partial<Banner>) => {
  return post<Banner>(`/marketing/banners/${id}`, data)
}

/**
 * 删除轮播图
 */
export const deleteBanner = (id: string) => {
  return del(`/marketing/banners/${id}`)
}
