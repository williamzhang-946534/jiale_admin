import { get, post } from '@/utils/request'
import type { User, UserDetail, UserListParams, PaginationResponse } from '@/types/api'

export type UserListItem = User

/**
 * 获取用户列表
 */
export const getUsers = (params?: UserListParams) => {
  return get<PaginationResponse<User>>('/users', params)
}

/**
 * 获取用户详情
 */
export const getUserDetail = (id: string) => {
  return get<UserDetail>(`/users/${id}`)
}

/**
 * 赠送优惠券
 */
export const giveCoupon = (userId: string, couponId: string) => {
  return post(`/users/${userId}/coupons`, { couponId })
}

