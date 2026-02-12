<template>
  <div class="order-list">
    <h1 style="color: red; font-size: 24px;">测试文字：订单列表页面</h1>
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleRefresh">
          <RefreshRight />
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="订单号"
          style="width: 150px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <Search />
          </template>
        </el-input>
        <el-select
          v-model="queryParams.status"
          placeholder="订单状态"
          style="width: 120px"
          clearable
          @change="handleSearch"
        >
          <el-option
            v-for="status in statusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 240px"
          @change="handleDateChange"
        />
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="orders"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="用户姓名" width="120">
          <template #default="{ row }">
            {{ row.user?.nickname || '未知用户' }}
          </template>
        </el-table-column>
        <el-table-column label="服务项目" width="150">
          <template #default="{ row }">
            {{ row.service?.name || '未知服务' }}
          </template>
        </el-table-column>
        <el-table-column label="服务者" width="120">
          <template #default="{ row }">
            {{ row.provider?.name || '未指派' }}
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <div>
              <div class="total-price">¥{{ Number(row.totalPrice || 0).toFixed(2) }}</div>
              <div v-if="row.discount && Number(row.discount) > 0" class="discount-info">
                <span class="original-price">¥{{ Number(row.originalPrice || 0).toFixed(2) }}</span>
                <span class="discount">优惠¥{{ Number(row.discount).toFixed(2) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.paidAt ? 'success' : 'warning'" size="small">
              {{ row.paidAt ? '已支付' : '未支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="serviceDate" label="服务日期" width="140">
          <template #default="{ row }">
            {{ formatDate(row.serviceDate, 'YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column prop="serviceTime" label="服务时间" width="120">
          <template #default="{ row }">
            {{ row.serviceTime }}
            <span v-if="row.duration" class="duration">({{ row.duration }}小时)</span>
          </template>
        </el-table-column>
        <el-table-column label="服务地址" width="200">
          <template #default="{ row }">
            <div class="address-info">
              <div>{{ row.address?.contactName }}</div>
              <div class="address-detail">{{ row.address?.detail }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PENDING'"
              type="primary"
              size="small"
              @click="handleAssign(row)"
              v-permission="['order:assign']"
            >
              指派
            </el-button>
            <el-button
              v-if="canRefund(row.status)"
              type="danger"
              size="small"
              @click="handleRefund(row)"
              v-permission="['order:refund']"
            >
              退款
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-permission="['order:delete']"
            >
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
          :page-sizes="pagination.pageSizes"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 指派弹窗 -->
    <el-dialog
      v-model="assignDialog.visible"
      title="指派服务者"
      width="500px"
    >
      <el-form :model="assignDialog.form" label-width="80px">
        <el-form-item label="选择服务者">
          <el-select
            v-model="assignDialog.form.providerId"
            placeholder="请选择服务者"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="provider in availableProviders"
              :key="provider.id"
              :label="provider.name"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmAssign"
          :loading="assignDialog.loading"
        >
          确定指派
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { usePagination, useConfirm } from '@/composables/index'
import { formatDate } from '@/utils/formatDate'
import { getOrders, assignOrder, refundOrder, deleteOrder, type Order, type OrderQueryParams } from '@/api/modules/order'

const { confirm } = useConfirm()
const { pagination, handleSizeChange, handleCurrentChange, resetPagination } = usePagination()

// 查询参数
const queryParams = reactive<OrderQueryParams>({
  page: 1,
  pageSize: 20,
  status: undefined,
  orderNo: '',
  startDate: '',
  endDate: '',
})

// 日期范围
const dateRange = ref<string[]>([])

// 状态选项
const statusOptions = [
  { label: '待接单', value: 'PENDING' },
  { label: '已接单', value: 'ACCEPTED' },
  { label: '已到达', value: 'ARRIVED' },
  { label: '服务中', value: 'STARTED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]

// 响应式数据
const loading = ref(false)
const orders = ref<Order[]>([])
const selectedOrders = ref<Order[]>([])
const availableProviders = ref<Array<{ id: string; name: string }>>([
  { id: '1', name: '张三' },
  { id: '2', name: '李四' },
  { id: '3', name: '王五' },
])

// 指派弹窗
const assignDialog = reactive({
  visible: false,
  order: null as Order | null,
  form: {
    providerId: '',
  },
  loading: false,
})

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const typeMap = {
    'PENDING': 'warning',
    'ACCEPTED': 'info',
    'ARRIVED': 'primary',
    'STARTED': 'primary',
    'COMPLETED': 'success',
    'CANCELLED': 'info',
  }
  return typeMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const labelMap = {
    'PENDING': '待接单',
    'ACCEPTED': '已接单',
    'ARRIVED': '已到达',
    'STARTED': '服务中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
  }
  return labelMap[status] || '未知'
}

// 判断是否可以退款
const canRefund = (status: string) => {
  return ['PENDING', 'ACCEPTED', 'ARRIVED', 'STARTED'].includes(status)
}

// 日期变化处理
const handleDateChange = (dates: string[]) => {
  if (dates && dates.length === 2) {
    queryParams.startDate = dates[0]
    queryParams.endDate = dates[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
  handleSearch()
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const result = await getOrders(params)
    console.log('API返回的原始数据:', result)
    
    // 处理不同的数据结构
    let orderList = []
    let totalCount = 0
    
    if (result && result.data && result.data.list && Array.isArray(result.data.list)) {
      // API返回格式: { data: { list: [], total: number } }
      orderList = result.data.list
      totalCount = result.data.total || result.data.list.length
    } else if (result && result.data && Array.isArray(result.data)) {
      // API返回格式: { data: [], total: number }
      orderList = result.data
      totalCount = result.total || result.data.length
    } else if (result && result.items && Array.isArray(result.items)) {
      // 标准分页格式: { items: [], total: number }
      orderList = result.items
      totalCount = result.total || result.items.length
    } else if (Array.isArray(result)) {
      // 直接返回数组
      orderList = result
      totalCount = result.length
    } else {
      console.error('订单数据结构异常:', result)
      ElMessage.error('订单数据格式不正确')
      orderList = []
      totalCount = 0
    }
    
    orders.value = orderList
    pagination.total = totalCount
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
    orders.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 选择变化
const handleSelectionChange = (selection: Order[]) => {
  selectedOrders.value = selection
}

// 查看详情
const handleViewDetail = (order: Order) => {
  ElMessage.info(`查看订单 ${order.orderNo} 的详情`)
}

// 指派订单
const handleAssign = (order: Order) => {
  assignDialog.order = order
  assignDialog.form.providerId = ''
  assignDialog.visible = true
}

// 确认指派
const confirmAssign = async () => {
  if (!assignDialog.order || !assignDialog.form.providerId) {
    ElMessage.warning('请选择服务者')
    return
  }

  assignDialog.loading = true
  try {
    await assignOrder(assignDialog.order.id, assignDialog.form.providerId)
    ElMessage.success('指派成功')
    assignDialog.visible = false
    loadData()
  } catch (error) {
    ElMessage.error('指派失败')
  } finally {
    assignDialog.loading = false
  }
}

// 退款
const handleRefund = async (order: Order) => {
  const confirmed = await confirm({
    message: `确定要对订单 ${order.orderNo} 进行强制退款吗？`,
    type: 'warning',
  })

  if (confirmed) {
    try {
      await refundOrder(order.id, '管理员强制退款')
      ElMessage.success('退款成功')
      loadData()
    } catch (error) {
      ElMessage.error('退款失败')
    }
  }
}

// 删除订单
const handleDelete = async (order: Order) => {
  const confirmed = await confirm({
    message: `确定要删除订单 ${order.orderNo} 吗？删除后将无法恢复！`,
    type: 'error',
  })

  if (confirmed) {
    try {
      await deleteOrder(order.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  console.log('🚀 订单列表页面已加载')
  console.log('📋 当前查询参数:', queryParams)
  loadData()
})
</script>

<style scoped>
.order-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-container {
  margin-top: 24px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
}

.discount-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.total-price {
  font-weight: 600;
  color: #f56c6c;
  font-size: 14px;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.discount {
  font-size: 12px;
  color: #f56c6c;
}

.address-info {
  line-height: 1.4;
}

.address-detail {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.duration {
  font-size: 12px;
  color: #409eff;
  margin-left: 4px;
}
</style>
