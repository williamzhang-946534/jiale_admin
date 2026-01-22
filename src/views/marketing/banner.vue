<template>
  <div class="banner-page">
    <div class="page-header">
      <h2>轮播图管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增轮播图
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="banners" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="image" label="图片" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.image"
              :preview-src-list="[row.image]"
              fit="cover"
              style="width: 60px; height: 40px;"
            />
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
        <el-form-item label="标题" required>
          <el-input v-model="dialog.form.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        <el-form-item label="图片" required>
          <el-upload
            v-model:file-list="dialog.imageFiles"
            :auto-upload="false"
            list-type="picture-card"
            :limit="1"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="dialog.form.linkUrl" placeholder="请输入跳转链接" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dialog.form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dialog.form.status">
            <el-radio label="published">发布</el-radio>
            <el-radio label="draft">草稿</el-radio>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const banners = ref([])

const dialog = reactive({
  visible: false,
  loading: false,
  title: '新增轮播图',
  editingBannerId: '',
  imageFiles: [],
  form: {
    title: '',
    image: '',
    linkUrl: '',
    sortOrder: 0,
    status: 'draft' as 'published' | 'draft'
  }
})

const loadBanners = async () => {
  loading.value = true
  try {
    // TODO: 调用轮播图API
    // const data = await getBanners()
    // banners.value = data
    
    // Mock数据
    banners.value = [
      {
        id: '1',
        title: '双11大促',
        image: 'https://example.com/banner1.jpg',
        linkUrl: '/promotion/double11',
        sortOrder: 1,
        status: 'published',
        createTime: '2023-12-01 10:00:00'
      }
    ]
  } catch (error) {
    console.error('获取轮播图列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  dialog.title = '新增轮播图'
  dialog.editingBannerId = ''
  dialog.form = {
    title: '',
    image: '',
    linkUrl: '',
    sortOrder: 0,
    status: 'draft'
  }
  dialog.imageFiles = []
  dialog.visible = true
}

const editBanner = (banner: any) => {
  dialog.title = '编辑轮播图'
  dialog.editingBannerId = banner.id
  dialog.form = {
    title: banner.title,
    image: banner.image,
    linkUrl: banner.linkUrl,
    sortOrder: banner.sortOrder,
    status: banner.status
  }
  dialog.imageFiles = banner.image ? [{ name: 'image', url: banner.image }] : []
  dialog.visible = true
}

const submitBanner = async () => {
  if (!dialog.form.title) {
    ElMessage.warning('请输入轮播图标题')
    return
  }

  dialog.loading = true
  try {
    // TODO: 调用创建/更新轮播图API
    ElMessage.success(dialog.title.includes('编辑') ? '更新成功' : '创建成功')
    dialog.visible = false
    loadBanners()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const toggleStatus = async (banner: any) => {
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
    
    // TODO: 调用状态更新API
    ElMessage.success(`${action}成功`)
    loadBanners()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

const deleteBanner = async (banner: any) => {
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
    
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadBanners()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style>
