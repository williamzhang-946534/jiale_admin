<template>
  <div class="order-list">
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
        <el-table-column prop="userName" label="用户姓名" width="120" />
        <el-table-column prop="serviceName" label="服务项目" width="150" />
        <el-table-column label="服务者" width="120">
          <template #default="{ row }">
            {{ row.providerName || '未指派' }}
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
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="scheduledTime" label="预约时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.scheduledTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
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
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
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
import { getOrders, assignOrder, refundOrder, type Order, type OrderQueryParams } from '@/api/modules/order'

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
  { label: '待指派', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
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
const getStatusTagType = (status: Order['status']) => {
  const typeMap = {
    pending: 'warning',
    assigned: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'info',
    refunded: 'danger',
  }
  return typeMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: Order['status']) => {
  const labelMap = {
    pending: '待指派',
    assigned: '已指派',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return labelMap[status] || '未知'
}

// 判断是否可以退款
const canRefund = (status: Order['status']) => {
  return ['pending', 'assigned', 'in_progress'].includes(status)
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
    orders.value = result.items
    pagination.total = result.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
    // Mock数据
    orders.value = [
      {
        id: '1',
        orderNo: 'ORD20240115001',
        userId: 'u1',
        userName: '用户A',
        serviceId: 's1',
        serviceName: '家政清洁',
        status: 'pending',
        amount: 150,
        address: '北京市朝阳区某某街道',
        scheduledTime: '2024-01-16 10:00:00',
        createdAt: '2024-01-15 14:30:00',
        updatedAt: '2024-01-15 14:30:00',
      },
      {
        id: '2',
        orderNo: 'ORD20240115002',
        userId: 'u2',
        userName: '用户B',
        providerId: 'p1',
        providerName: '张三',
        serviceId: 's2',
        serviceName: '保姆服务',
        status: 'in_progress',
        amount: 200,
        address: '北京市海淀区某某街道',
        scheduledTime: '2024-01-17 14:00:00',
        createdAt: '2024-01-15 16:20:00',
        updatedAt: '2024-01-15 16:20:00',
      },
    ]
    pagination.total = 2
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

onMounted(() => {
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
</style>
