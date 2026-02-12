import type { Category } from '@/types/api'
import type { SelectOption, GroupedSelectOption } from './index'

/**
 * 将分类树结构扁平化为轻量 DTO 数组（性能优化版）
 * 输入：后端返回的 category 树结构
 * 输出：[{ label: '父级 / 子级', value: id }]
 * 
 * ⚠️ 关键：只做一次遍历，避免嵌套循环和重复计算
 */
export function adaptCategoryToSelectOptions(categories: Category[]): SelectOption[] {
  const options: SelectOption[] = []
  
  if (!Array.isArray(categories)) {
    return options
  }
  
  // 🚀 性能关键：单次遍历完成所有工作
  categories.forEach(category => {
    if (category.parentId) {
      // 二级分类：查找父级名称并拼接
      const parent = categories.find(p => p.id === category.parentId)
      if (parent) {
        options.push({
          label: `${parent.name} / ${category.name}`,
          value: category.id
        })
      } else {
        // 找不到父级，直接使用自己的名称
        options.push({
          label: category.name,
          value: category.id
        })
      }
    } else {
      // 一级分类：检查是否有子分类
      const hasChildren = categories.some(c => c.parentId === category.id)
      if (!hasChildren) {
        // 没有子分类的一级分类才添加
        options.push({
          label: category.name,
          value: category.id
        })
      }
    }
  })
  
  return options
}

/**
 * 将分类树结构转换为分组选项
 * 输入：后端返回的 category 树结构
 * 输出：[{ label: '父级', options: [{ label: '子级', value: id }] }]
 */
export function adaptCategoryToGroupedSelectOptions(categories: Category[]): GroupedSelectOption[] {
  const groupedOptions: GroupedSelectOption[] = []
  
  if (!Array.isArray(categories)) {
    return groupedOptions
  }
  
  // 创建分类映射
  const categoryMap = new Map<string, Category>()
  categories.forEach(category => {
    categoryMap.set(category.id, category)
  })
  
  // 分离一级和二级分类
  const firstLevelCategories = categories.filter(category => !category.parentId)
  
  // 为每个一级分类创建分组
  firstLevelCategories.forEach(firstLevel => {
    const secondLevel = categories.filter(category => category.parentId === firstLevel.id)
    
    if (secondLevel.length > 0) {
      groupedOptions.push({
        label: firstLevel.name,
        options: secondLevel.map(category => ({
          label: category.name,
          value: category.id
        }))
      })
    } else {
      // 没有子分类的一级分类单独成组
      groupedOptions.push({
        label: firstLevel.name,
        options: [{
          label: firstLevel.name,
          value: firstLevel.id
        }]
      })
    }
  })
  
  return groupedOptions
}

/**
 * 扁平化分类树结构
 * 输入：树形结构的分类数据
 * 输出：扁平化的分类数组
 */
export function flattenCategoryTree(tree: Category[]): Category[] {
  const result: Category[] = []
  
  if (!Array.isArray(tree)) {
    return result
  }
  
  // 使用迭代代替递归，提高性能
  const stack: Category[] = [...tree]
  
  while (stack.length > 0) {
    const node = stack.pop()!
    
    if (node && node.id) {
      result.push(node)
      if (node.children && Array.isArray(node.children)) {
        // 将子节点逆序压入栈，保持顺序
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i])
        }
      }
    }
  }
  
  return result
}
