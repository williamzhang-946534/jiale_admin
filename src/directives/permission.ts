import { Directive } from 'vue'
import { useAuthStore } from '@/store/auth'

/**
 * 权限指令 v-permission
 * 使用方式：v-permission="['user:edit', 'user:delete']"
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding) {
    const authStore = useAuthStore()
    const { value } = binding

    if (value && Array.isArray(value)) {
      const hasPermission = authStore.hasPermission(value)
      if (!hasPermission) {
        el.style.display = 'none'
      }
    }
  },
}
