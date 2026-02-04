<template>
  <div class="enterprise-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCategoryDialog">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
        <el-button @click="loadData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 120px" @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 服务分类 -->
      <el-tab-pane label="服务分类" name="categories">
        <el-card>
          <el-table :data="categories" v-loading="categoriesLoading" stripe>
            <el-table-column label="图标" width="80" align="center">
              <template #default="{ row }">
                <span class="category-icon">{{ row.icon }}</span>
              </template>
            </el-table-column>
            
            <el-table-column prop="name" label="分类名称" min-width="150" />
            
            <el-table-column prop="description" label="描述" min-width="200" />
            
            <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
            
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openCategoryDialog(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteCategory(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 询价管理 -->
      <el-tab-pane label="询价管理" name="inquiries">
        <el-card>
          <el-table :data="inquiries" v-loading="inquiriesLoading" stripe>
            <el-table-column prop="companyName" label="公司名称" min-width="150" />
            
            <el-table-column label="联系人" width="120">
              <template #default="{ row }">
                <div class="contact-info">
                  <div>{{ row.contactName }}</div>
                  <div class="phone">{{ row.contactPhone }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="服务需求" min-width="200">
              <template #default="{ row }">
                <div class="service-info">
                  <div>面积: {{ row.area }}㎡</div>
                  <div>地址: {{ row.address }}</div>
                  <div class="requirements">需求: {{ row.requirements }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getInquiryStatusType(row.status)">
                  {{ getInquiryStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'pending'"
                  type="primary" 
                  size="small" 
                  @click="openAssignDialog(row)"
                >
                  分配
                </el-button>
                <el-button 
                  v-if="row.status === 'assigned'"
                  type="success" 
                  size="small" 
                  @click="updateInquiryStatus(row.id, 'processing')"
                >
                  处理中
                </el-button>
                <el-button 
                  v-if="row.status === 'processing'"
                  type="warning" 
                  size="small" 
                  @click="updateInquiryStatus(row.id, 'completed')"
                >
                  完成
                </el-button>
                <el-button type="info" size="small" @click="viewInquiryDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 分类弹窗 -->
    <el-dialog 
      v-model="categoryDialog.visible" 
      :title="categoryDialog.type === 'create' ? '新增分类' : '编辑分类'"
      width="500px"
      @close="resetCategoryDialog"
    >
      <el-form 
        ref="categoryFormRef"
        :model="categoryDialog.form" 
        :rules="categoryDialog.rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="categoryDialog.form.name" 
            placeholder="请输入分类名称"
          />
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <el-input 
            v-model="categoryDialog.form.icon" 
            placeholder="请输入图标emoji，如：🏢"
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="categoryDialog.form.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number 
            v-model="categoryDialog.form.sortOrder" 
            :min="1"
            style="width: 100%"
            placeholder="数字越小越靠前"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryDialog.form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="categoryDialog.loading" @click="submitCategory">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配弹窗 -->
    <el-dialog 
      v-model="assignDialog.visible" 
      title="分配销售"
      width="400px"
      @close="resetAssignDialog"
    >
      <el-form 
        ref="assignFormRef"
        :model="assignDialog.form" 
        :rules="assignDialog.rules"
        label-width="80px"
      >
        <el-form-item label="销售" prop="assignedSalesId">
          <el-select 
            v-model="assignDialog.form.assignedSalesId" 
            placeholder="请选择销售"
            style="width: 100%"
          >
            <el-option
              v-for="sales in salesList"
              :key="sales.id"
              :label="sales.name"
              :value="sales.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="assignDialog.loading" @click="submitAssign">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      title="询价详情"
      width="600px"
    >
      <div v-if="detailDialog.inquiry" class="inquiry-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="公司名称">
            {{ detailDialog.inquiry.companyName }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ detailDialog.inquiry.contactName }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ detailDialog.inquiry.contactPhone }}
          </el-descriptions-item>
          <el-descriptions-item label="服务面积">
            {{ detailDialog.inquiry.area }}㎡
          </el-descriptions-item>
          <el-descriptions-item label="服务地址" :span="2">
            {{ detailDialog.inquiry.address }}
          </el-descriptions-item>
          <el-descriptions-item label="具体需求" :span="2">
            {{ detailDialog.inquiry.requirements }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getInquiryStatusType(detailDialog.inquiry.status)">
              {{ getInquiryStatusText(detailDialog.inquiry.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(detailDialog.inquiry.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { 
  getEnterpriseCategories, 
  createEnterpriseCategory, 
  updateEnterpriseCategory, 
  deleteEnterpriseCategory,
  getEnterpriseInquiries,
  updateEnterpriseInquiryStatus
} from '@/api/modules/home-zones'
import { getProviders } from '@/api/modules/provider'
import type { EnterpriseCategory, EnterpriseInquiry } from '@/types/api'

const activeTab = ref('categories')
const loading = ref(false)
const categoriesLoading = ref(false)
const inquiriesLoading = ref(false)
const categories = ref<EnterpriseCategory[]>([])
const inquiries = ref<EnterpriseInquiry[]>([])
const salesList = ref<any[]>([])
const statusFilter = ref('')

// 分类弹窗
const categoryFormRef = ref()
const categoryDialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  loading: false,
  editingId: '',
  form: {
    name: '',
    icon: '',
    description: '',
    sortOrder: 1,
    status: 'active' as 'active' | 'inactive'
  },
  rules: {
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
    icon: [{ required: true, message: '请输入图标', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }
})

// 分配弹窗
const assignFormRef = ref()
const assignDialog = reactive({
  visible: false,
  loading: false,
  inquiryId: '',
  form: {
    assignedSalesId: ''
  },
  rules: {
    assignedSalesId: [{ required: true, message: '请选择销售', trigger: 'change' }]
  }
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  inquiry: null as EnterpriseInquiry | null
})

// 加载数据
const loadData = async () => {
  if (activeTab.value === 'categories') {
    await loadCategories()
  } else {
    await loadInquiries()
  }
}

// 加载分类
const loadCategories = async () => {
  categoriesLoading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const data = await getEnterpriseCategories(params)
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    categories.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    console.error('获取企业分类失败:', error)
    ElMessage.error('获取企业分类失败')
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

// 加载询价
const loadInquiries = async () => {
  inquiriesLoading.value = true
  try {
    const data = await getEnterpriseInquiries()
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    inquiries.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    console.error('获取企业询价失败:', error)
    ElMessage.error('获取企业询价失败')
    inquiries.value = []
  } finally {
    inquiriesLoading.value = false
  }
}

// 加载销售列表
const loadSalesList = async () => {
  try {
    const data = await getProviders({ page: 1, pageSize: 1000, status: 'verified' })
    salesList.value = data.list || data.data || data || []
  } catch (error) {
    console.error('获取销售列表失败:', error)
  }
}

// Tab切换
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  loadData()
}

// 打开分类弹窗
const openCategoryDialog = (category?: EnterpriseCategory) => {
  categoryDialog.type = category ? 'edit' : 'create'
  categoryDialog.editingId = category?.id || ''
  
  if (category) {
    categoryDialog.form = {
      name: category.name,
      icon: category.icon,
      description: category.description,
      sortOrder: category.sortOrder,
      status: category.status
    }
  } else {
    resetCategoryDialog()
  }
  
  categoryDialog.visible = true
}

// 打开分配弹窗
const openAssignDialog = (inquiry: EnterpriseInquiry) => {
  assignDialog.inquiryId = inquiry.id
  assignDialog.form.assignedSalesId = ''
  assignDialog.visible = true
}

// 查看详情
const viewInquiryDetail = (inquiry: EnterpriseInquiry) => {
  detailDialog.inquiry = inquiry
  detailDialog.visible = true
}

// 重置分类弹窗
const resetCategoryDialog = () => {
  categoryDialog.editingId = ''
  categoryDialog.form = {
    name: '',
    icon: '',
    description: '',
    sortOrder: 1,
    status: 'active'
  }
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 重置分配弹窗
const resetAssignDialog = () => {
  assignDialog.inquiryId = ''
  assignDialog.form.assignedSalesId = ''
  if (assignFormRef.value) {
    assignFormRef.value.resetFields()
  }
}

// 提交分类
const submitCategory = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
    categoryDialog.loading = true
    
    if (categoryDialog.type === 'create') {
      await createEnterpriseCategory(categoryDialog.form)
      ElMessage.success('创建成功')
    } else {
      await updateEnterpriseCategory(categoryDialog.editingId, categoryDialog.form)
      ElMessage.success('更新成功')
    }
    
    categoryDialog.visible = false
    loadCategories()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    categoryDialog.loading = false
  }
}

// 提交分配
const submitAssign = async () => {
  if (!assignFormRef.value) return
  
  try {
    await assignFormRef.value.validate()
    assignDialog.loading = true
    
    await updateEnterpriseInquiryStatus(assignDialog.inquiryId, {
      status: 'assigned',
      assignedSalesId: assignDialog.form.assignedSalesId
    })
    
    ElMessage.success('分配成功')
    assignDialog.visible = false
    loadInquiries()
  } catch (error) {
    console.error('分配失败:', error)
    ElMessage.error('分配失败')
  } finally {
    assignDialog.loading = false
  }
}

// 更新询价状态
const updateInquiryStatus = async (id: string, status: string) => {
  try {
    await updateEnterpriseInquiryStatus(id, { status })
    ElMessage.success('状态更新成功')
    loadInquiries()
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

// 删除分类
const handleDeleteCategory = async (category: EnterpriseCategory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteEnterpriseCategory(category.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取询价状态类型
const getInquiryStatusType = (status: string) => {
  const statusMap = {
    pending: 'info',
    assigned: 'warning',
    processing: 'primary',
    completed: 'success'
  }
  return statusMap[status] || 'info'
}

// 获取询价状态文本
const getInquiryStatusText = (status: string) => {
  const statusMap = {
    pending: '待分配',
    assigned: '已分配',
    processing: '处理中',
    completed: '已完成'
  }
  return statusMap[status] || status
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
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

onMounted(() => {
  loadCategories()
  loadSalesList()
})
</script>

<style scoped>
.enterprise-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.category-icon {
  font-size: 24px;
}

.contact-info {
  line-height: 1.4;
}

.phone {
  color: #409eff;
  font-size: 12px;
}

.service-info {
  line-height: 1.4;
}

.requirements {
  color: #606266;
  font-size: 12px;
  margin-top: 4px;
}

.inquiry-detail {
  padding: 16px 0;
}
</style>
