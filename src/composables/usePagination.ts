import { ref, reactive, computed } from 'vue'

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
}

export interface PaginationResult {
  pagination: PaginationConfig
  handleSizeChange: (size: number) => void
  handleCurrentChange: (current: number) => void
  resetPagination: () => void
}

/**
 * 分页组合函数
 * @param initialPage 初始页码
 * @param initialPageSize 初始每页条数
 * @returns 分页相关状态和方法
 */
export const usePagination = (
  initialPage = 1,
  initialPageSize = 20
): PaginationResult => {
  const pagination = reactive<PaginationConfig>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
    background: true,
  })

  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.page = 1 // 重置到第一页
  }

  const handleCurrentChange = (current: number) => {
    pagination.page = current
  }

  const resetPagination = () => {
    pagination.page = initialPage
    pagination.pageSize = initialPageSize
    pagination.total = 0
  }

  return {
    pagination,
    handleSizeChange,
    handleCurrentChange,
    resetPagination,
  }
}
