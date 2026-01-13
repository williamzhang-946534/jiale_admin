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
          style="width: 150px"
          @change="handleSearch"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
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
              <el-image
                v-if="row.images && row.images.length > 0"
                :src="row.images[0]"
                :preview-src-list="row.images"
                fit="cover"
                class="service-image"
              />
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

        <el-table-column prop="createTime" label="创建时间" width="180" />

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
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
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
                <el-radio label="active">上架</el-radio>
                <el-radio label="inactive">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="服务图片">
          <el-upload
            v-model:file-list="dialog.imageFiles"
            :auto-upload="false"
            list-type="picture-card"
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
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
          <el-image
            v-for="(image, index) in currentService.images"
            :key="index"
            :src="image"
            :preview-src-list="currentService.images"
            fit="cover"
            class="detail-image"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getServices, createService, updateService, updateServiceStatus, deleteService as deleteServiceApi } from '@/api/modules/service'
import { getCategories } from '@/api/modules/category'
import type { Service, Category } from '@/types/api'

const tagInputRef = ref<InstanceType<typeof ElInput>>()

const loading = ref(false)
const services = ref<Service[]>([])
const categories = ref<Category[]>([])
const currentService = ref<Service | null>(null)
const detailVisible = ref(false)

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
  imageFiles: [] as any[],
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
      categoryName: getCategoryName(service.categoryId)
    }))
    
    // 设置分页总数
    pagination.total = data.total || serviceList.length
    
  } catch (error) {
    console.error('获取服务列表失败:', error)
    ElMessage.error('获取服务列表失败')
    // Mock数据
    services.value = [
      {
        id: '1',
        name: '家庭日常保洁',
        categoryId: 'daily_clean',
        categoryName: '日常保洁',
        price: 45,
        unit: '小时',
        images: ['https://example.com/service1.jpg'],
        description: '专业的家庭日常保洁服务',
        tags: ['经验丰富', '工具齐全'],
        status: 'active',
        createTime: '2023-10-01 10:00:00'
      }
    ]
    pagination.total = 1
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const data = await getCategories()
    console.log('管理员分类API返回数据:', data)
    
    // 处理不同的数据结构
    let categoryList = []
    if (data && data.data && Array.isArray(data.data)) {
      // API返回格式: { data: [] }
      categoryList = data.data
    } else if (data && data.list && Array.isArray(data.list)) {
      // 标准分页格式: { list: [] }
      categoryList = data.list
    } else if (Array.isArray(data)) {
      // 直接返回数组
      categoryList = data
    } else {
      console.error('分类数据结构异常:', data)
      categoryList = []
    }
    
    categories.value = categoryList
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    // Mock数据
    categories.value = [
      { id: 'daily_clean', name: '日常保洁', parentId: 'cleaning' },
      { id: 'deep_clean', name: '深度保洁', parentId: 'cleaning' },
      { id: 'nanny', name: '月嫂服务', parentId: null },
      { id: 'moving', name: '搬家服务', parentId: null }
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
  return category?.name || '未知分类'
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
  dialog.form = {
    name: '',
    categoryId: '',
    price: 0,
    unit: '',
    images: [],
    tags: [],
    description: '',
    status: 'active'
  }
  dialog.imageFiles = []
  dialog.visible = true
}

const editService = (service: Service) => {
  dialog.title = '编辑服务'
  dialog.editingServiceId = service.id // 保存当前编辑的服务ID
  dialog.form = {
    name: service.name,
    categoryId: service.categoryId,
    price: service.price,
    unit: service.unit,
    images: service.images || [],
    tags: service.tags || [],
    description: service.description || '',
    status: service.status
  }
  dialog.imageFiles = (service.images || []).map((url, index) => ({
    name: `image${index}`,
    url
  }))
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

onMounted(() => {
  fetchCategories()
  fetchServices()
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

.service-images {
  margin-top: 20px;
}

.service-images h4 {
  margin-bottom: 12px;
  color: #303133;
}

.detail-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  margin-right: 12px;
  margin-bottom: 12px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
</style>
