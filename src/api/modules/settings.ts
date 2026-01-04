import { get, put, post } from '@/utils/request'
import type { MembershipConfig, Admin, AdminCreateParams } from '@/types/api'

/**
 * 获取会员配置
 */
export const getMembershipConfig = () => {
  return get<MembershipConfig>('/settings/membership')
}

/**
 * 更新会员配置
 */
export const updateMembershipConfig = (data: MembershipConfig) => {
  return put('/settings/membership', data)
}

/**
 * 获取管理员列表
 */
export const getAdmins = () => {
  return get<Admin[]>('/settings/admins')
}

/**
 * 创建管理员账号
 */
export const createAdmin = (data: AdminCreateParams) => {
  return post<Admin>('/settings/admins', data)
}
