import { defineStore } from 'pinia'
import { ref } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from './auth'

export interface MenuItem {
  id: string
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
  permissions?: string[]
  component?: string // 视图组件路径（相对 views/，不含 .vue）
}

export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()
  const routes = ref<RouteRecordRaw[]>([])
  const dynamicRoutes = ref<RouteRecordRaw[]>([])

  // 生成动态路由
  const generateRoutes = (): RouteRecordRaw[] => {
    let userMenus = authStore.userMenus
    console.log('📋 生成路由 - 用户菜单数据:', userMenus)
    console.log('📋 用户信息:', authStore.user)

    // 如果菜单数据为空，使用默认菜单（临时方案）
    if (!userMenus || userMenus.length === 0) {
      console.warn('⚠️ 用户菜单数据为空，使用默认菜单')
      userMenus = [
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
          id: 'finance',
          name: '财务管理',
          path: '/finance',
          icon: 'Money',
          children: [
            {
              id: 'finance-overview',
              name: '财务概览',
              path: '/finance/overview',
              component: 'finance/index',
            },
          ],
        },
        {
          id: 'marketing',
          name: '营销管理',
          path: '/marketing',
          icon: 'Ticket',
          children: [
            {
              id: 'marketing-overview',
              name: '营销活动',
              path: '/marketing/overview',
              component: 'marketing/index',
            },
            {
              id: 'marketing-banners',
              name: '轮播图管理',
              path: '/marketing/banners',
              component: 'marketing/banner',
            },
          ],
        },
        {
          id: 'home-zones',
          name: '首页专区',
          path: '/home-zones',
          icon: 'House',
          children: [
            {
              id: 'newcomer-zone',
              name: '新人专区',
              path: '/home-zones/newcomer',
              component: 'home-zones/newcomer',
            },
            {
              id: 'flash-sale',
              name: '闪购秒杀',
              path: '/home-zones/flash-sale',
              component: 'home-zones/flash-sale',
            },
            {
              id: 'enterprise',
              name: '企业定制',
              path: '/home-zones/enterprise',
              component: 'home-zones/enterprise',
            },
            {
              id: 'premium',
              name: '高端管家',
              path: '/home-zones/premium',
              component: 'home-zones/premium',
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
              id: 'settings',
              name: '系统设置',
              path: '/system/settings',
              component: 'settings/index',
            },
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

    const menuRoutes = userMenus.flatMap(menu => {
      const routes: RouteRecordRaw[] = []
      console.log('🔍 处理菜单:', menu.name, menu.path, menu.children?.length || 0, '个子菜单')

      // 如果有子菜单，为每个子菜单生成路由
      if (menu.children && menu.children.length > 0) {
        menu.children.forEach(child => {
          // 从子菜单路径中提取父级目录名
          const parentPath = menu.path.replace(/^\//, '') // 去掉开头的/
          // 作为 Layout 子路由，使用相对路径（不以 / 开头），最终路由为 /parent/child
          const routePath = child.path.replace(/^\//, '')
          // 使用 child.id 或生成唯一的路由名称
          const routeName = child.id || `${parentPath}-${routePath.replace(/\//g, '-')}`
          const componentPath = child.component || `${parentPath}/index`
          console.log('✅ 生成子路由:', {
            parentPath,
            routePath,
            routeName,
            componentPath,
            fullPath: `/src/views/${componentPath}.vue`,
            childName: child.name
          })
          // 创建组件映射表，确保生产环境正确加载
          const componentMap: Record<string, () => Promise<any>> = {
            'provider/enhanced': () => import('@/views/provider/enhanced.vue'),
            'provider/index': () => import('@/views/provider/index.vue'),
            'order/enhanced': () => import('@/views/order/enhanced.vue'),
            'order/index': () => import('@/views/order/index.vue'),
            'user/enhanced': () => import('@/views/user/enhanced.vue'),
            'user/index': () => import('@/views/user/index.vue'),
            'category/index': () => import('@/views/category/index.vue'),
            'service/index': () => import('@/views/service/index.vue'),
            'finance/index': () => import('@/views/finance/index.vue'),
            'marketing/index': () => import('@/views/marketing/index.vue'),
            'marketing/banner': () => import('@/views/marketing/banner.vue'),
            'home-zones/newcomer': () => import('@/views/home-zones/newcomer.vue'),
            'home-zones/flash-sale': () => import('@/views/home-zones/flash-sale.vue'),
            'home-zones/enterprise': () => import('@/views/home-zones/enterprise.vue'),
            'home-zones/premium': () => import('@/views/home-zones/premium.vue'),
            'settings/index': () => import('@/views/settings/index.vue'),
            'permission/admins': () => import('@/views/permission/admins.vue'),
            'permission/roles': () => import('@/views/permission/roles.vue'),
            'permission/analysis-simple': () => import('@/views/permission/analysis-simple.vue'),
          }

          routes.push({
            path: routePath,
            name: routeName,
            component: componentMap[componentPath] || (() => import('@/views/dashboard/index.vue')),
            meta: {
              title: child.name,
              icon: child.icon,
              permissions: child.permissions,
            },
          } as RouteRecordRaw)
        })
      } else {
        // 如果没有子菜单，直接生成父级路由
        const compPath = menu.component || `${menu.path.replace('/', '')}/index`
        console.log('📄 生成父路由:', {
          menuPath: menu.path,
          menuName: menu.name,
          compPath,
          fullPath: `/src/views/${compPath}.vue`
        })
        
        // 创建组件映射表，确保生产环境正确加载
        const componentMap: Record<string, () => Promise<any>> = {
          'provider/enhanced': () => import('@/views/provider/enhanced.vue'),
          'provider/index': () => import('@/views/provider/index.vue'),
          'order/enhanced': () => import('@/views/order/enhanced.vue'),
          'order/index': () => import('@/views/order/index.vue'),
          'user/enhanced': () => import('@/views/user/enhanced.vue'),
          'user/index': () => import('@/views/user/index.vue'),
          'category/index': () => import('@/views/category/index.vue'),
          'service/index': () => import('@/views/service/index.vue'),
          'finance/index': () => import('@/views/finance/index.vue'),
          'marketing/index': () => import('@/views/marketing/index.vue'),
          'marketing/banner': () => import('@/views/marketing/banner.vue'),
          'home-zones/newcomer': () => import('@/views/home-zones/newcomer.vue'),
          'home-zones/flash-sale': () => import('@/views/home-zones/flash-sale.vue'),
          'home-zones/enterprise': () => import('@/views/home-zones/enterprise.vue'),
          'home-zones/premium': () => import('@/views/home-zones/premium.vue'),
          'settings/index': () => import('@/views/settings/index.vue'),
          'permission/admins': () => import('@/views/permission/admins.vue'),
          'permission/roles': () => import('@/views/permission/roles.vue'),
          'permission/analysis-simple': () => import('@/views/permission/analysis-simple.vue'),
        }
        
        routes.push({
          path: menu.path,
          name: menu.name,
          component: componentMap[compPath] || (() => import('@/views/dashboard/index.vue')),
          meta: {
            title: menu.name,
            icon: menu.icon,
            permissions: menu.permissions,
          },
        } as RouteRecordRaw)
      }

      return routes
    })

    // 手动添加首页专区路由（确保始终显示）
    const homeZonesRoute: RouteRecordRaw = {
      path: '/home-zones',
      name: 'home-zones',
      redirect: '/home-zones/newcomer',
      meta: { title: '首页专区', icon: 'House' },
      children: [
        {
          path: '/home-zones/newcomer',
          name: 'newcomer-zone',
          component: () => import('@/views/home-zones/newcomer.vue'),
          meta: { title: '新人专区', icon: 'Present' }
        },
        {
          path: '/home-zones/flash-sale',
          name: 'flash-sale',
          component: () => import('@/views/home-zones/flash-sale.vue'),
          meta: { title: '闪购秒杀', icon: 'Lightning' }
        },
        {
          path: '/home-zones/enterprise',
          name: 'enterprise',
          component: () => import('@/views/home-zones/enterprise.vue'),
          meta: { title: '企业定制', icon: 'OfficeBuilding' }
        },
        {
          path: '/home-zones/premium',
          name: 'premium',
          component: () => import('@/views/home-zones/premium.vue'),
          meta: { title: '高端管家', icon: 'Star' }
        }
      ]
    }
    
    menuRoutes.push(homeZonesRoute)

    console.log('🎯 最终生成的路由:', menuRoutes.map(r => ({ path: r.path, name: r.name })))
    dynamicRoutes.value = menuRoutes
    return menuRoutes
  }

  // 检查路由权限
  const hasRoutePermission = (route: RouteRecordRaw): boolean => {
    const permissions = route.meta?.permissions as string[] | undefined
    if (!permissions || permissions.length === 0) return true

    return authStore.hasPermission(permissions)
  }

  // 过滤有权限的路由
  const filterRoutes = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
    return routes.filter(route => {
      if (hasRoutePermission(route)) {
        if (route.children && route.children.length > 0) {
          route.children = filterRoutes(route.children)
        }
        return true
      }
      return false
    })
  }

  return {
    routes,
    dynamicRoutes,
    generateRoutes,
    hasRoutePermission,
    filterRoutes,
  }
})
