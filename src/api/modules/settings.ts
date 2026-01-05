import { get, put, post, del } from '@/utils/request'
import type { MembershipSettings, Admin, AdminParams, SystemSettings } from '@/types/api'

/**
 * 获取会员配置
 */
export const getMembershipSettings = () => {
  return get<MembershipSettings>('/settings/membership')
}

/**
 * 更新会员配置
 */
export const updateMembershipSettings = (data: MembershipSettings) => {
  return post<MembershipSettings>('/settings/membership', data)
}

/**
 * 获取管理员列表
 */
export const getAdmins = (params?: AdminParams) => {
  return get<Admin[]>('/settings/admins', params)
}

/**
 * 创建管理员账号
 */
export const createAdmin = (data: Omit<Admin, 'adminId' | 'createTime'>) => {
  return post<Admin>('/settings/admins', data)
}

/**
 * 更新管理员
 */
export const updateAdmin = (id: string, data: Partial<Admin>) => {
  return post<Admin>(`/settings/admins/${id}`, data)
}

/**
 * 删除管理员
 */
export const deleteAdmin = (id: string) => {
  return del(`/settings/admins/${id}`)
}

/**
 * 重置管理员密码
 */
export const resetAdminPassword = (id: string) => {
  return post<{ newPassword: string }>(`/settings/admins/${id}/reset-password`)
}

/**
 * 获取系统设置
 */
export const getSystemSettings = () => {
  return get<SystemSettings>('/settings/system')
}

/**
 * 更新系统设置
 */
export const updateSystemSettings = (data: Partial<SystemSettings>) => {
  return post<SystemSettings>('/settings/system', data)
}
