import { get, post } from '@/utils/request'
import type { Withdrawal, WithdrawalListParams, PaginationResponse, FinanceStats, FinanceChart } from '@/types/api'

/**
 * 获取财务统计数据
 */
export const getFinanceStats = () => {
  return get<FinanceStats>('/dashboard/stats')
}

/**
 * 获取财务图表数据
 */
export const getFinanceChart = (params: { range: string }) => {
  return get<FinanceChart>('/dashboard/charts', params)
}

/**
 * 获取提现申请列表
 */
export const getWithdrawals = (params?: WithdrawalListParams) => {
  return get<PaginationResponse<Withdrawal>>('/finance/withdrawals', params)
}

/**
 * 审核通过提现申请
 */
export const approveWithdrawal = (id: number) => {
  return post(`/finance/withdrawals/${id}/audit`, { action: 'approve' })
}

/**
 * 拒绝提现申请
 */
export const rejectWithdrawal = (id: number, params: { reason: string }) => {
  return post(`/finance/withdrawals/${id}/audit`, { action: 'reject', ...params })
}
