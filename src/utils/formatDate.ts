import dayjs from 'dayjs'

/**
 * 格式化日期时间
 * @param date 日期对象或时间戳
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

/**
 * 格式化日期（只显示日期部分）
 * @param date 日期对象或时间戳
 * @returns 格式化后的日期字符串
 */
export const formatDateOnly = (date: string | number | Date): string => {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化时间（只显示时间部分）
 * @param date 日期对象或时间戳
 * @returns 格式化后的时间字符串
 */
export const formatTimeOnly = (date: string | number | Date): string => {
  return dayjs(date).format('HH:mm:ss')
}

/**
 * 获取相对时间
 * @param date 日期对象或时间戳
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (date: string | number | Date): string => {
  return dayjs(date).fromNow()
}

/**
 * 判断是否是今天
 * @param date 日期对象或时间戳
 * @returns 是否是今天
 */
export const isToday = (date: string | number | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * 判断是否是昨天
 * @param date 日期对象或时间戳
 * @returns 是否是昨天
 */
export const isYesterday = (date: string | number | Date): boolean => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}
