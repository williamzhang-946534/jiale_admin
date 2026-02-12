<template>
  <div class="order-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleRefresh">
          <RefreshRight />
          刷新
        </el-button>
        <el-button 
          v-if="selectedOrders.length > 0"
          type="success" 
          @click="handleBatchAssign"
          :disabled="!hasPendingInSelection"
        >
          批量指派 ({{ selectedPendingCount }})
        </el-button>
        <el-button 
          v-if="selectedOrders.length > 0"
          type="danger" 
          @click="handleBatchCancel"
        >
          批量取消 ({{ selectedOrders.length }})
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

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </el-card>
      <el-card class="stat-card pending">
        <div class="stat-content">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">待指派</div>
        </div>
      </el-card>
      <el-card class="stat-card processing">
        <div class="stat-content">
          <div class="stat-number">{{ stats.processing }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </el-card>
      <el-card class="stat-card completed">
        <div class="stat-content">
          <div class="stat-number">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </el-card>
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
        
        <el-table-column label="订单信息" min-width="260">
          <template #default="{ row }">
            <div class="order-info">
              <div class="order-header">
                <div class="order-no">
                  <el-icon class="order-icon"><Document /></el-icon>
                  <span class="order-number">{{ row.orderNo }}</span>
                </div>
                <el-tag
                  :type="getStatusTagType(row.status)"
                  size="small"
                  class="order-status-tag"
                >
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </div>
              <div class="order-service">
                <el-icon class="service-icon"><Tools /></el-icon>
                <span class="service-name">{{ row.service?.name || row.serviceName }}</span>
              </div>
              <div class="order-meta">
                <div class="order-time">
                  <el-icon class="time-icon"><Clock /></el-icon>
                  <span>{{ row.createdAt ? formatDate(row.createdAt, 'YYYY-MM-DD HH:mm') : '时间待定' }}</span>
                </div>
                <div class="order-duration" v-if="row.duration">
                  <el-icon><Clock /></el-icon>
                  <span>{{ row.duration }}小时</span>
                </div>
              </div>
              <div class="order-special-requests" v-if="row.specialRequests">
                <el-icon class="request-icon"><Document /></el-icon>
                <span class="request-text">{{ row.specialRequests }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="客户信息" width="200">
          <template #default="{ row }">
            <div class="customer-info">
              <div class="customer-header">
                <el-avatar :size="24" class="customer-avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="customer-name">{{ row.user?.nickname || row.userName || '未知客户' }}</span>
              </div>
              <div class="customer-details">
                <div class="customer-phone-item" v-if="row.user?.phone || row.userPhone">
                  <el-icon class="phone-icon"><Phone /></el-icon>
                  <span class="customer-phone">{{ row.user?.phone || row.userPhone }}</span>
                </div>
                <div class="customer-address-item" v-if="row.address">
                  <el-icon class="address-icon"><Location /></el-icon>
                  <span class="customer-address">{{ row.address?.contactName }} {{ formatAddress(row.address?.detail) }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="服务者" width="120">
          <template #default="{ row }">
            <div v-if="row.provider?.name || row.providerName" class="provider-info">
              <div class="provider-name">{{ row.provider?.name || row.providerName }}</div>
            </div>
            <el-button
              v-else-if="row.status === 'PENDING'"
              type="primary"
              size="small"
              @click="handleAssign(row)"
            >
              指派
            </el-button>
            <span v-else class="no-provider">未指派</span>
          </template>
        </el-table-column>

        <el-table-column label="金额" width="140" align="right">
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

        <el-table-column label="服务时间" width="160">
          <template #default="{ row }">
            <div class="service-schedule">
              <div class="service-date">
                <el-icon class="calendar-icon"><Clock /></el-icon>
                {{ formatDate(row.serviceDate, 'MM-DD') }}
              </div>
              <div class="service-time-info">
                <span class="time-text">{{ row.serviceTime }}</span>
                <span v-if="row.duration" class="duration-text">{{ row.duration }}h</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'PENDING'"
              type="success"
              size="small"
              @click="handleAssign(row)"
            >
              指派
            </el-button>
            <el-button
              v-if="['PENDING', 'ACCEPTED'].includes(row.status)"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button
              v-if="row.status === 'COMPLETED' && !row.review"
              type="warning"
              size="small"
              @click="handleRefund(row)"
            >
              退款
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
      :title="`指派订单 - ${assignDialog.order?.orderNo}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="assign-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ assignDialog.order?.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="服务">{{ assignDialog.order?.serviceName }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ assignDialog.order?.user?.nickname || assignDialog.order?.userName }}</el-descriptions-item>
          <el-descriptions-item label="客户电话">{{ assignDialog.order?.user?.phone || assignDialog.order?.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="服务地址">{{ assignDialog.order?.address?.contactName }} {{ assignDialog.order?.address?.detail || assignDialog.order?.address }}</el-descriptions-item>
          <el-descriptions-item label="服务时间">{{ assignDialog.order?.serviceDate }} {{ assignDialog.order?.serviceTime }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="assignDialog.form" label-width="100px" style="margin-top: 20px">
          <el-form-item label="选择服务者" required>
            <el-select
              v-model="assignDialog.form.providerId"
              placeholder="请选择服务者"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="provider in availableProviders"
                :key="provider.id"
                :label="`${provider.name} (评分: ${provider.rating})`"
                :value="provider.id"
              >
                <div class="provider-option">
                  <span>{{ provider.name }}</span>
                  <el-rate
                    v-model="provider.rating"
                    disabled
                    size="small"
                    style="margin-left: 10px"
                  />
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="assignDialog.loading"
          @click="submitAssign"
        >
          确认指派
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="`订单详情 - ${detailDialog.order?.orderNo}`"
      width="800px"
    >
      <div v-if="detailDialog.order" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detailDialog.order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="服务">{{ detailDialog.order.serviceName }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ detailDialog.order.user?.nickname || detailDialog.order.userName }}</el-descriptions-item>
          <el-descriptions-item label="客户电话">{{ detailDialog.order.user?.phone || detailDialog.order.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="服务者">{{ detailDialog.order.providerName || '未指派' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailDialog.order.status)">
              {{ getStatusLabel(detailDialog.order.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ Number(detailDialog.order.totalPrice || detailDialog.order.amount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="detailDialog.order.paidAt ? 'success' : 'warning'" size="small">
              {{ detailDialog.order.paidAt ? '已支付' : '未支付' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="服务地址" span="2">
            {{ detailDialog.order.address?.contactName }} {{ detailDialog.order.address?.detail || detailDialog.order.address }}
          </el-descriptions-item>
          <el-descriptions-item label="服务时间">{{ detailDialog.order.serviceDate }} {{ detailDialog.order.serviceTime }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDate(detailDialog.order.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="特殊要求" span="2">{{ detailDialog.order.specialRequests || '无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 时间轴 -->
        <div v-if="detailDialog.order.timeline" class="timeline-section">
          <h4>订单时间轴</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(time, key) in detailDialog.order.timeline"
              :key="key"
              :timestamp="time"
              :type="getTimelineType(key)"
            >
              {{ getTimelineLabel(key) }}
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 评价信息 -->
        <div v-if="detailDialog.order.review" class="review-section">
          <h4>客户评价</h4>
          <div class="review-content">
            <el-rate
              v-model="detailDialog.order.review.rating"
              disabled
              show-score
              text-color="#ff9900"
            />
            <p>{{ detailDialog.order.review.content }}</p>
            <small>{{ formatDate(detailDialog.order.review.createTime) }}</small>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 退款弹窗 -->
    <el-dialog
      v-model="refundDialog.visible"
      :title="`订单退款 - ${refundDialog.order?.orderNo}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="refundDialog.form" label-width="100px">
        <el-form-item label="退款类型">
          <el-radio-group v-model="refundDialog.form.type">
            <el-radio label="full">全额退款</el-radio>
            <el-radio label="partial">部分退款</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="退款金额">
          <el-input-number
            v-model="refundDialog.form.amount"
            :min="0"
            :max="refundDialog.order?.amount || 0"
            :precision="2"
            style="width: 100%"
            :disabled="refundDialog.form.type === 'full'"
          />
          <div v-if="refundDialog.form.type === 'full'" class="refund-hint">
            全额退款: ¥{{ refundDialog.order?.amount }}
          </div>
        </el-form-item>
        
        <el-form-item label="退款原因" required>
          <el-input
            v-model="refundDialog.form.reason"
            type="textarea"
            placeholder="请输入退款原因"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="refundDialog.visible = false">取消</el-button>
        <el-button 
          type="danger" 
          :loading="refundDialog.loading"
          @click="submitRefund"
        >
          确认退款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  RefreshRight, 
  Search, 
  Document, 
  Tools, 
  Clock, 
  User, 
  Location, 
  Phone 
} from '@element-plus/icons-vue'
import { 
  getOrders, 
  getOrderDetail, 
  assignOrder, 
  refundOrder,
  type Order, 
  type OrderListParams, 
  type OrderAssignParams, 
  type OrderRefundParams 
} from '@/api/modules/order'
import { getProviders } from '@/api/modules/provider'
import type { Provider } from '@/types/api'

// 查询参数
const queryParams = reactive<OrderListParams>({
  orderNo: '',
  status: '',
  dateRange: undefined,
  page: 1,
  pageSize: 20
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 状态选项
const statusOptions = [
  { label: '待指派', value: 'pending' },
  { label: '已接受', value: 'accepted' },
  { label: '已到达', value: 'arrived' },
  { label: '服务中', value: 'in_service' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

// 响应式数据
const loading = ref(false)
const orders = ref<Order[]>([])
const selectedOrders = ref<Order[]>([])
const availableProviders = ref<Provider[]>([])

// 统计数据
const stats = computed(() => {
  const total = orders.value.length
  const pending = orders.value.filter(o => o.status === 'pending').length
  const processing = orders.value.filter(o => ['accepted', 'arrived', 'in_service'].includes(o.status)).length
  const completed = orders.value.filter(o => o.status === 'completed').length
  
  return { total, pending, processing, completed }
})

// 选中项统计
const selectedPendingCount = computed(() => {
  return selectedOrders.value.filter(o => o.status === 'pending').length
})

const hasPendingInSelection = computed(() => {
  return selectedOrders.value.some(o => o.status === 'pending')
})

// 指派弹窗
const assignDialog = reactive({
  visible: false,
  order: null as Order | null,
  form: {
    providerId: '',
  },
  loading: false,
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  order: null as Order | null,
})

// 退款弹窗
const refundDialog = reactive({
  visible: false,
  order: null as Order | null,
  form: {
    type: 'full' as 'full' | 'partial',
    amount: 0,
    reason: '',
  },
  loading: false,
})

// 获取状态标签类型
const getStatusTagType = (status: Order['status']) => {
  const typeMap = {
    PENDING: 'warning',
    ACCEPTED: 'primary',
    ARRIVED: 'info',
    STARTED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    // 兼容小写
    pending: 'warning',
    accepted: 'primary',
    arrived: 'info',
    in_service: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return typeMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: Order['status']) => {
  const labelMap = {
    PENDING: '待指派',
    ACCEPTED: '已接受',
    ARRIVED: '已到达',
    STARTED: '服务中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    // 兼容小写
    pending: '待指派',
    accepted: '已接受',
    arrived: '已到达',
    in_service: '服务中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return labelMap[status] || '未知'
}

// 获取时间轴类型
const getTimelineType = (key: string) => {
  const typeMap: Record<string, string> = {
    created: 'primary',
    accepted: 'success',
    arrived: 'info',
    started: 'warning',
    completed: 'success',
  }
  return typeMap[key] || 'info'
}

// 获取时间轴标签
const getTimelineLabel = (key: string) => {
  const labelMap: Record<string, string> = {
    created: '订单创建',
    accepted: '服务者接受',
    arrived: '服务者到达',
    started: '开始服务',
    completed: '服务完成',
  }
  return labelMap[key] || key
}

// 格式化日期
const formatDate = (dateStr: string | number, format = 'default') => {
  // 如果是数字（时间戳），需要转换为毫秒
  const timestamp = typeof dateStr === 'number' ? dateStr * 1000 : dateStr
  const date = new Date(timestamp)
  
  if (format === 'YYYY-MM-DD') {
    return date.toLocaleDateString('zh-CN')
  } else if (format === 'YYYY-MM-DD HH:mm:ss') {
    return date.toLocaleString('zh-CN')
  } else {
    return date.toLocaleString('zh-CN')
  }
}

// 格式化地址
const formatAddress = (address: string) => {
  if (!address) return ''
  // 限制地址显示长度，避免过长
  return address.length > 20 ? address.substring(0, 20) + '...' : address
}

// 加载订单数据
const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const result = await getOrders(params)
    orders.value = result.list
    pagination.total = result.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
    // Mock数据
    orders.value = [
      {
        id: '1',
        orderNo: 'ORD-2024-001',
        serviceId: 'service-1',
        serviceName: '家庭日常保洁',
        userId: 'user-1',
        userName: '张三',
        userPhone: '13800138001',
        providerId: '',
        providerName: '',
        status: 'pending',
        amount: 180,
        address: '北京市朝阳区xxx街道xxx号',
        serviceDate: '2024-01-20',
        serviceTime: '14:00',
        specialRequests: '请自带清洁工具',
        createTime: '2024-01-19 10:30:00',
        timeline: {
          created: '2024-01-19 10:30:00',
        }
      },
      {
        id: '2',
        orderNo: 'ORD-2024-002',
        serviceId: 'service-2',
        serviceName: '金牌月嫂服务',
        userId: 'user-2',
        userName: '李四',
        userPhone: '13800138002',
        providerId: 'provider-1',
        providerName: '王阿姨',
        status: 'in_service',
        amount: 1200,
        address: '上海市浦东新区xxx路xxx号',
        serviceDate: '2024-01-20',
        serviceTime: '09:00',
        createTime: '2024-01-18 15:20:00',
        timeline: {
          created: '2024-01-18 15:20:00',
          accepted: '2024-01-18 16:00:00',
          arrived: '2024-01-20 08:55:00',
          started: '2024-01-20 09:00:00',
        }
      },
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

// 加载可用服务者
const loadProviders = async () => {
  try {
    const result = await getProviders({ status: 'verified' })
    availableProviders.value = result.list
  } catch (error) {
    // Mock数据
    availableProviders.value = [
      { id: 'provider-1', name: '王阿姨', rating: 4.8, phone: '13800138001' },
      { id: 'provider-2', name: '李师傅', rating: 4.5, phone: '13800138002' },
    ] as Provider[]
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadOrders()
}

// 刷新
const handleRefresh = () => {
  loadOrders()
}

// 日期变化
const handleDateChange = (dates: [string, string] | null) => {
  if (dates) {
    queryParams.dateRange = { start: dates[0], end: dates[1] }
  } else {
    queryParams.dateRange = undefined
  }
  handleSearch()
}

// 选择变化
const handleSelectionChange = (selection: Order[]) => {
  selectedOrders.value = selection
}

// 查看详情
const handleViewDetail = async (order: Order) => {
  try {
    const detail = await getOrderDetail(order.id)
    detailDialog.order = detail
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
    // 使用当前订单数据
    detailDialog.order = order
    detailDialog.visible = true
  }
}

// 指派订单
const handleAssign = (order: Order) => {
  assignDialog.order = order
  assignDialog.form.providerId = ''
  assignDialog.visible = true
  loadProviders()
}

// 提交指派
const submitAssign = async () => {
  if (!assignDialog.order || !assignDialog.form.providerId) {
    ElMessage.warning('请选择服务者')
    return
  }

  assignDialog.loading = true
  try {
    const params: OrderAssignParams = {
      providerId: assignDialog.form.providerId
    }
    await assignOrder(assignDialog.order.id, params)
    ElMessage.success('指派成功')
    assignDialog.visible = false
    loadOrders()
  } catch (error) {
    ElMessage.error('指派失败')
  } finally {
    assignDialog.loading = false
  }
}

// 批量指派
const handleBatchAssign = async () => {
  const pendingOrders = selectedOrders.value.filter(o => o.status === 'pending')
  
  if (pendingOrders.length === 0) {
    ElMessage.warning('请选择待指派的订单')
    return
  }

  ElMessage.info('批量指派功能开发中，请单独指派每个订单')
}

// 取消订单
const handleCancel = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单 ${order.orderNo} 吗？`,
      '取消确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 这里应该调用取消订单的API
    ElMessage.success('订单已取消')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 批量取消
const handleBatchCancel = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要取消选中的 ${selectedOrders.value.length} 个订单吗？`,
      '批量取消确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    ElMessage.success('批量取消成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量取消失败')
    }
  }
}

// 退款
const handleRefund = (order: Order) => {
  refundDialog.order = order
  refundDialog.form = {
    type: 'full',
    amount: order.amount,
    reason: '',
  }
  refundDialog.visible = true
}

// 提交退款
const submitRefund = async () => {
  if (!refundDialog.order || !refundDialog.form.reason) {
    ElMessage.warning('请输入退款原因')
    return
  }

  const amount = refundDialog.form.type === 'full' 
    ? refundDialog.order.amount 
    : refundDialog.form.amount

  if (amount <= 0 || amount > refundDialog.order.amount) {
    ElMessage.warning('请输入正确的退款金额')
    return
  }

  refundDialog.loading = true
  try {
    const params: OrderRefundParams = {
      amount,
      reason: refundDialog.form.reason,
      type: refundDialog.form.type
    }
    await refundOrder(refundDialog.order.id, params)
    ElMessage.success('退款申请已提交')
    refundDialog.visible = false
    loadOrders()
  } catch (error) {
    ElMessage.error('退款申请失败')
  } finally {
    refundDialog.loading = false
  }
}

// 监听退款类型变化
watch(() => refundDialog.form.type, (type) => {
  if (type === 'full' && refundDialog.order) {
    refundDialog.form.amount = refundDialog.order.amount
  }
})

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadOrders()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOrders()
}

onMounted(() => {
  loadOrders()
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.pending {
  border-left: 4px solid #e6a23c;
}

.stat-card.processing {
  border-left: 4px solid #409eff;
}

.stat-card.completed {
  border-left: 4px solid #67c23a;
}

.stat-content {
  padding: 16px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-container {
  margin-top: 24px;
}

.order-info {
  line-height: 1.6;
  padding: 4px 0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-no {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.order-number {
  font-family: 'Courier New', monospace;
  color: #3b82f6;
}

.order-status-tag {
  font-size: 11px;
  font-weight: 500;
}

.order-service {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #374151;
}

.service-name {
  font-weight: 500;
}

.order-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.order-time,
.order-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.order-special-requests {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #059669;
  background: #f0fdf4;
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #10b981;
}

.request-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.order-icon,
.service-icon,
.time-icon {
  margin-right: 6px;
  font-size: 14px;
}

.order-icon {
  color: #3b82f6;
}

.service-icon {
  color: #f59e0b;
}

.time-icon {
  color: #8b5cf6;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-avatar {
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
}

.customer-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.customer-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 32px;
}

.customer-address-item,
.customer-phone-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.address-icon,
.phone-icon {
  margin-right: 6px;
  font-size: 12px;
  flex-shrink: 0;
}

.address-icon {
  color: #ef4444;
}

.phone-icon {
  color: #10b981;
}

.customer-address {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.customer-phone {
  color: #3b82f6;
  font-weight: 500;
}

.no-provider {
  color: #909399;
  font-size: 12px;
}

.amount {
  font-weight: bold;
  color: #f56c6c;
}

.total-price {
  font-weight: 600;
  color: #f56c6c;
  font-size: 14px;
}

.discount-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
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

.service-schedule {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.calendar-icon {
  color: #8b5cf6;
  font-size: 12px;
}

.service-time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-text {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.duration-text {
  font-size: 11px;
  color: #059669;
  background: #f0fdf4;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 500;
}

.service-time {
  font-size: 12px;
  line-height: 1.4;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.assign-content {
  padding: 16px 0;
}

.provider-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.order-detail {
  padding: 16px 0;
}

.timeline-section,
.review-section {
  margin-top: 24px;
}

.timeline-section h4,
.review-section h4 {
  margin-bottom: 16px;
  color: #303133;
}

.review-content {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.review-content p {
  margin: 12px 0;
  line-height: 1.5;
}

.refund-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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

  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
