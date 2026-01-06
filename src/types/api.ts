/**
 * API接口类型定义
 * 基于家乐家政后台管理系统接口文档
 */

// ===== 通用类型 =====
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ===== 控制台相关 =====
export interface DashboardStats {
  totalGmv: number
  todayOrders: number
  pendingProviders: number
  activeUsers: number
}

export interface DashboardChart {
  labels: string[]
  orderValues: number[]
  revenueValues: number[]
}

// ===== 分类相关 =====
export interface Category {
  id: string
  name: string
  parentId?: string | null
  icon?: string | null
  sortOrder?: number
  parent?: Category | null
  children?: Category[]
  _count?: {
    services: number
  }
}

// ===== 服务相关 =====
export interface Service {
  id: string
  name: string
  categoryId: string
  price: number
  unit: string
  images: string[]
  description: string
  tags: string[]
  status: 'active' | 'inactive'
  createTime?: string
  updateTime?: string
}

export interface ServiceDetail {
  baseInfo: Service
  providerDetail?: {
    attributes: Record<string, string>
    stats: Record<string, number>
    certs: string[]
    intro: string
    gallery: string[]
    workHistory: any[]
  }
  standardDetail?: {
    processSteps: any[]
    comparisonImages: string[]
  }
}

// ===== 服务者相关 =====
export interface Provider {
  id: string
  name: string
  phone: string
  status: 'unverified' | 'pending' | 'verified' | 'rejected'
  isBanned?: boolean
  createTime: string
  rating?: number
  orders?: number
  description?: string
  tags?: string[]
  isVerified?: boolean
}

export interface ProviderDetail extends Provider {
  avatar?: string
  idCard?: string
  idCardImages?: string[]
  certFiles?: string[]
  bankInfo?: string
  wallet?: {
    balance: number
    frozen?: number
    history: Array<{
      type: 'income' | 'expense' | 'frozen' | 'unfrozen'
      amount: number
      description: string
      createTime: string
    }>
  }
  profile?: {
    intro: string
    attributes: Record<string, string>
    stats: Record<string, number | string>
    certs: string[]
    gallery: string[]
    workHistory: Array<{
      company: string
      position: string
      period: [string, string]
      description: string
    }>
  }
}

export interface ProviderAuditParams {
  action: 'approve' | 'reject'
  rejectReason?: string
}

// ===== 订单相关 =====
export interface Order {
  id: string
  orderNo: string
  serviceId: string
  serviceName: string
  userId: string
  userName?: string
  providerId?: string
  providerName?: string
  status: 'pending' | 'accepted' | 'arrived' | 'in_service' | 'completed' | 'cancelled'
  amount: number
  address: string
  serviceDate: string
  serviceTime: string
  specialRequests?: string
  createTime: string
  updateTime?: string
  timeline?: {
    created?: string
    accepted?: string
    arrived?: string
    started?: string
    completed?: string
  }
  payment?: {
    method: string
    status: string
    payTime?: string
  }
  review?: {
    rating: number
    content: string
    createTime: string
  }
}

export interface OrderAssignParams {
  providerId: string
}

export interface OrderRefundParams {
  amount: number
  reason: string
  type: 'full' | 'partial'
}

// ===== 用户相关 =====
export interface User {
  id: string
  username: string
  nickname?: string
  phone: string
  avatar?: string
  level?: string
  balance?: number
  points?: number
  status: 'active' | 'banned'
  createTime: string
  lastLoginTime?: string
}

export interface UserDetail extends User {
  addresses?: Address[]
  orders?: Order[]
  coupons?: Coupon[]
  stats?: {
    totalOrders: number
    totalSpent: number
    favoriteServices: string[]
  }
}

export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

// ===== 财务相关 =====
export interface Withdrawal {
  id: number
  providerId: string
  providerName: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  applyTime: string
  auditTime?: string
  bankInfo: string
  auditRemark?: string
}

export interface WithdrawalAuditParams {
  action: 'approve' | 'reject'
  remark?: string
}

// ===== 营销相关 =====
export interface Coupon {
  id: string
  name: string
  type: 'full' | 'discount' // 添加类型字段
  amount: number
  minSpend: number
  totalQuantity: number
  usedQuantity: number
  validDays: number
  status: 'active' | 'expired' | 'draft' // 修正状态字段
  createdAt: string
}

export interface CouponParams extends PaginationParams {
  status?: Coupon['status']
}

export interface CouponTemplate {
  name: string
  amount: number
  minSpend: number
  totalQuantity: number
  validDays: number
}

// ===== 系统设置相关 =====
export interface MembershipConfig {
  levels: {
    name: string
    price: number
    duration: number
    benefits: string[]
  }[]
}

export interface Admin {
  id: string
  username: string
  nickname?: string
  role: string
  permissions?: string[]
  status: 'active' | 'inactive'
  createTime: string
  lastLoginTime?: string
}

export interface AdminCreateParams {
  username: string
  password: string
  nickname?: string
  role: string
}

// ===== 查询参数类型 =====
export interface CategoryListParams extends PaginationParams {
  parentId?: string
}

export interface ServiceListParams extends PaginationParams {
  categoryId?: string
  keyword?: string
  status?: 'active' | 'inactive'
}

export interface ProviderListParams extends PaginationParams {
  status?: Provider['status']
  keyword?: string
}

export interface OrderListParams extends PaginationParams {
  status?: Order['status']
  orderNo?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface UserListParams extends PaginationParams {
  keyword?: string
  level?: string
  status?: User['status']
}

export interface WithdrawalListParams extends PaginationParams {
  status?: Withdrawal['status']
}

export interface DashboardChartParams {
  range: 'week' | 'month' | 'year'
}

// ===== 财务相关 =====
export interface FinanceStats {
  totalIncome: number
  pendingWithdrawals: number
  activeProviders: number
  todayIncome: number
}

export interface FinanceChart {
  labels: string[]
  values: number[]
}

export interface Withdrawal {
  id: number
  providerName: string
  providerPhone: string
  withdrawalAmount: number
  status: 'pending' | 'approved' | 'rejected'
  applyTime: string
  bankInfo: {
    bankName: string
    cardNumber: string
    branchName: string
    accountName: string
  }
  rejectReason?: string
}

export interface WithdrawalListParams extends PaginationParams {
  status?: Withdrawal['status']
}

export interface WithdrawalAuditParams {
  action: 'approve' | 'reject'
  rejectReason?: string
}

// ===== 营销相关 =====
export interface Banner {
  id: number
  imageUrl: string
  linkUrl?: string
  title?: string
  sortOrder: number
  status: 'published' | 'draft' // 修正状态值
  createdAt?: string
}

export interface BannerParams {
  status?: Banner['status']
}

export interface SpecialOffer {
  id: string
  name: string
  category: string
  price: number
  unit: string
  rating: number
  image: string
  description: string
  providerCount: number
  tags: string[]
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface SpecialOfferParams extends PaginationParams {
  status?: SpecialOffer['status']
  category?: string
}

// ===== 系统设置相关 =====
export interface MembershipSettings {
  basic: {
    name: string
    price: number
    benefits: string
  }
  gold: {
    name: string
    price: number
    benefits: string
  }
  diamond: {
    name: string
    price: number
    benefits: string
  }
}

export interface Admin {
  adminId: string
  username: string
  realName: string
  email: string
  phone?: string
  role: 'super_admin' | 'admin' | 'operator'
  status: 'active' | 'disabled'
  lastLoginTime?: string
  createTime: string
}

export interface AdminParams extends PaginationParams {
  keyword?: string
}

export interface SystemSettings {
  systemName: string
  systemLogo: string
  servicePhone: string
  serviceEmail: string
  companyAddress: string
  defaultServiceRate: number
  minWithdrawAmount: number
  withdrawFeeRate: number
  autoConfirmTime: number
  newOrderNotification: boolean
  withdrawNotification: boolean
  errorNotification: boolean
  notificationEmail: string
}

// 服务者统计相关类型
export interface ProviderDailyStats {
  date: string
  orderCount: number
  orderAmount: number
  earnings: number
  orderTypes: Record<string, number>
}

export interface ProviderMonthlyStats {
  year: number
  month: number
  totalOrders: number
  totalRevenue: number
  totalEarnings: number
  workingDays: number
  dailyStats: ProviderDailyStats[]
}

export interface ProviderStatsUpdate {
  orderAmount: number
  orderType: string
}
