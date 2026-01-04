import { get, post, del } from '@/utils/request'
import type { Banner, Coupon, CouponTemplate, PaginationResponse } from '@/types/api'

/**
 * 获取轮播图列表
 */
export const getBanners = () => {
  return get<Banner[]>('/marketing/banners')
}

/**
 * 新增轮播图
 */
export const createBanner = (data: Omit<Banner, 'id' | 'createTime'>) => {
  return post<Banner>('/marketing/banners', data)
}

/**
 * 删除轮播图
 */
export const deleteBanner = (id: number) => {
  return del(`/marketing/banners/${id}`)
}

/**
 * 获取优惠券模板列表
 */
export const getCoupons = () => {
  return get<Coupon[]>('/marketing/coupons')
}

/**
 * 创建优惠券模板
 */
export const createCoupon = (data: CouponTemplate) => {
  return post<Coupon>('/marketing/coupons', data)
}
