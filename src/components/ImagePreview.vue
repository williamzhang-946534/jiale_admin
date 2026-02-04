<template>
  <!-- 自定义图片预览组件 -->
  <div v-if="visible" class="image-preview-modal" @click="closePreview">
    <div class="preview-container" @click.stop>
      <!-- 关闭按钮 -->
      <div class="preview-header">
        <div class="image-info">
          <span class="current-index">{{ currentIndex + 1 }}</span>
          <span class="separator">/</span>
          <span class="total-count">{{ images.length }}</span>
        </div>
        <div class="preview-actions">
          <el-button 
            circle 
            size="small" 
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全屏' : '全屏'"
          >
            <el-icon><FullScreen /></el-icon>
          </el-button>
          <el-button 
            circle 
            size="small" 
            @click="downloadCurrentImage"
            title="下载"
          >
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button 
            circle 
            size="small" 
            @click="closePreview"
            title="关闭"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 图片展示区域 -->
      <div class="preview-body">
        <!-- 左箭头 -->
        <div 
          v-if="images.length > 1"
          class="nav-arrow nav-left"
          @click="prevImage"
        >
          <el-icon><ArrowLeft /></el-icon>
        </div>

        <!-- 图片 -->
        <div class="image-display">
          <img 
            :src="images[currentIndex]" 
            :alt="`图片 ${currentIndex + 1}`"
            class="preview-image"
            @load="onImageLoad"
            @error="onImageError"
          />
          <div v-if="loading" class="image-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>

        <!-- 右箭头 -->
        <div 
          v-if="images.length > 1"
          class="nav-arrow nav-right"
          @click="nextImage"
        >
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 缩略图列表 -->
      <div v-if="images.length > 1" class="thumbnail-strip">
        <div class="thumbnail-container">
          <div 
            v-for="(image, index) in images"
            :key="index"
            class="thumbnail-item"
            :class="{ active: index === currentIndex }"
            @click="goToImage(index)"
          >
            <img 
              :src="image" 
              :alt="`缩略图 ${index + 1}`"
              class="thumbnail"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  FullScreen, Download, Close, ArrowLeft, 
  ArrowRight, Loading 
} from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  images: string[]
  initialIndex?: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})

const emit = defineEmits<Emits>()

const currentIndex = ref(props.initialIndex)
const loading = ref(false)
const isFullscreen = ref(false)

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentIndex.value = props.initialIndex
    loading.value = true
    isFullscreen.value = false
    document.addEventListener('keydown', handleKeyPress)
  } else {
    document.removeEventListener('keydown', handleKeyPress)
  }
})

const closePreview = () => {
  emit('update:visible', false)
}

const prevImage = () => {
  if (props.images.length <= 1) return
  currentIndex.value = currentIndex.value === 0 
    ? props.images.length - 1 
    : currentIndex.value - 1
  loading.value = true
}

const nextImage = () => {
  if (props.images.length <= 1) return
  currentIndex.value = (currentIndex.value + 1) % props.images.length
  loading.value = true
}

const goToImage = (index: number) => {
  currentIndex.value = index
  loading.value = true
}

const onImageLoad = () => {
  loading.value = false
}

const onImageError = () => {
  loading.value = false
  ElMessage.error('图片加载失败')
}

const toggleFullscreen = () => {
  const previewContainer = document.querySelector('.preview-container') as HTMLElement
  if (!isFullscreen.value) {
    if (previewContainer.requestFullscreen) {
      previewContainer.requestFullscreen()
    }
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    isFullscreen.value = false
  }
}

const downloadCurrentImage = async () => {
  try {
    const imageUrl = props.images[currentIndex.value]
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image_${currentIndex.value + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (event.key) {
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
    case 'Escape':
      closePreview()
      break
  }
}
</script>

<style scoped>
/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.preview-container {
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  max-height: 800px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.image-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
}

.current-index {
  font-weight: 600;
  color: #409eff;
}

.separator {
  color: #666;
}

.total-count {
  color: #ccc;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  font-size: 20px;
  z-index: 10;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.nav-left {
  left: 20px;
}

.nav-right {
  right: 20px;
}

.image-display {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 14px;
}

.image-loading .el-icon {
  font-size: 32px;
}

.thumbnail-strip {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
}

.thumbnail-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  justify-content: center;
  max-width: 100%;
}

.thumbnail-item {
  flex: 0 0 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.thumbnail-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.thumbnail-item.active {
  border-color: #409eff;
  transform: scale(1.1);
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 滚动条样式 */
.thumbnail-container::-webkit-scrollbar {
  height: 4px;
}

.thumbnail-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.thumbnail-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.thumbnail-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-container {
    width: 95vw;
    height: 95vh;
  }
  
  .preview-header {
    padding: 12px 16px;
  }
  
  .preview-body {
    padding: 12px;
  }
  
  .nav-arrow {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .nav-left {
    left: 12px;
  }
  
  .nav-right {
    right: 12px;
  }
  
  .thumbnail-item {
    flex: 0 0 50px;
    height: 50px;
  }
}

/* 全屏模式 */
.preview-container:fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

.preview-container:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

.preview-container:-moz-full-screen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

.preview-container:-ms-fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  border-radius: 0;
}
</style>
