<template>
  <div class="newcomer-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增专享服务
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
      <!-- 专享服务 -->
      <el-tab-pane label="专享服务" name="offers">
        <el-card>
          <el-table :data="offers" v-loading="loading" stripe>
        <el-table-column label="服务名称" min-width="150">
          <template #default="{ row }">
            {{ row.service?.name || '未知服务' }}
          </template>
        </el-table-column>
        
        <el-table-column label="价格信息" width="200">
          <template #default="{ row }">
            <div class="price-info">
              <div class="original-price">原价: ¥{{ row.originalPrice }}</div>
              <div class="newcomer-price">新人价: ¥{{ row.newcomerPrice }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="库存信息" width="150">
          <template #default="{ row }">
            <div class="stock-info">
              <div>总数: {{ row.stockLimit }}</div>
              <div>已领: {{ row.claimedCount }}</div>
              <div class="remaining">剩余: {{ row.stockLimit - row.claimedCount }}</div>
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
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑弹窗 -->
    <el-dialog 
      v-model="dialog.visible" 
      :title="dialog.type === 'create' ? '新增专享服务' : '编辑专享服务'"
      width="600px"
      @close="resetDialog"
    >
      <el-form 
        ref="dialogFormRef"
        :model="dialog.form" 
        :rules="dialog.rules"
        label-width="120px"
      >
        <el-form-item label="选择服务" prop="serviceId">
          <el-select 
            v-model="dialog.form.serviceId" 
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
            v-model="dialog.form.originalPrice" 
            :min="0" 
            :precision="2"
            style="width: 100%"
            placeholder="请输入原价"
          />
        </el-form-item>
        
        <el-form-item label="新人价" prop="newcomerPrice">
          <el-input-number 
            v-model="dialog.form.newcomerPrice" 
            :min="0" 
            :precision="2"
            style="width: 100%"
            placeholder="请输入新人专享价格"
          />
        </el-form-item>
        
        <el-form-item label="库存限制" prop="stockLimit">
          <el-input-number 
            v-model="dialog.form.stockLimit" 
            :min="1"
            style="width: 100%"
            placeholder="请输入库存限制"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number 
            v-model="dialog.form.sortOrder" 
            :min="1"
            style="width: 100%"
            placeholder="数字越小越靠前"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dialog.form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitOffer">
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
  getNewcomerOffers, 
  createNewcomerOffer, 
  updateNewcomerOffer, 
  deleteNewcomerOffer 
} from '@/api/modules/home-zones'
import { getServices } from '@/api/modules/service'
import type { NewcomerOffer, Service } from '@/types/api'

const loading = ref(false)
const offers = ref<NewcomerOffer[]>([])
const services = ref<Service[]>([])
const statusFilter = ref('')

// 标签相关
const activeTab = ref('offers')

//窗相关
const dialogFormRef = ref()
const dialog = reactive({
  visible: false,
  type: 'create' as 'create' | 'edit',
  loading: false,
  editingId: '',
  form: {
    serviceId: '',
    originalPrice: 0,
    newcomerPrice: 0,
    stockLimit: 100,
    sortOrder: 1,
    status: 'active' as 'active' | 'inactive'
  },
  rules: {
    serviceId: [{ required: true, message: '请选择服务', trigger: 'change' }],
    originalPrice: [{ required: true, message: '请输入原价', trigger: 'blur' }],
    newcomerPrice: [{ required: true, message: '请输入新人价', trigger: 'blur' }],
    stockLimit: [{ required: true, message: '请输入库存限制', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }]
  }
})

// 加载数据
const loadData = async () => {
  await loadOffers()
}

// 加载专享服务列表
const loadOffers = async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const data = await getNewcomerOffers(params)
    // 确保数据是数组格式 - API返回的是 data.items 结构
    const responseData = data.items || data.list || data.data || data
    offers.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    console.error('获取新人专享服务失败:', error)
    ElMessage.error('获取新人专享服务失败')
    offers.value = []
  } finally {
    loading.value = false
  }
}

// Tab切换
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  loadData()
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

// 打开创建弹窗
const openCreateDialog = () => {
  dialog.type = 'create'
  dialog.visible = true
  resetDialog()
}

// 打开编辑弹窗
const openEditDialog = (offer: NewcomerOffer) => {
  dialog.type = 'edit'
  dialog.editingId = offer.id
  dialog.form = {
    serviceId: offer.serviceId,
    originalPrice: offer.originalPrice,
    newcomerPrice: offer.newcomerPrice,
    stockLimit: offer.stockLimit,
    sortOrder: offer.sortOrder,
    status: offer.status
  }
  dialog.visible = true
}

// 重置弹窗
const resetDialog = () => {
  dialog.editingId = ''
  dialog.form = {
    serviceId: '',
    originalPrice: 0,
    newcomerPrice: 0,
    stockLimit: 100,
    sortOrder: 1,
    status: 'active'
  }
  if (dialogFormRef.value) {
    dialogFormRef.value.resetFields()
  }
}

// 服务选择变化
const onServiceChange = (serviceId: string) => {
  const service = services.value.find(s => s.id === serviceId)
  if (service) {
    dialog.form.originalPrice = service.price || 0
  }
}

// 提交表单
const submitOffer = async () => {
  if (!dialogFormRef.value) return
  
  try {
    await dialogFormRef.value.validate()
    dialog.loading = true
    
    if (dialog.type === 'create') {
      await createNewcomerOffer(dialog.form)
      ElMessage.success('创建成功')
    } else {
      await updateNewcomerOffer(dialog.editingId, dialog.form)
      ElMessage.success('更新成功')
    }
    
    dialog.visible = false
    loadData()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

// 切换状态
const toggleStatus = async (offer: NewcomerOffer) => {
  const newStatus = offer.status === 'active' ? 'inactive' : 'active'
  try {
    await updateNewcomerOffer(offer.id, { ...offer, status: newStatus })
    ElMessage.success('状态更新成功')
    loadData()
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

// 删除
const handleDelete = async (offer: NewcomerOffer) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除专享服务"${offer.service?.name || '未知服务'}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteNewcomerOffer(offer.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
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
  loadData()
  loadServices()
})
</script>

<style scoped>
.newcomer-page {
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

.price-info {
  line-height: 1.4;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 12px;
}

.newcomer-price {
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
