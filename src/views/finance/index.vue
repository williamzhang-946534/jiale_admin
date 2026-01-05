<template>
  <div class="finance-page">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon income">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalIncome?.toLocaleString() || 0 }}</div>
            <div class="stat-label">总收入 (元)</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingWithdrawals || 0 }}</div>
            <div class="stat-label">待提现笔数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon providers">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeProviders || 0 }}</div>
            <div class="stat-label">活跃服务者</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon today">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayIncome?.toLocaleString() || 0 }}</div>
            <div class="stat-label">今日收入 (元)</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 收入图表 -->
    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <span>收入趋势</span>
          <el-select v-model="chartRange" size="small" style="width: 120px" @change="loadChartData">
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="本年" value="year" />
          </el-select>
        </div>
      </template>
      <div ref="chartContainer" class="chart-container"></div>
    </el-card>

    <!-- 提现管理 -->
    <el-card class="withdrawal-card">
      <template #header>
        <div class="card-header">
          <span>提现审核</span>
          <div class="header-actions">
            <el-select v-model="withdrawalStatus" placeholder="筛选状态" style="width: 120px" @change="loadWithdrawals">
              <el-option label="全部" value="" />
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
            <el-button @click="loadWithdrawals" :loading="withdrawalLoading">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="withdrawals" v-loading="withdrawalLoading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="服务者信息" min-width="200">
          <template #default="{ row }">
            <div class="provider-info">
              <div class="provider-name">{{ row.providerName }}</div>
              <div class="provider-phone">{{ row.providerPhone }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="withdrawalAmount" label="提现金额" width="120" align="center">
          <template #default="{ row }">
            <div class="amount">¥{{ row.withdrawalAmount }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="bankInfo" label="银行卡信息" min-width="200">
          <template #default="{ row }">
            <div class="bank-info">
              <div>{{ row.bankInfo.bankName }}</div>
              <div>{{ row.bankInfo.cardNumber }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="applyTime" label="申请时间" width="180" />

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'"
              link 
              type="success" 
              size="small" 
              @click="approveWithdrawal(row)"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'"
              link 
              type="danger" 
              size="small" 
              @click="rejectWithdrawal(row)"
            >
              拒绝
            </el-button>
            <el-button link type="primary" size="small" @click="viewWithdrawalDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="withdrawalPagination.page"
          v-model:page-size="withdrawalPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="withdrawalPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleWithdrawalSizeChange"
          @current-change="handleWithdrawalPageChange"
        />
      </div>
    </el-card>

    <!-- 提现详情对话框 -->
    <el-dialog v-model="detailVisible" title="提现详情" width="600px">
      <div v-if="currentWithdrawal" class="withdrawal-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请ID">{{ currentWithdrawal.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentWithdrawal.status)">
              {{ getStatusText(currentWithdrawal.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="服务者姓名">{{ currentWithdrawal.providerName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentWithdrawal.providerPhone }}</el-descriptions-item>
          <el-descriptions-item label="提现金额">¥{{ currentWithdrawal.withdrawalAmount }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentWithdrawal.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="银行名称" span="2">{{ currentWithdrawal.bankInfo.bankName }}</el-descriptions-item>
          <el-descriptions-item label="银行卡号" span="2">{{ currentWithdrawal.bankInfo.cardNumber }}</el-descriptions-item>
          <el-descriptions-item label="开户行" span="2">{{ currentWithdrawal.bankInfo.branchName }}</el-descriptions-item>
          <el-descriptions-item label="持卡人姓名" span="2">{{ currentWithdrawal.bankInfo.accountName }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentWithdrawal.rejectReason" class="reject-reason">
          <h4>拒绝原因</h4>
          <p>{{ currentWithdrawal.rejectReason }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 拒绝提现对话框 -->
    <el-dialog v-model="rejectDialog.visible" title="拒绝提现" width="500px">
      <el-form :model="rejectDialog.form" label-width="100px">
        <el-form-item label="拒绝原因" required>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, Clock, User, TrendCharts } from '@element-plus/icons-vue'
import { 
  getFinanceStats, 
  getFinanceChart, 
  getWithdrawals, 
  approveWithdrawal as approveWithdrawalApi,
  rejectWithdrawal as rejectWithdrawalApi
} from '@/api/modules/finance'
import type { FinanceStats, FinanceChart, Withdrawal } from '@/types/api'

const stats = ref<FinanceStats>({
  totalIncome: 0,
  pendingWithdrawals: 0,
  activeProviders: 0,
  todayIncome: 0
})

const chartData = ref<FinanceChart>({
  labels: [],
  values: []
})

const chartRange = ref<'week' | 'month' | 'year'>('week')
const chartContainer = ref<HTMLElement>()

const withdrawals = ref<Withdrawal[]>([])
const withdrawalLoading = ref(false)
const withdrawalStatus = ref('')
const currentWithdrawal = ref<Withdrawal | null>(null)
const detailVisible = ref(false)

const withdrawalPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const rejectDialog = reactive({
  visible: false,
  loading: false,
  withdrawalId: '',
  form: {
    reason: ''
  }
})

const loadStats = async () => {
  try {
    const data = await getFinanceStats()
    stats.value = data
  } catch (error) {
    ElMessage.error('获取财务统计失败')
    // Mock数据
    stats.value = {
      totalIncome: 528900,
      pendingWithdrawals: 8,
      activeProviders: 156,
      todayIncome: 3250
    }
  }
}

const loadChartData = async () => {
  try {
    const data = await getFinanceChart({ range: chartRange.value })
    chartData.value = data
    renderChart()
  } catch (error) {
    ElMessage.error('获取图表数据失败')
    // Mock数据
    chartData.value = {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      values: [1200, 1900, 1500, 2500, 2200, 3000, 2800]
    }
    renderChart()
  }
}

const renderChart = () => {
  nextTick(() => {
    if (chartContainer.value) {
      // 简单的CSS图表实现
      const container = chartContainer.value
      const maxValue = Math.max(...chartData.value.values)
      
      container.innerHTML = `
        <div class="simple-chart">
          <div class="chart-bars">
            ${chartData.value.labels.map((label, index) => `
              <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${(chartData.value.values[index] / maxValue) * 200}px"></div>
                <div class="chart-label">${label}</div>
                <div class="chart-value">¥${chartData.value.values[index]}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }
  })
}

const loadWithdrawals = async () => {
  withdrawalLoading.value = true
  try {
    const params = {
      page: withdrawalPagination.page,
      pageSize: withdrawalPagination.pageSize,
      status: withdrawalStatus.value || undefined
    }
    
    const data = await getWithdrawals(params)
    withdrawals.value = data.list
    withdrawalPagination.total = data.total
  } catch (error) {
    ElMessage.error('获取提现列表失败')
    // Mock数据
    withdrawals.value = [
      {
        id: 1,
        providerName: '王阿姨',
        providerPhone: '13800138001',
        withdrawalAmount: 500,
        status: 'pending',
        applyTime: '2024-01-20 10:30:00',
        bankInfo: {
          bankName: '中国工商银行',
          cardNumber: '6222********1234',
          branchName: '北京朝阳支行',
          accountName: '王秀英'
        }
      },
      {
        id: 2,
        providerName: '李师傅',
        providerPhone: '13800138002',
        withdrawalAmount: 800,
        status: 'approved',
        applyTime: '2024-01-19 15:20:00',
        bankInfo: {
          bankName: '中国建设银行',
          cardNumber: '6217********5678',
          branchName: '上海浦东支行',
          accountName: '李建国'
        }
      }
    ]
    withdrawalPagination.total = 2
  } finally {
    withdrawalLoading.value = false
  }
}

const approveWithdrawal = async (withdrawal: Withdrawal) => {
  try {
    await ElMessageBox.confirm(
      `确定要通过 ${withdrawal.providerName} 的提现申请 ¥${withdrawal.withdrawalAmount} 吗？`,
      '确认通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await approveWithdrawalApi(withdrawal.id)
    ElMessage.success('提现已通过')
    loadWithdrawals()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const rejectWithdrawal = (withdrawal: Withdrawal) => {
  rejectDialog.withdrawalId = withdrawal.id
  rejectDialog.form.reason = ''
  rejectDialog.visible = true
}

const submitReject = async () => {
  if (!rejectDialog.form.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  rejectDialog.loading = true
  try {
    await rejectWithdrawalApi(rejectDialog.withdrawalId, {
      reason: rejectDialog.form.reason
    })
    ElMessage.success('提现已拒绝')
    rejectDialog.visible = false
    loadWithdrawals()
    loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    rejectDialog.loading = false
  }
}

const viewWithdrawalDetail = (withdrawal: Withdrawal) => {
  currentWithdrawal.value = withdrawal
  detailVisible.value = true
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return textMap[status] || status
}

const handleWithdrawalPageChange = (page: number) => {
  withdrawalPagination.page = page
  loadWithdrawals()
}

const handleWithdrawalSizeChange = (size: number) => {
  withdrawalPagination.pageSize = size
  withdrawalPagination.page = 1
  loadWithdrawals()
}

onMounted(() => {
  loadStats()
  loadChartData()
  loadWithdrawals()
})
</script>

<style scoped>
.finance-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-icon.income {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.providers {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.today {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.chart-card,
.withdrawal-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-header,
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chart-container {
  height: 300px;
  position: relative;
}

.simple-chart {
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 200px;
  gap: 20px;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.chart-bar {
  width: 40px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border-radius: 4px 4px 0 0;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.chart-value {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

.provider-info {
  line-height: 1.4;
}

.provider-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.provider-phone {
  font-size: 12px;
  color: #606266;
}

.amount {
  font-weight: bold;
  color: #f56c6c;
}

.bank-info {
  line-height: 1.4;
  font-size: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.withdrawal-detail {
  padding: 16px 0;
}

.reject-reason {
  margin-top: 20px;
  padding: 16px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
}

.reject-reason h4 {
  margin-bottom: 8px;
  color: #f56c6c;
}

.reject-reason p {
  color: #606266;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .chart-bars {
    gap: 10px;
  }
  
  .chart-bar {
    width: 30px;
  }
}
</style>
