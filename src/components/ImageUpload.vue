<template>
  <div class="image-upload">
    <el-upload
      v-bind="uploadProps"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :file-list="fileList"
      :list-type="listType"
      :disabled="disabled"
      class="upload-component"
    >
      <template v-if="listType === 'picture-card'">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">{{ uploadText }}</div>
      </template>
      <template v-else>
        <el-button type="primary" :disabled="disabled">
          <el-icon><Upload /></el-icon>
          {{ uploadText }}
        </el-button>
      </template>
      
      <template #tip>
        <div class="upload-tip" v-if="tip">
          {{ tip }}
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import type { UploadProps, UploadUserFile, UploadFiles } from 'element-plus'
import { uploadSingle, uploadMultiple, deleteFile } from '@/api/modules/upload'
import type { UploadResponse, UploadType } from '@/types/api'
import { UPLOAD_LIMITS } from '@/types/api'

interface Props {
  modelValue?: string | string[]
  uploadType?: UploadType
  listType?: 'text' | 'picture' | 'picture-card'
  multiple?: boolean
  limit?: number
  disabled?: boolean
  accept?: string
  maxSize?: number
  tip?: string
  uploadText?: string
  customUpload?: (file: File) => Promise<UploadResponse>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  uploadType: 'admin/banners',
  listType: 'picture-card',
  multiple: false,
  limit: 1,
  disabled: false,
  accept: 'image/*',
  maxSize: 5 * 1024 * 1024, // 5MB
  uploadText: '上传图片',
  tip: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'success': [response: UploadResponse | UploadResponse[]]
  'error': [error: Error]
  'remove': [file: UploadUserFile, index: number]
}>()

const fileList = ref<UploadUserFile[]>([])
const urlToUidMap = new Map<string, number>() // 用于保持URL和UID的映射

// 根据上传类型获取限制配置
const uploadLimits = computed(() => {
  switch (props.uploadType) {
    case 'mobile/avatars':
      return UPLOAD_LIMITS.avatar
    case 'mobile/services':
    case 'admin/categories':
    case 'admin/configs':
      return UPLOAD_LIMITS.service
    case 'admin/banners':
      return UPLOAD_LIMITS.banner
    case 'mobile/feedback':
      return UPLOAD_LIMITS.feedback
    case 'temp':
      return UPLOAD_LIMITS.certification
    default:
      return UPLOAD_LIMITS.banner
  }
})

// 上传组件配置
const uploadProps = computed<UploadProps>(() => ({
  action: '#', // 使用自定义上传
  autoUpload: true, // 改为true以确保文件列表正确显示
  multiple: props.multiple,
  limit: props.limit,
  accept: props.accept || uploadLimits.value.acceptTypes.join(','),
  disabled: props.disabled,
  httpRequest: customRequest
}))

// 自定义上传请求
const customRequest = async (options: any) => {
  const { file, onSuccess, onError } = options
  
  try {
    let response: UploadResponse | UploadResponse[]
    
    if (props.customUpload) {
      response = await props.customUpload(file)
    } else if (props.uploadType === 'mobile/services') {
      const { uploadServiceImage } = await import('@/api/modules/upload')
      response = await uploadServiceImage(file)
    } else if (props.multiple) {
      response = await uploadMultiple([file], props.uploadType)
    } else {
      response = await uploadSingle(file, props.uploadType)
    }
    
    // 直接更新modelValue
    if (props.multiple) {
      let url: string = ''
      
      if (Array.isArray(response) && response.length > 0) {
        url = response[0].url || response[0]
      } else if (response && response.url) {
        url = response.url
      } else if (typeof response === 'string') {
        url = response
      }
      
      if (url) {
        const currentUrls = Array.isArray(props.modelValue) ? props.modelValue : []
        const newUrls = [...currentUrls, url]
        emit('update:modelValue', newUrls)
      }
    } else {
      let url: string = ''
      
      if (Array.isArray(response) && response.length > 0) {
        url = response[0].url || response[0]
      } else if (response && response.url) {
        url = response.url
      } else if (typeof response === 'string') {
        url = response
      }
      
      emit('update:modelValue', url)
    }
    
    onSuccess(response)
    emit('success', response)
  } catch (error) {
    onError(error)
    emit('error', error as Error)
  }
}

// 上传前验证
const beforeUpload = (file: File) => {
  // 检查文件类型
  const acceptTypes = props.accept || uploadLimits.value.acceptTypes.join(',')
  const isAccepted = acceptTypes.split(',').some(type => {
    if (type.startsWith('image/')) {
      return file.type.startsWith('image/')
    }
    return file.type === type.trim()
  })
  
  if (!isAccepted) {
    ElMessage.error(`只支持 ${acceptTypes} 格式的文件`)
    return false
  }
  
  // 检查文件大小
  const maxSize = props.maxSize || uploadLimits.value.maxSize
  const isSizeValid = file.size <= maxSize
  
  if (!isSizeValid) {
    const sizeMB = (maxSize / 1024 / 1024).toFixed(1)
    ElMessage.error(`文件大小不能超过 ${sizeMB}MB`)
    return false
  }
  
  return true
}

// 上传成功处理
const handleSuccess = (response: any, uploadFile: any) => {
  ElMessage.success('上传成功')
}

// 上传失败处理
const handleError = (error: any) => {
  ElMessage.error(error.message || '上传失败')
}

// 移除文件处理
const handleRemove = async (file: UploadUserFile, uploadFiles: UploadFiles) => {
  try {
    // 如果有文件key，调用删除接口
    if (file.response?.key) {
      await deleteFile(file.response.key)
    }
    
    // 清理URL映射
    if (file.url) {
      urlToUidMap.delete(file.url)
    }
    
    // 更新modelValue
    if (props.multiple) {
      const urls = Array.isArray(props.modelValue) ? props.modelValue : []
      const index = urls.findIndex(url => url === file.url)
      if (index > -1) {
        const newUrls = [...urls]
        newUrls.splice(index, 1)
        emit('update:modelValue', newUrls)
      }
    } else {
      emit('update:modelValue', '')
    }
    
    emit('remove', file, uploadFiles.indexOf(file))
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 超出限制处理
const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

// 监听modelValue变化，更新fileList
watch(() => props.modelValue, (newValue) => {
  if (Array.isArray(newValue)) {
    fileList.value = newValue.map((url, index) => {
      // 获取或生成稳定的UID
      let uid = urlToUidMap.get(url)
      if (!uid) {
        uid = Date.now() + index
        urlToUidMap.set(url, uid)
      }
      
      return {
        name: `image-${index}`,
        url,
        uid,
        status: 'success'
      }
    })
  } else if (newValue && typeof newValue === 'string' && newValue.trim()) {
    const url = newValue.trim()
    let uid = urlToUidMap.get(url)
    if (!uid) {
      uid = Date.now()
      urlToUidMap.set(url, uid)
    }
    
    fileList.value = [{
      name: 'image',
      url,
      uid,
      status: 'success'
    }]
  } else {
    fileList.value = []
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.image-upload {
  .upload-component {
    :deep(.el-upload--picture-card) {
      width: 120px;
      height: 120px;
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        
        .upload-icon {
          color: #409eff;
        }
        
        .upload-text {
          color: #409eff;
        }
      }
      
      .upload-icon {
        font-size: 28px;
        color: #8c939d;
        margin-bottom: 8px;
      }
      
      .upload-text {
        font-size: 12px;
        color: #8c939d;
        text-align: center;
        line-height: 1.2;
      }
    }
    
    :deep(.el-upload-list--picture-card) {
      .el-upload-list__item {
        width: 120px;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
  
  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
    line-height: 1.4;
  }
}
</style>
