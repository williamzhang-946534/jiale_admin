import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { usePermissionStore } from '@/store/permission'

// 同步导入组件
import BasicLayout from '@/layouts/basicLayout.vue'
import Dashboard from '@/views/dashboard/index.vue'

// 静态路由
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '403', hidden: true },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// 白名单路由
const whiteList = ['/login', '/403', '/404']

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()

  // 设置页面标题（避免undefined）
  document.title = `${to.meta?.title || '页面'} - 家乐家政`

  // 检查是否已登录
  const hasToken = authStore.isLoggedIn
  console.log('🔐 路由守卫 - 目标路径:', to.path, '已登录:', hasToken, '用户信息:', !!authStore.user)

  // 特殊处理根路径
  if (to.path === '/') {
    console.log('🏠 访问根路径，检查登录状态:', hasToken)
    if (hasToken) {
      // 已登录用户访问根路径，检查Layout路由是否存在
      const layoutRoute = router.getRoutes().find(r => r.name === 'Layout')
      console.log('🏠 Layout路由存在:', !!layoutRoute)
      if (layoutRoute) {
        // Layout路由已存在，直接跳转到dashboard
        console.log('🏠 跳转到dashboard')
        next('/dashboard')
      } else {
        // Layout路由还没添加，继续执行后续逻辑添加路由
        console.log('🏠 Layout路由不存在，继续添加路由')
        // 不return，继续执行后续的路由添加逻辑
      }
    } else {
      // 未登录用户访问根路径，跳转到登录页
      console.log('🏠 未登录，跳转到login')
      next('/login')
      return
    }
  }

  if (hasToken) {
    // 检查Layout路由是否存在
    const layoutRoute = router.getRoutes().find(r => r.name === 'Layout')
    
    // 如果Layout路由不存在，需要添加路由
    if (!layoutRoute) {
    // 检查是否已获取用户信息
    if (!authStore.user) {
        try {
          // 获取用户信息
          await authStore.refreshUser()
        } catch (error) {
          // 获取用户信息失败，清除token并跳转登录页
          authStore.logout()
          next('/login')
          return
        }
      }

      // 确保有用户信息后再添加路由
      if (authStore.user) {
        try {
          // 动态添加完整的Layout路由结构
          console.log('🏗️ 开始添加Layout路由，用户信息:', authStore.user.username)
          router.addRoute({
            path: '/',
            name: 'Layout',
            component: BasicLayout,
            redirect: '/dashboard',
            children: [
              {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: '控制台', icon: 'Monitor' },
              },
              // 动态路由会在这里被添加
            ],
          })

          console.log('🏗️ 已添加Layout路由，验证路由表:')
          const allRoutes = router.getRoutes()
          console.log('📋 当前路由:', allRoutes.map(r => ({
            path: r.path,
            name: r.name
          })))

          // 生成并添加动态路由
          const dynamicRoutes = permissionStore.generateRoutes()
          const filteredRoutes = permissionStore.filterRoutes(dynamicRoutes)

          console.log('🎯 准备添加动态路由到Layout:', filteredRoutes.map(r => ({ path: r.path, name: r.name })))

          filteredRoutes.forEach(route => {
            try {
              router.addRoute('Layout', route)
              console.log(`✅ 成功添加路由到Layout: ${route.path}`)
            } catch (error) {
              console.error(`❌ 添加路由失败 ${route.path}:`, error)
            }
          })

          // 验证最终路由
          const finalRoutes = router.getRoutes()
          const layoutRoute = finalRoutes.find(r => r.name === 'Layout')
          const layoutRoutes = layoutRoute?.children || []
          console.log('📋 Layout子路由:', layoutRoutes.map(r => ({ path: r.path, name: r.name })))
          console.log('📋 完整路由信息:', finalRoutes.map(r => ({
            path: r.path,
            name: r.name,
            children: r.children?.map(c => ({ path: c.path, name: c.name }))
          })))

          // 确保路由已添加后再跳转
          // 如果是从登录页面来的，或者访问的是根路径，跳转到dashboard
          const redirectPath = (to.path === '/login' || to.path === '/') ? '/dashboard' : to.path
          console.log('🎯 重定向到:', redirectPath)
          console.log('🎯 最终路由表:', router.getRoutes().map(r => ({
            path: r.path,
            name: r.name
          })))
          next({ path: redirectPath, replace: true })
          return
        } catch (error) {
          console.error('❌ 添加路由失败:', error)
          authStore.logout()
          next('/login')
          return
        }
      } else {
        // 用户信息不存在，但token存在，可能是token过期了
        console.error('❌ 用户信息不存在，但token存在')
        authStore.logout()
        next('/login')
        return
      }
    } else {
      // Layout路由已存在，检查路由权限
        const hasPermission = permissionStore.hasRoutePermission(to as any)
        if (hasPermission) {
          next()
        } else {
          next('/403')
        }
      }
  } else {
    // 未登录
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router

