import { get, post } from '@/utils/request'

export interface AdminItem {
  id: string
  username: string
  nickname?: string
  role?: string
  status?: string
  createdAt?: string
}

export interface AdminListResponse {
  list: AdminItem[]
  total?: number
}

export interface CreateAdminPayload {
  username: string
  password: string
  nickname?: string
  role?: string
}

// 获取管理员列表
export const getAdmins = () => {
  return get<AdminListResponse>('/settings/admins')
}

// 创建管理员账号
export const createAdmin = (payload: CreateAdminPayload) => {
  return post('/settings/admins', payload)
}

