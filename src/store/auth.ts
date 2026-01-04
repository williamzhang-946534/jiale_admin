import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { post } from '@/utils/request'

export interface User {
  id: string
  username: string
  nickname?: string
  name?: string // 后端可能返回 name 字段
  avatar?: string
  role: string
  permissions?: string[]
  menus?: MenuItem[] // 可能为空或不存在
}

export interface MenuItem {
  id: string
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
  permissions?: string[]
  component?: string // 视图组件路径（相对 views/，不含 .vue）
}

export interface LoginParams {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userPermissions = computed(() => user.value?.permissions || [])
  const userMenus = computed(() => {
    const menus = user.value?.menus || []
    console.log('📋 userMenus 计算属性:', menus, '用户信息:', user.value)
    return menus
  })

  // 方法
  const login = async (params: LoginParams) => {
    loading.value = true
    try {
      // 登录接口路径是 /api/auth/admin/login，不在 /api/admin/v1 下
      const response = await axios.post<{
        code: number
        message: string
        data: {
          token: string
          admin: User
        }
      }>('/api/auth/admin/login', params)

      if (response.data.code !== 200) {
        throw new Error(response.data.message || '登录失败')
      }

      const result = response.data.data
      token.value = result.token
      // API返回的是 admin 字段，不是 user
      const adminData = result.admin
      
      // 确保字段映射正确：如果后端返回 name，映射到 nickname
      if (adminData.name && !adminData.nickname) {
        adminData.nickname = adminData.name
      }
      
      // 如果后端没有返回 menus，添加默认菜单
      if (!adminData.menus || adminData.menus.length === 0) {
        console.warn('⚠️ 后端未返回菜单数据，使用默认菜单')
        adminData.menus = [
          {
            id: 'dashboard',
            name: '仪表盘',
            path: '/dashboard',
            icon: 'Monitor',
          },
          {
            id: 'provider',
            name: '服务者管理',
            path: '/provider',
            icon: 'Avatar',
            children: [
              {
            id: 'provider-list',
            name: '服务者列表',
            path: '/provider/list',
            component: 'provider/enhanced',
          },
            ],
          },
          {
            id: 'order',
            name: '订单管理',
            path: '/order',
            icon: 'Document',
            children: [
              {
                id: 'order-list',
                name: '订单列表',
                path: '/order/list',
                component: 'order/enhanced',
              },
            ],
          },
          {
            id: 'service',
            name: '服务管理',
            path: '/service',
            icon: 'Service',
            children: [
              {
                id: 'category-list',
                name: '分类管理',
                path: '/service/category',
                component: 'category/index',
              },
              {
                id: 'service-list',
                name: '服务列表',
                path: '/service/list',
                component: 'service/index',
              },
            ],
          },
          {
            id: 'user',
            name: '用户管理',
            path: '/user',
            icon: 'User',
            children: [
              {
                id: 'user-list',
                name: '用户列表',
                path: '/user/list',
                component: 'user/enhanced',
              },
            ],
          },
          {
            id: 'debug',
            name: '调试工具',
            path: '/debug',
            icon: 'Tools',
            children: [
              {
                id: 'route-debug',
                name: '路由调试',
                path: '/debug/routes',
                component: 'debug/routes',
              },
            ],
          },
          {
            id: 'system',
            name: '系统管理',
            path: '/system',
            icon: 'Lock',
            children: [
              {
                id: 'admin-list',
                name: '管理员列表',
                path: '/system/admins',
                component: 'permission/admins',
              },
              {
                id: 'role-list',
                name: '角色管理',
                path: '/system/roles',
                component: 'permission/roles',
              },
              {
                id: 'permission-analysis',
                name: '权限分析',
                path: '/system/analysis',
                component: 'permission/analysis-simple',
              },
            ],
          },
        ]
      }
      
      // 如果后端没有返回 permissions，添加默认权限
      if (!adminData.permissions || adminData.permissions.length === 0) {
        console.warn('⚠️ 后端未返回权限数据，使用默认权限')
        adminData.permissions = ['*'] // 超级管理员权限，可以访问所有功能
      }
      
      user.value = adminData as User
      console.log('✅ 登录成功，用户信息:', user.value)

      // 保存到本地存储
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(user.value))

      return {
        token: result.token,
        user: result.admin,
      }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const refreshUser = async () => {
    try {
      // 刷新用户信息接口，根据实际API文档调整
      // 如果后端没有这个接口，可以从token中解析用户信息
      // 或者调用获取管理员信息的接口
      const result = await post<User>('/auth/refresh')
      user.value = result
      localStorage.setItem('user', JSON.stringify(result))
    } catch (error) {
      // 如果刷新失败，清除登录状态
      logout()
    }
  }

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user.value || !user.value.permissions) return false

    // 超级管理员拥有所有权限
    if (user.value.permissions.includes('*')) return true

    const permissions = Array.isArray(permission) ? permission : [permission]
    return permissions.some(p => user.value!.permissions!.includes(p))
  }

  const initAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      const parsedUser = JSON.parse(storedUser)
      
      // 如果恢复的用户数据没有权限，添加默认权限
      if (!parsedUser.permissions || parsedUser.permissions.length === 0) {
        parsedUser.permissions = ['*']
        // 更新localStorage
        localStorage.setItem('user', JSON.stringify(parsedUser))
      }
      
      user.value = parsedUser
    }
  }

  return {
    // 状态
    token,
    user,
    loading,

    // 计算属性
    isLoggedIn,
    userPermissions,
    userMenus,

    // 方法
    login,
    logout,
    refreshUser,
    hasPermission,
    initAuth,
  }
})
