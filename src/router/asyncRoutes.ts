import { RouteRecordRaw } from 'vue-router'

// 动态路由配置
export const asyncRoutes: RouteRecordRaw[] = [
  // 用户管理
  {
    path: '/user',
    name: 'User',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/user/list',
    meta: { title: '用户管理', icon: 'User' },
    children: [
      {
        path: '/user/list',
        name: 'UserList',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户列表', permissions: ['user:view'] },
      },
      {
        path: '/user/detail/:id',
        name: 'UserDetail',
        component: () => import('@/views/user/detail.vue'),
        meta: { title: '用户详情', permissions: ['user:view'], hidden: true },
      },
    ],
  },

  // 服务者管理
  {
    path: '/provider',
    name: 'Provider',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/provider/list',
    meta: { title: '服务者管理', icon: 'Avatar' },
    children: [
      {
        path: '/provider/list',
        name: 'ProviderList',
        component: () => import('@/views/provider/index.vue'),
        meta: { title: '服务者列表', permissions: ['provider:view'] },
      },
    ],
  },

  // 订单管理
  {
    path: '/order',
    name: 'Order',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/order/list',
    meta: { title: '订单管理', icon: 'Document' },
    children: [
      {
        path: '/order/list',
        name: 'OrderList',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单列表', permissions: ['order:view'] },
      },
    ],
  },

  // 财务管理
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/finance/withdrawal',
    meta: { title: '财务管理', icon: 'Money' },
    children: [
      {
        path: '/finance/withdrawal',
        name: 'Withdrawal',
        component: () => import('@/views/finance/withdrawal.vue'),
        meta: { title: '提现管理', permissions: ['withdrawal:audit'] },
      },
    ],
  },

  // 营销配置
  {
    path: '/marketing',
    name: 'Marketing',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/marketing/banner',
    meta: { title: '营销配置', icon: 'Promotion' },
    children: [
      {
        path: '/marketing/banner',
        name: 'Banner',
        component: () => import('@/views/marketing/banner.vue'),
        meta: { title: '轮播图管理', permissions: ['banner:manage'] },
      },
      {
        path: '/marketing/coupon',
        name: 'Coupon',
        component: () => import('@/views/marketing/coupon.vue'),
        meta: { title: '优惠券模板', permissions: ['coupon:manage'] },
      },
    ],
  },

  // 系统管理
  {
    path: '/system',
    name: 'System',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/system/role',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: '/system/role',
        name: 'Role',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色权限', permissions: ['role:manage'] },
      },
      {
        path: '/system/log',
        name: 'AuditLog',
        component: () => import('@/views/log/index.vue'),
        meta: { title: '操作日志', permissions: ['log:view'] },
      },
      {
        path: '/system/generator',
        name: 'Generator',
        component: () => import('@/views/generator/index.vue'),
        meta: { title: '代码生成器', permissions: ['generator:use'] },
      },
    ],
  },
]
