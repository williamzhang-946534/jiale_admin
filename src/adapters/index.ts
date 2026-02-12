/**
 * 适配器层 - 将接口原始数据转换为 el-select 可用的轻量 DTO
 * 只负责数据转换，不包含业务逻辑
 */

export interface SelectOption {
  label: string
  value: string | number
}

export interface GroupedSelectOption {
  label: string
  options: SelectOption[]
}
