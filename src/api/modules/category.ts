import { get, post, put, del } from '@/utils/request'
import type { Category, CategoryListParams, PaginationResponse } from '@/types/api'

/**
 * 获取分类列表
 */
export const getCategories = (params?: CategoryListParams) => {
  return get<PaginationResponse<Category>>('/categories', params)
}

/**
 * 获取分类树
 */
export const getCategoryTree = () => {
  return get<Category[]>('/categories')
}

/**
 * 新增分类
 */
export const createCategory = (data: Omit<Category, 'id' | 'children'>) => {
  return post<Category>('/categories', data)
}

/**
 * 更新分类
 */
export const updateCategory = (id: string, data: Partial<Category>) => {
  return put<Category>(`/categories/${id}`, data)
}

/**
 * 删除分类
 */
export const deleteCategory = (id: string) => {
  return del(`/categories/${id}`)
}
