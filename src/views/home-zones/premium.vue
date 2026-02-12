<template>
  <div class="premium-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCategoryDialog">
          <el-icon><Plus /></el-icon>
          新增服务分类
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
          <el-table :data="categories" v-loading="categoriesLoading" stripe style="width: 100%">
            <el-table-column label="图片" width="100">
              <template #default="{ row }">
                <el-image
                  v-if="row.image"
                  :src="row.image"
                  fit="cover"
                  style="width: 60px; height: 60px; border-radius: 8px;"
                />
                <div v-else class="no-image">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="name" label="服务名称" min-width="150" />
            
            <el-table-column label="标签" width="100">
              <template #default="{ row }">
                <el-tag type="warning">{{ row.tag }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="description" label="描述" min-width="200" />
            
            <el-table-column label="服务要求" width="180">
              <template #default="{ row }">
                <div class="requirements-info">
                  <div>最少时长: {{ row.minServiceHours }}小时</div>
                  <div>提前预订: {{ row.advanceBookingDays }}天</div>
                  <div>定金: ¥{{ row.depositAmount }}</div>
                </div>
              </template>
            </el-table-column>
            
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
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="categoryPagination.page"
              v-model:page-size="categoryPagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="categoryPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleCategorySizeChange"
              @current-change="handleCategoryCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 申请审核 -->
      <el-tab-pane label="申请审核" name="applications">
        <el-card>
          <el-table :data="applications" v-loading="applicationsLoading" stripe style="width: 100%">
            <el-table-column prop="serviceName" label="服务类型" min-width="150" />
            
            <el-table-column label="联系人信息" width="150">
              <template #default="{ row }">
                <div class="contact-info">
                  <div>{{ row.contactInfo.name }}</div>
                  <div class="phone">{{ row.contactInfo.phone }}</div>
                  <div class="email">{{ row.contactInfo.email || '-' }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="需求信息" min-width="200">
              <template #default="{ row }">
                <div class="requirements-info">
                  <div>预算: {{ row.budgetRange }}</div>
                  <div class="requirements">需求: {{ row.requirements }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getApplicationStatusType(row.status)">
                  {{ getApplicationStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="createdAt" label="申请时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'pending'"
                  type="success" 
                  size="small" 
                  @click="approveApplication(row)"
                >
                  通过
                </el-button>
                <el-button 
                  v-if="row.status === 'pending'"
                  type="danger" 
                  size="small" 
                  @click="openRejectDialog(row)"
                >
                  拒绝
                </el-button>
                <el-button 
                  v-if="row.status === 'approved'"
                  type="primary" 
                  size="small" 
                  @click="assignManager(row)"
                >
                  分配管家
                </el-button>
                <el-button type="info" size="small" @click="viewApplicationDetail(row)">
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
      :title="categoryDialog.type === 'create' ? '新增服务分类' : '编辑服务分类'"
      width="600px"
      @close="resetCategoryDialog"
    >
      <el-form 
        ref="categoryFormRef"
        :model="categoryDialog.form" 
        :rules="categoryDialog.rules"
        label-width="120px"
      >
        <el-form-item label="服务名称" prop="name">
          <el-input 
            v-model="categoryDialog.form.name" 
            placeholder="请输入服务名称"
          />
        </el-form-item>
        
        <el-form-item label="标签" prop="tag">
          <el-input 
            v-model="categoryDialog.form.tag" 
            placeholder="请输入标签，如：五星级"
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="categoryDialog.form.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入服务描述"
          />
        </el-form-item>
        
        <el-form-item label="服务图片" prop="image">
          <ImageUpload
            v-model="categoryDialog.form.image"
            :limit="1"
            accept="image/*"
            upload-type="premium/upload"
          />
        </el-form-item>
        
        <el-form-item label="最少时长" prop="minServiceHours">
          <el-input-number 
            v-model="categoryDialog.form.minServiceHours" 
            :min="1"
            style="width: 100%"
            placeholder="小时"
          />
        </el-form-item>
        
        <el-form-item label="提前预订" prop="advanceBookingDays">
          <el-input-number 
            v-model="categoryDialog.form.advanceBookingDays" 
            :min="0"
            style="width: 100%"
            placeholder="天数"
          />
        </el-form-item>
        
        <el-form-item label="定金金额" prop="depositAmount">
          <el-input-number 
            v-model="categoryDialog.form.depositAmount" 
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="元"
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

    <!-- 拒绝弹窗 -->
    <el-dialog 
      v-model="rejectDialog.visible" 
      title="拒绝申请"
      width="400px"
      @close="resetRejectDialog"
    >
      <el-form 
        ref="rejectFormRef"
        :model="rejectDialog.form" 
        :rules="rejectDialog.rules"
        label-width="80px"
      >
        <el-form-item label="拒绝原因" prop="reason">
          <el-input 
            v-model="rejectDialog.form.reason" 
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectDialog.visible = false">取消</el-button>
        <el-button type="danger" :loading="rejectDialog.loading" @click="submitReject">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      title="申请详情"
      width="600px"
    >
      <div v-if="detailDialog.application" class="application-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="服务类型">
            {{ detailDialog.application.serviceName }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getApplicationStatusType(detailDialog.application.status)">
              {{ getApplicationStatusText(detailDialog.application.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ detailDialog.application.contactInfo.name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ detailDialog.application.contactInfo.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ detailDialog.application.contactInfo.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="预算范围">
            {{ detailDialog.application.budgetRange }}
          </el-descriptions-item>
          <el-descriptions-item label="具体需求" :span="2">
            {{ detailDialog.application.requirements }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDateTime(detailDialog.application.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="拒绝原因" v-if="detailDialog.application.rejectionReason">
            {{ detailDialog.application.rejectionReason }}
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
import { Plus, Refresh, Picture } from '@element-plus/icons-vue'
import { 
  getPremiumCategories, 
  createPremiumCategory, 
  updatePremiumCategory, 
  deletePremiumCategory,
  getPremiumApplications,
  approvePremiumApplication,
  rejectPremiumApplication
} from '@/api/modules/home-zones'
import ImageUpload from '@/components/ImageUpload.vue'
import type { PremiumCategory, PremiumApplication } from '@/types/api'

const activeTab = ref('categories')
const loading = ref(false)
const categoriesLoading = ref(false)
const applicationsLoading = ref(false)
const categories = ref<PremiumCategory[]>([])
const applications = ref<PremiumApplication[]>([])
const statusFilter = ref('')

// 分页相关
const categoryPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const applicationPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 临时添加测试数据
categories.value = [
  { id: '1', name: '测试分类1', description: '描述1', image: '', sortOrder: 1, status: 'active' },
  { id: '2', name: '测试分类2', description: '描述2', image: '', sortOrder: 2, status: 'active' },
  { id: '3', name: '测试分类3', description: '描述3', image: '', sortOrder: 3, status: 'active' },
  { id: '4', name: '测试分类4', description: '描述4', image: '', sortOrder: 4, status: 'active' },
  { id: '5', name: '测试分类5', description: '描述5', image: '', sortOrder: 5, status: 'active' },
  { id: '6', name: '测试分类6', description: '描述6', image: '', sortOrder: 6, status: 'active' },
  { id: '7', name: '测试分类7', description: '描述7', image: '', sortOrder: 7, status: 'active' },
  { id: '8', name: '测试分类8', description: '描述8', image: '', sortOrder: 8, status: 'active' },
  { id: '9', name: '测试分类9', description: '描述9', image: '', sortOrder: 9, status: 'active' },
  { id: '10', name: '测试分类10', description: '描述10', image: '', sortOrder: 10, status: 'active' },
  { id: '11', name: '测试分类11', description: '描述11', image: '', sortOrder: 11, status: 'active' },
  { id: '12', name: '测试分类12', description: '描述12', image: '', sortOrder: 12, status: 'active' }
]
categoryPagination.total = 12

// 分类弹窗
const categoryFormRef = ref()
const categoryDialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  loading: false,
  editingId: '',
  form: {
    name: '',
    tag: '',
    description: '',
    image: '',
    minServiceHours: 4,
    advanceBookingDays: 3,
    depositAmount: 500,
    sortOrder: 1,
    status: 'active' as 'active' | 'inactive'
  },
  rules: {
    name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
    tag: [{ required: true, message: '请输入标签', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    minServiceHours: [{ required: true, message: '请输入最少时长', trigger: 'blur' }],
    advanceBookingDays: [{ required: true, message: '请输入提前预订天数', trigger: 'blur' }],
    depositAmount: [{ required: true, message: '请输入定金金额', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }
})

// 拒绝弹窗
const rejectFormRef = ref()
const rejectDialog = reactive({
  visible: false,
  loading: false,
  applicationId: '',
  form: {
    reason: ''
  },
  rules: {
    reason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }]
  }
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  application: null as PremiumApplication | null
})

// 加载数据
const loadData = async () => {
  if (activeTab.value === 'categories') {
    await loadCategories()
  } else {
    await loadApplications()
  }
}

// 加载分类
const loadCategories = async () => {
  categoriesLoading.value = true
  try {
    const params = {
      page: categoryPagination.page,
      pageSize: categoryPagination.pageSize,
      ...(statusFilter.value && { status: statusFilter.value })
    }
    const data = await getPremiumCategories(params)
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    categories.value = Array.isArray(responseData) ? responseData : []
    categoryPagination.total = data.total || data.pagination?.total || 0
  } catch (error) {
    console.error('获取高端管家分类失败:', error)
    ElMessage.error('获取高端管家分类失败')
    categories.value = []
    categoryPagination.total = 0
  } finally {
    categoriesLoading.value = false
  }
}

// 加载申请
const loadApplications = async () => {
  applicationsLoading.value = true
  try {
    const data = await getPremiumApplications()
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    applications.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    console.error('获取管家申请失败:', error)
    ElMessage.error('获取管家申请失败')
    applications.value = []
  } finally {
    applicationsLoading.value = false
  }
}

// Tab切换
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  loadData()
}

// 打开分类弹窗
const openCategoryDialog = (category?: PremiumCategory) => {
  // 重置弹窗状态
  resetCategoryDialog()
  
  // 修复：只有当category是真正的对象且有id时才设置为编辑模式
  if (category && typeof category === 'object' && category.id) {
    // 编辑模式
    categoryDialog.type = 'edit'
    categoryDialog.editingId = category.id
    categoryDialog.form = {
      name: category.name,
      tag: category.tag,
      description: category.description,
      image: category.image || '',
      minServiceHours: category.minServiceHours,
      advanceBookingDays: category.advanceBookingDays,
      depositAmount: category.depositAmount,
      sortOrder: category.sortOrder,
      status: category.status
    }
  } else {
    // 新增模式 - 确保type设置为create
    categoryDialog.type = 'create'
    categoryDialog.editingId = ''
    // form已经在resetCategoryDialog中重置了
  }
  
  categoryDialog.visible = true
}

// 打开拒绝弹窗
const openRejectDialog = (application: PremiumApplication) => {
  rejectDialog.applicationId = application.id
  rejectDialog.form.reason = ''
  rejectDialog.visible = true
}

// 查看详情
const viewApplicationDetail = (application: PremiumApplication) => {
  detailDialog.application = application
  detailDialog.visible = true
}

// 分配管家
const assignManager = (application: PremiumApplication) => {
  ElMessage.info('分配管家功能待实现')
}

// 重置分类弹窗
const resetCategoryDialog = () => {
  categoryDialog.type = 'create'  // 添加这行
  categoryDialog.editingId = ''
  categoryDialog.form = {
    name: '',
    tag: '',
    description: '',
    image: '',
    minServiceHours: 4,
    advanceBookingDays: 3,
    depositAmount: 500,
    sortOrder: 1,
    status: 'active'
  }
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 重置拒绝弹窗
const resetRejectDialog = () => {
  rejectDialog.applicationId = ''
  rejectDialog.form.reason = ''
  if (rejectFormRef.value) {
    rejectFormRef.value.resetFields()
  }
}

// 提交分类
const submitCategory = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
    categoryDialog.loading = true
    
    if (categoryDialog.type === 'create') {
      await createPremiumCategory(categoryDialog.form)
      ElMessage.success('创建成功')
    } else {
      await updatePremiumCategory(categoryDialog.editingId, categoryDialog.form)
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

// 通过申请
const approveApplication = async (application: PremiumApplication) => {
  try {
    await ElMessageBox.confirm(
      `确定要通过"${application.contactInfo.name}"的管家申请吗？`,
      '确认通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await approvePremiumApplication(application.id)
    ElMessage.success('申请已通过')
    loadApplications()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过申请失败:', error)
      ElMessage.error('通过申请失败')
    }
  }
}

// 拒绝申请
const submitReject = async () => {
  if (!rejectFormRef.value) return
  
  try {
    await rejectFormRef.value.validate()
    rejectDialog.loading = true
    
    await rejectPremiumApplication(rejectDialog.applicationId, rejectDialog.form.reason)
    ElMessage.success('申请已拒绝')
    rejectDialog.visible = false
    loadApplications()
  } catch (error) {
    console.error('拒绝申请失败:', error)
    ElMessage.error('拒绝申请失败')
  } finally {
    rejectDialog.loading = false
  }
}

// 删除分类
const handleDeleteCategory = async (category: PremiumCategory) => {
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
    
    await deletePremiumCategory(category.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取申请状态类型
const getApplicationStatusType = (status: string) => {
  const statusMap = {
    pending: 'info',
    approved: 'success',
    rejected: 'danger',
    processing: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取申请状态文本
const getApplicationStatusText = (status: string) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    processing: '处理中'
  }
  return statusMap[status] || status
}

// 格式化日期时间
const formatDateTime = (dateTime: string | number) => {
  if (!dateTime) return '-'
  
  try {
    // 如果是数字（时间戳），需要转换为毫秒
    const timestamp = typeof dateTime === 'number' ? dateTime * 1000 : dateTime
    const date = new Date(timestamp)
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

// 分页事件处理
const handleCategorySizeChange = (size: number) => {
  categoryPagination.pageSize = size
  categoryPagination.page = 1
  loadCategories()
}

const handleCategoryCurrentChange = (page: number) => {
  categoryPagination.page = page
  loadCategories()
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.premium-page {
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding: 0 16px;
}

.no-image {
  width: 60px;
  height: 60px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 24px;
}

.requirements-info {
  line-height: 1.4;
  font-size: 12px;
}

.contact-info {
  line-height: 1.4;
}

.phone {
  color: #409eff;
  font-size: 12px;
}

.email {
  color: #67c23a;
  font-size: 12px;
}

.requirements {
  color: #606266;
  margin-top: 4px;
}

.application-detail {
  padding: 16px 0;
}
</style>
