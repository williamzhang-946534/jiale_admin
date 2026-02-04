<template>
  <div class="flash-sale-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openSessionDialog()">
          <el-icon><Plus /></el-icon>
          新增场次
        </el-button>
        <el-button type="success" @click="openProductDialog()">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
        <el-button @click="loadData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 120px" @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="待开始" value="pending" />
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="ended" />
        </el-select>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 闪购场次 -->
      <el-tab-pane label="闪购场次" name="sessions">
        <el-card>
          <el-table :data="sessions" v-loading="sessionsLoading" stripe>
            <el-table-column prop="date" label="日期" width="120" />
            
            <el-table-column label="时间段" width="150">
              <template #default="{ row }">
                {{ row.startTime }} - {{ row.endTime }}
              </template>
            </el-table-column>
            
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="getStatusType(row.status)"
                >
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
            
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openSessionDialog(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteSession(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 闪购商品 -->
      <el-tab-pane label="闪购商品" name="products">
        <el-card>
          <el-table :data="products" v-loading="productsLoading" stripe>
            <el-table-column prop="serviceName" label="服务名称" min-width="150" />
            
            <el-table-column label="场次信息" width="150">
              <template #default="{ row }">
                <div class="session-info">
                  <div>{{ row.sessionDate }}</div>
                  <div>{{ row.sessionTime }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="价格信息" width="180">
              <template #default="{ row }">
                <div class="price-info">
                  <div class="original-price">原价: ¥{{ row.originalPrice }}</div>
                  <div class="flash-price">闪购价: ¥{{ row.flashPrice }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="库存信息" width="150">
              <template #default="{ row }">
                <div class="stock-info">
                  <div>总数: {{ row.stockTotal }}</div>
                  <div>已售: {{ row.stockSold }}</div>
                  <div class="remaining">剩余: {{ row.stockTotal - row.stockSold }}</div>
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
            
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openProductDialog(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteProduct(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 场次弹窗 -->
    <el-dialog 
      v-model="sessionDialog.visible" 
      :title="sessionDialog.type === 'create' ? '新增场次' : '编辑场次'"
      width="500px"
      @close="resetSessionDialog"
    >
      <el-form 
        ref="sessionFormRef"
        :model="sessionDialog.form" 
        :rules="sessionDialog.rules"
        label-width="100px"
      >
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="sessionDialog.form.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="sessionDialog.form.startTime"
            format="HH:mm"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="sessionDialog.form.endTime"
            format="HH:mm"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number 
            v-model="sessionDialog.form.sortOrder" 
            :min="1"
            style="width: 100%"
            placeholder="数字越小越靠前"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="sessionDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="sessionDialog.loading" @click="submitSession">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 商品弹窗 -->
    <el-dialog 
      v-model="productDialog.visible" 
      :title="productDialog.type === 'create' ? '新增商品' : '编辑商品'"
      width="600px"
      @close="resetProductDialog"
    >
      <el-form 
        ref="productFormRef"
        :model="productDialog.form" 
        :rules="productDialog.rules"
        label-width="120px"
      >
        <el-form-item label="选择场次" prop="sessionId">
          <el-select 
            v-model="productDialog.form.sessionId" 
            placeholder="请选择场次"
            style="width: 100%"
          >
            <el-option
              v-for="session in sessions"
              :key="session.id"
              :label="`${session.date} ${session.startTime}-${session.endTime}`"
              :value="session.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择服务" prop="serviceId">
          <el-select 
            v-model="productDialog.form.serviceId" 
            placeholder="请选择服务"
            style="width: 100%"
            @change="onServiceChange"
          >
            <el-option
              v-for="service in services"
              :key="service.id"
              :label="service.name"
              :value="service.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number 
            v-model="productDialog.form.originalPrice" 
            :min="0" 
            :precision="2"
            style="width: 100%"
            placeholder="请输入原价"
          />
        </el-form-item>
        
        <el-form-item label="闪购价" prop="flashPrice">
          <el-input-number 
            v-model="productDialog.form.flashPrice" 
            :min="0" 
            :precision="2"
            style="width: 100%"
            placeholder="请输入闪购价格"
          />
        </el-form-item>
        
        <el-form-item label="库存总数" prop="stockTotal">
          <el-input-number 
            v-model="productDialog.form.stockTotal" 
            :min="1"
            style="width: 100%"
            placeholder="请输入库存总数"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number 
            v-model="productDialog.form.sortOrder" 
            :min="1"
            style="width: 100%"
            placeholder="数字越小越靠前"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="productDialog.form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="productDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="productDialog.loading" @click="submitProduct">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { 
  getFlashSaleSessions, 
  createFlashSaleSession, 
  updateFlashSaleSession, 
  deleteFlashSaleSession,
  getFlashSaleProducts,
  createFlashSaleProduct,
  updateFlashSaleProduct,
  deleteFlashSaleProduct
} from '@/api/modules/home-zones'
import { getServices } from '@/api/modules/service'
import type { FlashSaleSession, FlashSaleProduct, Service } from '@/types/api'

const activeTab = ref('sessions')
const loading = ref(false)
const sessionsLoading = ref(false)
const productsLoading = ref(false)
const sessions = ref<FlashSaleSession[]>([])
const products = ref<FlashSaleProduct[]>([])
const services = ref<Service[]>([])
const statusFilter = ref('')

// 场次弹窗
const sessionFormRef = ref()
const sessionDialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  loading: false,
  editingId: '',
  form: {
    date: '',
    startTime: null,
    endTime: null,
    sortOrder: 1
  },
  rules: {
    date: [{ required: true, message: '请选择日期', trigger: 'change' }],
    startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }
})

// 商品弹窗
const productFormRef = ref()
const productDialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  loading: false,
  editingId: '',
  form: {
    sessionId: '',
    serviceId: '',
    originalPrice: 0,
    flashPrice: 0,
    stockTotal: 100,
    sortOrder: 1,
    status: 'active' as 'active' | 'inactive'
  },
  rules: {
    sessionId: [{ required: true, message: '请选择场次', trigger: 'change' }],
    serviceId: [{ required: true, message: '请选择服务', trigger: 'change' }],
    originalPrice: [{ required: true, message: '请输入原价', trigger: 'blur' }],
    flashPrice: [{ required: true, message: '请输入闪购价', trigger: 'blur' }],
    stockTotal: [{ required: true, message: '请输入库存总数', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }
})

// 加载数据
const loadData = async () => {
  if (activeTab.value === 'sessions') {
    await loadSessions()
  } else {
    await loadProducts()
  }
}

// 加载场次
const loadSessions = async () => {
  sessionsLoading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const data = await getFlashSaleSessions(params)
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    sessions.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    console.error('获取闪购场次失败:', error)
    ElMessage.error('获取闪购场次失败')
    sessions.value = []
  } finally {
    sessionsLoading.value = false
  }
}

// 加载商品
const loadProducts = async () => {
  productsLoading.value = true
  try {
    const data = await getFlashSaleProducts()
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    products.value = Array.isArray(responseData) ? responseData : []
    
    // 为每个商品关联场次信息
    if (Array.isArray(products.value)) {
      products.value.forEach(product => {
        const session = sessions.value.find(s => s.id === product.sessionId)
        if (session) {
          product.sessionDate = session.date
          product.sessionTime = `${session.startTime}-${session.endTime}`
        }
      })
    }
  } catch (error) {
    console.error('获取闪购商品失败:', error)
    ElMessage.error('获取闪购商品失败')
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

// 加载服务列表
const loadServices = async () => {
  try {
    const data = await getServices({ page: 1, pageSize: 1000 })
    // 确保数据是数组格式
    const responseData = data.list || data.data || data
    services.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    console.error('获取服务列表失败:', error)
    ElMessage.error('获取服务列表失败')
    services.value = []
  }
}

// Tab切换
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  loadData()
}

// 打开场次弹窗
const openSessionDialog = (session?: FlashSaleSession) => {
  if (session) {
    // 编辑模式
    sessionDialog.type = 'edit'
    sessionDialog.editingId = session.id
    sessionDialog.form = {
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      sortOrder: session.sortOrder
    }
  } else {
    // 新增模式 - 先重置再设置类型
    resetSessionDialog()
    sessionDialog.type = 'create'
  }
  
  sessionDialog.visible = true
}

// 打开商品弹窗
const openProductDialog = (product?: FlashSaleProduct) => {
  if (product) {
    // 编辑模式
    productDialog.type = 'edit'
    productDialog.editingId = product.id
    productDialog.form = {
      sessionId: product.sessionId,
      serviceId: product.serviceId,
      originalPrice: product.originalPrice,
      flashPrice: product.flashPrice,
      stockTotal: product.stockTotal,
      sortOrder: product.sortOrder,
      status: product.status
    }
  } else {
    // 新增模式 - 先重置再设置类型
    resetProductDialog()
    productDialog.type = 'create'
  }
  
  productDialog.visible = true
}

// 重置场次弹窗
const resetSessionDialog = () => {
  sessionDialog.editingId = ''
  sessionDialog.form = {
    date: '',
    startTime: null,
    endTime: null,
    sortOrder: 1
  }
  if (sessionFormRef.value) {
    sessionFormRef.value.resetFields()
  }
}

// 重置商品弹窗
const resetProductDialog = () => {
  productDialog.editingId = ''
  productDialog.form = {
    sessionId: '',
    serviceId: '',
    originalPrice: 0,
    flashPrice: 0,
    stockTotal: 100,
    sortOrder: 1,
    status: 'active'
  }
  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
}

// 服务选择变化
const onServiceChange = (serviceId: string) => {
  const service = services.value.find(s => s.id === serviceId)
  if (service) {
    productDialog.form.originalPrice = service.price || 0
  }
}

// 提交场次
const submitSession = async () => {
  if (!sessionFormRef.value) return
  
  try {
    await sessionFormRef.value.validate()
    sessionDialog.loading = true
    
    // 格式化时间
    const formData = {
      ...sessionDialog.form,
      date: sessionDialog.form.date ? new Date(sessionDialog.form.date).toISOString().split('T')[0] : '',
      startTime: sessionDialog.form.startTime ? 
        new Date(sessionDialog.form.startTime).toTimeString().slice(0, 5) : '',
      endTime: sessionDialog.form.endTime ? 
        new Date(sessionDialog.form.endTime).toTimeString().slice(0, 5) : ''
    }
    
    if (sessionDialog.type === 'create') {
      await createFlashSaleSession(formData)
      ElMessage.success('创建成功')
    } else {
      // 确保编辑ID存在
      if (!sessionDialog.editingId) {
        ElMessage.error('编辑ID缺失')
        return
      }
      await updateFlashSaleSession(sessionDialog.editingId, formData)
      ElMessage.success('更新成功')
    }
    
    sessionDialog.visible = false
    loadSessions()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    sessionDialog.loading = false
  }
}

// 提交商品
const submitProduct = async () => {
  if (!productFormRef.value) return
  
  try {
    await productFormRef.value.validate()
    productDialog.loading = true
    
    if (productDialog.type === 'create') {
      await createFlashSaleProduct(productDialog.form)
      ElMessage.success('创建成功')
    } else {
      await updateFlashSaleProduct(productDialog.editingId, productDialog.form)
      ElMessage.success('更新成功')
    }
    
    productDialog.visible = false
    loadProducts()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    productDialog.loading = false
  }
}

// 删除场次
const handleDeleteSession = async (session: FlashSaleSession) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除场次"${session.date} ${session.startTime}-${session.endTime}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteFlashSaleSession(session.id)
    ElMessage.success('删除成功')
    loadSessions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 删除商品
const handleDeleteProduct = async (product: FlashSaleProduct) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品"${product.serviceName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteFlashSaleProduct(product.id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap = {
    pending: 'info',
    active: 'success',
    ended: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待开始',
    active: '进行中',
    ended: '已结束'
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
  loadSessions()
  loadServices()
})
</script>

<style scoped>
.flash-sale-page {
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

.session-info {
  line-height: 1.4;
  font-size: 12px;
}

.price-info {
  line-height: 1.4;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 12px;
}

.flash-price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 14px;
}

.stock-info {
  line-height: 1.4;
  font-size: 12px;
}

.remaining {
  color: #67c23a;
  font-weight: 600;
}
</style>
