<template>
  <div class="service-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="query.keyword"
          placeholder="搜索服务名称"
          clearable
          style="width: 220px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.categoryId"
          placeholder="选择分类"
          clearable
          style="width: 200px"
          @change="handleSearch"
        >
          <el-option-group
            v-for="(group, groupName) in groupedCategories"
            :key="groupName"
            :label="groupName"
          >
            <el-option
              v-for="category in group"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-option-group>
        </el-select>
        <el-select
          v-model="query.status"
          placeholder="状态"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="已上架" value="active" />
          <el-option label="已下架" value="inactive" />
        </el-select>
        <el-button type="primary" @click="openCreate">新增服务</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="fetchServices" :loading="loading">刷新</el-button>
      </div>
    </div>

    <!-- 服务列表 -->
    <div class="table-container">
      <el-table :data="services" v-loading="loading" stripe>
        <el-table-column prop="name" label="服务名称" min-width="200">
          <template #default="{ row }">
            <div class="service-name">
              <div 
                v-if="row.images && row.images.length > 0"
                class="service-image-wrapper"
                @click="openImagePreview(row.images, 0)"
              >
                <el-image
                  :src="row.images[0]"
                  fit="cover"
                  class="service-image"
                />
                <div class="image-overlay">
                  <el-icon class="preview-icon"><ZoomIn /></el-icon>
                  <span class="image-count">{{ row.images.length }}张</span>
                </div>
              </div>
              <div v-else class="no-image">
                <el-icon><Picture /></el-icon>
              </div>
              <div class="service-info">
                <div class="name">{{ row.name }}</div>
                <div class="tags">
                  <el-tag
                    v-for="tag in row.tags?.slice(0, 2)"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="价格" width="120" align="center">
          <template #default="{ row }">
            <div class="price">
              <span class="amount">¥{{ row.price }}</span>
              <span class="unit">/{{ row.unit }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="categoryName" label="分类" width="120" align="center" />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="updateServiceStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <div class="description-cell">
              {{ row.description || '暂无描述' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editService(row)">
              编辑
            </el-button>
            <el-button link type="success" size="small" @click="viewService(row)">
              详情
            </el-button>
            <el-button link type="danger" size="small" @click="deleteService(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 服务编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务名称" required>
              <el-input v-model="dialog.form.name" placeholder="请输入服务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" required>
              <el-select v-model="dialog.form.categoryId" placeholder="选择分类" style="width: 100%">
                <el-option-group
                  v-for="(group, groupName) in groupedCategories"
                  :key="groupName"
                  :label="groupName"
                >
                  <el-option
                    v-for="category in group"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="价格" required>
              <el-input-number
                v-model="dialog.form.price"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计价单位" required>
              <el-input v-model="dialog.form.unit" placeholder="如：小时、次" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-radio-group v-model="dialog.form.status">
                <el-radio value="active">上架</el-radio>
                <el-radio value="inactive">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="服务图片">
          <ImageUpload 
            v-model="dialog.form.images"
            upload-type="mobile/services"
            :multiple="true"
            :limit="5"
            tip="支持jpg、png、gif、webp格式，文件大小不超过5MB"
            upload-text="上传服务图片"
          />
        </el-form-item>

        <el-form-item label="服务标签">
          <el-tag
            v-for="tag in dialog.form.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            style="width: 100px"
            @keyup.enter="addTag"
            @blur="addTag"
          />
          <el-button v-else size="small" @click="showTagInput">+ 添加标签</el-button>
        </el-form-item>

        <el-form-item label="服务描述">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入服务描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitService">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 服务详情对话框 -->
    <el-dialog v-model="detailVisible" title="服务详情" width="600px">
      <div v-if="currentService" class="service-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="服务名称">{{ currentService.name }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥{{ currentService.price }}/{{ currentService.unit }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentService.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentService.status === 'active' ? 'success' : 'danger'">
              {{ currentService.status === 'active' ? '已上架' : '已下架' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" span="2">{{ currentService.createTime }}</el-descriptions-item>
          <el-descriptions-item label="服务描述" span="2">{{ currentService.description }}</el-descriptions-item>
          <el-descriptions-item label="服务标签" span="2">
            <el-tag
              v-for="tag in currentService.tags"
              :key="tag"
              size="small"
              style="margin-right: 8px"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentService.images && currentService.images.length > 0" class="service-images">
          <h4>服务图片</h4>
          <div class="image-grid">
            <div 
              v-for="(image, index) in currentService.images" 
              :key="index"
              class="image-item"
              @click="openImagePreview(currentService.images, index)"
            >
              <el-image
                :src="image"
                fit="cover"
                class="detail-image"
              />
              <div class="image-overlay">
                <el-icon class="preview-icon"><ZoomIn /></el-icon>
                <span class="image-index">{{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import { ZoomIn, Picture } from '@element-plus/icons-vue'
import ImageUpload from '@/components/ImageUpload.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getServices, createService, updateService, updateServiceStatus, deleteService as deleteServiceApi } from '@/api/modules/service'
import { getCategories, getCategoryTree } from '@/api/modules/category'
import type { Service, Category } from '@/types/api'

const tagInputRef = ref<InstanceType<typeof ElInput>>()

const loading = ref(false)
const services = ref<Service[]>([])
const categories = ref<Category[]>([])
const currentService = ref<Service | null>(null)
const detailVisible = ref(false)

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 计算属性：按一级分类分组显示二级分类
const groupedCategories = computed(() => {
  const groups: { [key: string]: Category[] } = {}
  
  // 获取所有一级分类
  const firstLevelCategories = categories.value.filter(category => !category.parentId)
  
  // 为每个一级分类找到对应的二级分类
  firstLevelCategories.forEach(firstLevel => {
    const secondLevel = categories.value.filter(category => 
      category.parentId === firstLevel.id
    )
    if (secondLevel.length > 0) {
      groups[firstLevel.name] = secondLevel
    }
  })
  
  return groups
})

// 计算属性：只显示二级分类（有parentId的分类）
const secondLevelCategories = computed(() => {
  return categories.value.filter(category => category.parentId && category.parentId !== null)
})

const query = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialog = reactive({
  visible: false,
  loading: false,
  title: '',
  editingServiceId: '', // 添加当前编辑的服务ID
  form: {
    name: '',
    categoryId: '',
    price: 0,
    unit: '',
    images: [] as string[],
    tags: [] as string[],
    description: '',
    status: 'active' as 'active' | 'inactive'
  }
})

const tagInputVisible = ref(false)
const tagInputValue = ref('')

const fetchServices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: query.keyword || undefined,
      categoryId: query.categoryId || undefined,
      status: query.status || undefined
    }
    
    const data = await getServices(params)
    console.log('服务API返回数据:', data)
    
    // 处理不同的数据结构
    let serviceList = []
    if (data && data.data && Array.isArray(data.data)) {
      // API返回格式: { data: [] }
      serviceList = data.data
    } else if (data && data.list && Array.isArray(data.list)) {
      // 标准分页格式: { list: [] }
      serviceList = data.list
    } else if (Array.isArray(data)) {
      // 直接返回数组
      serviceList = data
    } else {
      console.error('服务数据结构异常:', data)
      ElMessage.error('服务数据格式不正确')
      serviceList = []
    }
    
    services.value = serviceList.map(service => ({
      ...service,
      categoryName: getCategoryName(service.categoryId),
      createTime: service.createdAt || new Date().toLocaleString()
    }))
    
    console.log('处理后的服务数据:', services.value)
    
    // 设置分页总数
    pagination.total = data.total || serviceList.length
    
  } catch (error) {
    console.error('获取服务列表失败:', error)
    ElMessage.error('获取服务列表失败')
    services.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    // 使用getCategoryTree获取树形结构数据
    const data = await getCategoryTree()
    
    // 处理不同的数据结构
    let categoryList = []
    if (Array.isArray(data)) {
      categoryList = data
    } else if (data && data.data && Array.isArray(data.data)) {
      categoryList = data.data
    } else if (data && data.list && Array.isArray(data.list)) {
      categoryList = data.list
    } else {
      console.error('分类数据结构异常:', data)
      categoryList = []
    }
    
    // 如果是树形结构，需要扁平化处理
    if (categoryList.length > 0 && (categoryList[0].children || categoryList[0].parentId === undefined)) {
      categories.value = flattenCategories(categoryList)
    } else {
      categories.value = categoryList
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    // Mock数据
    categories.value = [
      { id: 'cleaning', name: '保洁清洗', parentId: null },
      { id: 'daily_clean', name: '日常保洁', parentId: 'cleaning' },
      { id: 'deep_clean', name: '深度保洁', parentId: 'cleaning' },
      { id: 'nanny', name: '母婴护理', parentId: null },
      { id: 'gold_matron', name: '金牌月嫂', parentId: 'nanny' }
    ]
  }
}

const flattenCategories = (tree: Category[]): Category[] => {
  const result: Category[] = []
  
  if (!Array.isArray(tree)) {
    console.warn('flattenCategories: 输入不是数组', tree)
    return result
  }
  
  const traverse = (nodes: Category[]) => {
    if (!Array.isArray(nodes)) {
      console.warn('flattenCategories: nodes不是数组', nodes)
      return
    }
    
    nodes.forEach(node => {
      if (node && node.id) {
        result.push(node)
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children)
        }
      }
    })
  }
  
  traverse(tree)
  return result
}

const getCategoryName = (categoryId: string): string => {
  if (!categoryId) return '未分类'
  
  if (!Array.isArray(categories.value)) {
    console.warn('getCategoryName: categories不是数组', categories.value)
    return '未知分类'
  }
  
  const category = categories.value.find(c => c && c.id === categoryId)
  if (!category) return '未知分类'
  
  // 如果是二级分类，显示完整路径：一级分类 > 二级分类
  if (category.parentId) {
    const parentCategory = categories.value.find(c => c && c.id === category.parentId)
    if (parentCategory) {
      return `${parentCategory.name} > ${category.name}`
    }
  }
  
  return category.name
}

const handleSearch = () => {
  pagination.page = 1
  fetchServices()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchServices()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchServices()
}

const openCreate = () => {
  dialog.title = '新增服务'
  // 重置表单字段，而不是重新赋值整个对象
  dialog.form.name = ''
  dialog.form.categoryId = ''
  dialog.form.price = 0
  dialog.form.unit = ''
  dialog.form.images = []
  dialog.form.tags = []
  dialog.form.description = ''
  dialog.form.status = 'active'
  dialog.editingServiceId = ''
  dialog.visible = true
}

const editService = (service: Service) => {
  dialog.title = '编辑服务'
  dialog.editingServiceId = service.id // 保存当前编辑的服务ID
  // 重置表单字段，而不是重新赋值整个对象
  dialog.form.name = service.name
  dialog.form.categoryId = service.categoryId
  dialog.form.price = service.price
  dialog.form.unit = service.unit
  dialog.form.images = service.images || []
  dialog.form.tags = service.tags || []
  dialog.form.description = service.description || ''
  dialog.form.status = service.status
  dialog.visible = true
}

const viewService = (service: Service) => {
  currentService.value = service
  detailVisible.value = true
}

const submitService = async () => {
  if (!dialog.form.name || !dialog.form.categoryId || !dialog.form.unit) {
    ElMessage.warning('请填写完整信息')
    return
  }

  dialog.loading = true
  try {
    const formData = { ...dialog.form }
    
    if (dialog.title === '新增服务') {
      // 新增模式 - 使用POST方法
      await createService(formData)
      ElMessage.success('创建成功')
    } else {
      // 编辑模式 - 使用PUT方法
      const serviceId = dialog.editingServiceId
      if (!serviceId) {
        ElMessage.error('服务ID不能为空')
        return
      }
      await updateService(serviceId, formData)
      ElMessage.success('更新成功')
    }
    
    dialog.visible = false
    fetchServices()
  } catch (error) {
    console.error('服务操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const updateServiceStatus = async (service: Service) => {
  try {
    await updateServiceStatus(service.id, service.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const deleteService = async (service: Service) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务 "${service.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteServiceApi(service.id)
    ElMessage.success('删除成功')
    fetchServices()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !dialog.form.tags.includes(tag)) {
    dialog.form.tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = dialog.form.tags.indexOf(tag)
  if (index > -1) {
    dialog.form.tags.splice(index, 1)
  }
}

// 日期格式化函数
const formatDateTime = (dateTime: string | undefined) => {
  if (!dateTime) return '-'
  
  try {
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) return dateTime
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateTime
  }
}

// 图片预览相关方法
const openImagePreview = (images: string[], index: number = 0) => {
  if (!images || images.length === 0) return
  
  previewImages.value = images
  previewIndex.value = index
  imagePreviewVisible.value = true
}

onMounted(async () => {
  // 先获取分类数据，再获取服务数据
  await fetchCategories()
  await fetchServices()
})
</script>

<style scoped>
.service-page {
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

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.service-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.service-info {
  flex: 1;
}

.service-info .name {
  font-weight: 500;
  margin-bottom: 4px;
}

.service-info .tags {
  display: flex;
  gap: 4px;
}

.description-cell {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price {
  text-align: center;
}

.price .amount {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.price .unit {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.service-detail {
  padding: 16px 0;
}

/* 图片预览样式 */
.service-image-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.service-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.preview-icon {
  font-size: 24px;
  color: #fff;
  margin-bottom: 8px;
}

.image-count {
  font-size: 12px;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
}

.no-image {
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-item:hover {
  transform: scale(1.05);
}

.detail-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.image-index {
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table__row) {
  position: relative;
  z-index: 1;
}

:deep(.el-table__row.striped) {
  z-index: 1;
}

:deep(.el-image) {
  position: relative;
  z-index: 1000 !important;
}

:deep(.el-image__inner) {
  position: relative;
  z-index: 1001 !important;
}

:deep(.el-image-viewer__wrapper) {
  z-index: 2000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

:deep(.el-image-viewer__canvas) {
  z-index: 2001 !important;
}

:deep(.el-image-viewer__mask) {
  z-index: 1999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
</style>

<style>
/* 全局样式，确保图片预览在最上层 */
.el-table__row {
  position: relative !important;
  z-index: 1 !important;
}

.el-table__row.striped {
  z-index: 1 !important;
}

.el-image {
  position: relative !important;
  z-index: 1000 !important;
}

.el-image__inner {
  position: relative !important;
  z-index: 1001 !important;
}

.el-image-viewer__wrapper {
  z-index: 2000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.el-image-viewer__canvas {
  z-index: 2001 !important;
}

.el-image-viewer__mask {
  z-index: 1999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.el-table {
  font-size: 13px;
}
</style>
