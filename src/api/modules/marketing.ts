import { get, post, del, patch, put } from '@/utils/request'
import type { Coupon, CouponParams, Banner, BannerParams, PaginationResponse, SpecialOffer, SpecialOfferParams } from '@/types/api'

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
  return get<PaginationResponse<Banner>>('/marketing/banners', params)
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
  // 使用 PUT 方法进行更新，匹配后端接口
  return put<Banner>(`/marketing/banners/${id}`, data)
}

/**
 * 更新轮播图状态
 */
export const updateBannerStatus = (id: string, status: Banner['status']) => {
  return patch(`/marketing/banners/${id}/status`, { status })
}

/**
 * 删除轮播图
 */
export const deleteBanner = (id: string) => {
  return del(`/marketing/banners/${id}`)
}

/**
 * 获取限时特惠列表
 */
export const getSpecialOffers = (params?: SpecialOfferParams) => {
  return get<PaginationResponse<SpecialOffer>>('/marketing/special-offers', params)
}

/**
 * 创建限时特惠
 */
export const createSpecialOffer = (data: Omit<SpecialOffer, 'id' | 'createTime' | 'updateTime'>) => {
  return post<SpecialOffer>('/marketing/special-offers', data)
}

/**
 * 更新限时特惠
 */
export const updateSpecialOffer = (id: string, data: Partial<SpecialOffer>) => {
  return put<SpecialOffer>(`/marketing/special-offers/${id}`, data)
}

/**
 * 删除限时特惠
 */
export const deleteSpecialOffer = (id: string) => {
  return del(`/marketing/special-offers/${id}`)
}

/**
 * 更新限时特惠状态
 */
export const updateSpecialOfferStatus = (id: string, status: 'active' | 'inactive') => {
  return patch(`/marketing/special-offers/${id}/status`, { status })
}
