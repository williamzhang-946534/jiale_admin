/**
 * 权限配置中心
 * 统一管理所有权限点，便于维护和扩展
 */

// 权限模块定义
export const PERMISSION_MODULES = {
  USER: 'user',
  ORDER: 'order', 
  PROVIDER: 'provider',
  FINANCE: 'finance',
  MARKETING: 'marketing',
  SYSTEM: 'system',
  LOG: 'log'
} as const

// 权限操作定义
export const PERMISSION_ACTIONS = {
  VIEW: 'view',
  CREATE: 'create', 
  EDIT: 'edit',
  DELETE: 'delete',
  AUDIT: 'audit',
  BAN: 'ban',
  ASSIGN: 'assign',
  REFUND: 'refund',
  MANAGE: 'manage',
  EXPORT: 'export'
} as const

// 完整权限点列表
export const PERMISSION_LIST = [
  // 用户管理
  'user:view',
  'user:create', 
  'user:edit',
  'user:delete',
  'user:give_coupon',
  
  // 订单管理
  'order:view',
  'order:assign',
  'order:refund',
  'order:export',
  
  // 服务者管理
  'provider:view',
  'provider:audit',
  'provider:ban',
  'provider:edit',
  
  // 财务管理
  'finance:view',
  'finance:audit_withdrawal',
  'finance:export',
  
  // 营销管理
  'marketing:manage_banner',
  'marketing:manage_coupon',
  
  // 系统管理
  'system:manage_role',
  'system:manage_admin',
  'system:view_log',
  'system:use_generator',
  
  // 超级权限
  '*'
] as const

// 权限分组
export const PERMISSION_GROUPS = {
  user: {
    name: '用户管理',
    permissions: ['user:view', 'user:create', 'user:edit', 'user:delete', 'user:give_coupon']
  },
  order: {
    name: '订单管理', 
    permissions: ['order:view', 'order:assign', 'order:refund', 'order:export']
  },
  provider: {
    name: '服务者管理',
    permissions: ['provider:view', 'provider:audit', 'provider:ban', 'provider:edit']
  },
  finance: {
    name: '财务管理',
    permissions: ['finance:view', 'finance:audit_withdrawal', 'finance:export']
  },
  marketing: {
    name: '营销管理',
    permissions: ['marketing:manage_banner', 'marketing:manage_coupon']
  },
  system: {
    name: '系统管理',
    permissions: ['system:manage_role', 'system:manage_admin', 'system:view_log', 'system:use_generator']
  }
}

// 预设角色模板
export const ROLE_TEMPLATES = {
  super_admin: {
    name: '超级管理员',
    desc: '拥有系统所有权限',
    permissions: ['*']
  },
  admin: {
    name: '系统管理员', 
    desc: '管理系统配置和用户',
    permissions: [
      'user:view', 'user:create', 'user:edit',
      'system:manage_role', 'system:manage_admin', 'system:view_log'
    ]
  },
  operator: {
    name: '运营专员',
    desc: '负责日常业务操作',
    permissions: [
      'user:view', 'user:give_coupon',
      'order:view', 'order:assign',
      'provider:view', 'provider:audit'
    ]
  },
  finance: {
    name: '财务专员',
    desc: '负责财务相关操作',
    permissions: [
      'finance:view', 'finance:audit_withdrawal',
      'order:view', 'order:refund'
    ]
  },
  marketer: {
    name: '营销专员',
    desc: '负责营销活动管理',
    permissions: [
      'marketing:manage_banner', 'marketing:manage_coupon',
      'user:view'
    ]
  },
  viewer: {
    name: '只读用户',
    desc: '仅可查看数据',
    permissions: [
      'user:view', 'order:view', 'provider:view', 'finance:view'
    ]
  }
}

// 权限检查工具函数
export const hasModulePermission = (
  userPermissions: string[], 
  module: keyof typeof PERMISSION_MODULES, 
  action: keyof typeof PERMISSION_ACTIONS
): boolean => {
  const permission = `${module}:${action}`
  return userPermissions.includes('*') || userPermissions.includes(permission)
}

export const getPermissionName = (permission: string): string => {
  const [module, action] = permission.split(':')
  const moduleName = Object.values(PERMISSION_MODULES).find(m => m === module)
  const actionName = Object.values(PERMISSION_ACTIONS).find(a => a === action)
  
  if (moduleName && actionName) {
    const moduleGroup = PERMISSION_GROUPS[moduleName as keyof typeof PERMISSION_GROUPS]
    return `${moduleGroup?.name || module} - ${actionName}`
  }
  
  return permission
}

export type PermissionType = typeof PERMISSION_LIST[number]
export type RoleTemplateKey = keyof typeof ROLE_TEMPLATES
