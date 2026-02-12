import type { Service } from '@/types/api'
import type { SelectOption } from './index'

/**
 * 将服务列表转换为轻量 DTO 数组
 * 输入：服务列表
 * 输出：[{ label: '服务名称', value: id }]
 */
export function adaptServiceToSelectOptions(services: Service[]): SelectOption[] {
  const options: SelectOption[] = []
  
  if (!Array.isArray(services)) {
    return options
  }
  
  services.forEach(service => {
    if (service && service.id && service.name) {
      options.push({
        label: service.name,
        value: service.id
      })
    }
  })
  
  return options
}

/**
 * 将服务类型枚举转换为选项数组
 * 输入：ServiceType 枚举
 * 输出：[{ label: '类型名称', value: '类型值' }]
 */
export function adaptServiceTypeToSelectOptions(): SelectOption[] {
  return [
    { label: '保洁清洗', value: 'cleaning' },
    { label: '母婴护理', value: 'nanny' },
    { label: '维修安装', value: 'repair' },
    { label: '搬家运输', value: 'moving' },
    { label: '其他服务', value: 'other' }
  ]
}
