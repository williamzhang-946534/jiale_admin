import { get } from '@/utils/request'
import type { DashboardStats, DashboardChart, DashboardChartParams } from '@/types/api'

/**
 * 获取控制台统计数据
 */
export const getDashboardStats = () => {
  return get<DashboardStats>('/dashboard/stats')
}

/**
 * 获取图表数据
 */
export const getDashboardCharts = (params: DashboardChartParams) => {
  return get<DashboardChart>('/dashboard/charts', params)
}
