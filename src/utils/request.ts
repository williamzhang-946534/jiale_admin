import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'

// 创建 axios 实例
// 根据API文档：管理员后台接口路径是 /api/admin/v1/...
const request: AxiosInstance = axios.create({
  baseURL: '/api/admin/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    // 自动携带 token
    if (authStore.token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    // 调试：打印请求URL
    console.log('📤 API请求:', config.method?.toUpperCase(), (config.baseURL || '') + (config.url || ''), config.params)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response

    // 统一处理响应
    if (data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    return response
  },
  (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          // 未授权，跳转到登录页
          ElMessage.error('登录已过期，请重新登录')
          // 这里可以调用登出逻辑
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          const requestUrl = response.config?.url || '未知'
          ElMessage.error(`请求地址不存在: ${requestUrl}`)
          console.error('❌ 404错误 - 请求URL:', response.config?.baseURL + response.config?.url)
          console.error('❌ 完整请求信息:', {
            method: response.config?.method,
            url: response.config?.url,
            baseURL: response.config?.baseURL,
            fullURL: response.config?.baseURL + response.config?.url,
          })
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else {
      // 网络错误（可能是后端服务器未启动）
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        ElMessage.error('无法连接到后端服务器，请确保后端服务已启动（端口 3000）')
      } else {
        ElMessage.error('网络连接失败，请检查网络设置')
      }
    }

    return Promise.reject(error)
  }
)

// 导出请求方法
export default request

// 封装常用请求方法
export const get = <T = any>(url: string, params?: any, config?: any): Promise<T> => {
  const requestConfig = { ...config, params }
  return request.get(url, requestConfig).then((res) => res.data.data)
}

export const post = <T = any>(
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  return request.post(url, data, config).then((res) => res.data.data)
}

export const put = <T = any>(
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  return request.put(url, data, config).then((res) => res.data.data)
}

export const patch = <T = any>(
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  return request.patch(url, data, config).then((res) => res.data.data)
}

export const del = <T = any>(url: string, config?: any): Promise<T> => {
  return request.delete(url, config).then((res) => res.data.data)
}
