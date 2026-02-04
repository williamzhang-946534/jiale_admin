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
  // 如果有parentId，需要验证父分类是否为一级分类
  if (data.parentId) {
    // 这里可以添加前端验证，但主要验证应该在后端进行
    console.log('Creating subcategory with parent:', data.parentId)
  }
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
