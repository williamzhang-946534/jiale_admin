import { ElMessageBox } from 'element-plus'

export interface ConfirmOptions {
  title?: string
  message: string
  type?: 'success' | 'info' | 'warning' | 'error'
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonClass?: string
}

/**
 * 确认对话框组合函数
 * @returns 确认方法
 */
export const useConfirm = () => {
  const confirm = async (options: ConfirmOptions): Promise<boolean> => {
    try {
      await ElMessageBox.confirm(
        options.message,
        options.title || '提示',
        {
          confirmButtonText: options.confirmButtonText || '确定',
          cancelButtonText: options.cancelButtonText || '取消',
          type: options.type || 'warning',
          confirmButtonClass: options.confirmButtonClass || 'el-button--danger',
        }
      )
      return true
    } catch {
      return false
    }
  }

  return {
    confirm,
  }
}
