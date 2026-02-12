<template>
  <div class="banner-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增轮播图
        </el-button>
        <el-button @click="loadBanners" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 120px" @change="loadBanners">
          <el-option label="全部" value="" />
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>
      </div>
    </div>
    
    <el-card>
      <el-table :data="banners" v-loading="loading" stripe>
        <el-table-column prop="imageUrl" label="图片" width="200">
          <template #default="{ row }">
            <div 
              class="banner-image-wrapper"
              @click="openImagePreview([row.imageUrl], 0)"
            >
              <el-image
                :src="row.imageUrl"
                fit="cover"
                style="width: 60px; height: 40px;"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="linkUrl" label="跳转链接" />
        <el-table-column prop="sortOrder" label="排序" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editBanner(row)">
              编辑
            </el-button>
            <el-button 
              :type="row.status === 'published' ? 'warning' : 'success'" 
              size="small" 
              @click="toggleStatus(row)"
            >
              {{ row.status === 'published' ? '下线' : '发布' }}
            </el-button>
            <el-button link type="danger" size="small" @click="deleteBanner(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 轮播图编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" label-width="100px">
        <el-form-item label="图片" required>
          <ImageUpload 
            :key="`banner-${dialog.editingBannerId || 'create'}-${Date.now()}`"
            v-model="dialog.form.imageUrl"
            upload-type="admin/banners"
            :limit="1"
            tip="支持jpg、png、gif、webp格式，文件大小不超过5MB"
            upload-text="上传轮播图"
            :custom-upload="handleBannerUpload"
          />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="dialog.form.linkUrl" placeholder="请输入跳转链接" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dialog.form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="dialog.form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="dialog.form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dialog.form.status">
            <el-radio value="published">发布</el-radio>
            <el-radio value="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitBanner">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览组件 -->
    <ImagePreview 
      v-model:visible="imagePreviewVisible"
      :images="previewImages"
      :initial-index="previewIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import ImageUpload from '@/components/ImageUpload.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { uploadBanner } from '@/api/modules/upload'
import { 
  getBanners, 
  createBanner, 
  updateBanner, 
  updateBannerStatus, 
  deleteBanner as deleteBannerApi 
} from '@/api/modules/marketing'
import type { Banner } from '@/types/api'

const loading = ref(false)
const banners = ref<Banner[]>([])

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)
const statusFilter = ref('')

// 自定义轮播图上传函数
const handleBannerUpload = async (file: File) => {
  return await uploadBanner(file)
}

const dialog = reactive({
  visible: false,
  loading: false,
  title: '新增轮播图',
  editingBannerId: '',
  form: {
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    startTime: '',
    endTime: '',
    status: 'draft' as 'published' | 'draft'
  }
})

const loadBanners = async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const data = await getBanners(params)
    banners.value = data.list || data || []
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    ElMessage.error('获取轮播图列表失败')
    banners.value = []
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  dialog.title = '新增轮播图'
  dialog.editingBannerId = ''
  dialog.form = {
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    startTime: '',
    endTime: '',
    status: 'draft'
  }
  dialog.visible = true
}

const editBanner = async (banner: Banner) => {
  dialog.title = '编辑轮播图'
  dialog.editingBannerId = banner.id.toString()
  
  // 先设置表单数据
  dialog.form = {
    imageUrl: banner.imageUrl || '',
    linkUrl: banner.linkUrl || '',
    sortOrder: banner.sortOrder || 0,
    startTime: banner.startTime || '',
    endTime: banner.endTime || '',
    status: banner.status || 'draft'
  }
  
  // 等待下一个tick再显示对话框
  await nextTick()
  dialog.visible = true
}

const submitBanner = async () => {
  if (!dialog.form.imageUrl) {
    ElMessage.warning('请上传轮播图')
    return
  }

  dialog.loading = true
  try {
    const formData = {
      imageUrl: dialog.form.imageUrl,
      linkUrl: dialog.form.linkUrl,
      sortOrder: dialog.form.sortOrder,
      startTime: dialog.form.startTime ? 
        Math.floor(new Date(dialog.form.startTime).getTime() / 1000) : 0,
      endTime: dialog.form.endTime ? 
        Math.floor(new Date(dialog.form.endTime).getTime() / 1000) : 0,
      status: dialog.form.status
    }

    console.log('提交轮播图数据:', formData)
    console.log('编辑模式:', dialog.title.includes('编辑'), 'ID:', dialog.editingBannerId)

    if (dialog.title.includes('编辑') && dialog.editingBannerId) {
      // 编辑模式
      console.log('发送更新请求到:', `/marketing/banners/${dialog.editingBannerId}`)
      await updateBanner(dialog.editingBannerId, formData)
      ElMessage.success('更新成功')
    } else {
      // 新增模式
      console.log('发送创建请求到:', '/marketing/banners')
      await createBanner(formData)
      ElMessage.success('创建成功')
    }
    
    dialog.visible = false
    loadBanners()
  } catch (error) {
    console.error('轮播图操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const toggleStatus = async (banner: Banner) => {
  const newStatus = banner.status === 'published' ? 'draft' : 'published'
  const action = newStatus === 'published' ? '发布' : '下线'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}轮播图 "${banner.title}" 吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await updateBannerStatus(banner.id.toString(), newStatus)
    ElMessage.success(`${action}成功`)
    loadBanners()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态更新失败:', error)
      ElMessage.error(`${action}失败`)
    }
  }
}

const deleteBanner = async (banner: Banner) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除轮播图 "${banner.title}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteBannerApi(banner.id.toString())
    ElMessage.success('删除成功')
    loadBanners()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 图片预览相关方法
const openImagePreview = (images: string[], index: number = 0) => {
  if (!images || images.length === 0) return
  
  previewImages.value = images
  previewIndex.value = index
  imagePreviewVisible.value = true
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.banner-image-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
  overflow: hidden;
  display: inline-block;
}

.banner-image-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
