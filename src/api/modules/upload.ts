import { post } from '@/utils/request'
import type { UploadResponse, UploadType } from '@/types/api'

/**
 * 通用单文件上传
 */
export const uploadSingle = (
  file: File,
  type: UploadType,
  originalName?: string
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  if (originalName) {
    formData.append('originalName', originalName)
  }

  return post<UploadResponse>('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 通用多文件上传
 */
export const uploadMultiple = (
  files: File[],
  type: UploadType,
  originalName?: string,
  maxCount?: number
) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  formData.append('type', type)
  if (originalName) {
    formData.append('originalName', originalName)
  }
  if (maxCount) {
    formData.append('maxCount', maxCount.toString())
  }

  return post<UploadResponse[]>('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 获取STS临时凭证（用于前端直传）
 */
export const getStsCredentials = (prefix: string, expire = '3600') => {
  return post<{
    accessKeyId: string
    accessKeySecret: string
    securityToken: string
    expiration: string
  }>('/upload/sts-credentials', {
    prefix,
    expire,
  })
}

/**
 * 删除文件
 */
export const deleteFile = (key: string) => {
  return post('/upload/delete', { key })
}

/**
 * 批量删除文件
 */
export const batchDeleteFiles = (keys: string[]) => {
  return post('/upload/batch-delete', { keys })
}

// ===== 专用上传接口 =====

/**
 * 上传轮播图
 */
export const uploadBanner = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return post<UploadResponse>('/marketing/banners/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 上传服务图片
 */
export const uploadServiceImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return post<UploadResponse>('/services/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 批量上传服务图片
 */
export const uploadServiceImages = (files: File[]) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  return post<UploadResponse[]>('/services/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 上传特惠图片
 */
export const uploadSpecialOfferImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return post<UploadResponse>('/marketing/special-offers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 上传分类图片
 */
export const uploadCategoryImage = (file: File) => {
  return uploadSingle(file, 'admin/categories')
}

/**
 * 上传配置文件
 */
export const uploadConfigFile = (file: File) => {
  return uploadSingle(file, 'admin/configs')
}

/**
 * 上传图标
 */
export const uploadIcon = (file: File) => {
  return uploadSingle(file, 'common/icons')
}

/**
 * 上传静态文件
 */
export const uploadStaticFile = (file: File) => {
  return uploadSingle(file, 'common/static')
}

/**
 * 上传临时文件
 */
export const uploadTempFile = (file: File) => {
  return uploadSingle(file, 'temp')
}
