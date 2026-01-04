import { get, post } from '@/utils/request'
import type { Withdrawal, WithdrawalListParams, WithdrawalAuditParams, PaginationResponse } from '@/types/api'

/**
 * 获取提现申请列表
 */
export const getWithdrawals = (params?: WithdrawalListParams) => {
  return get<PaginationResponse<Withdrawal>>('/finance/withdrawals', params)
}

/**
 * 审核提现申请
 */
export const auditWithdrawal = (id: number, params: WithdrawalAuditParams) => {
  return post(`/finance/withdrawals/${id}/audit`, params)
}
