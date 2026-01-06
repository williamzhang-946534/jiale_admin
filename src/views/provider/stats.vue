<template>
  <div class="provider-stats-page">
    <div class="page-header">
      <h2>服务者统计</h2>
      <div class="provider-info">
        <el-avatar :src="providerDetail.avatar" :size="50" />
        <div class="info-content">
          <h3>{{ providerDetail.name }}</h3>
          <p>{{ providerDetail.phone }}</p>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ monthlyStats.totalOrders || 0 }}</div>
            <div class="stat-label">本月订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">¥{{ monthlyStats.totalRevenue || 0 }}</div>
            <div class="stat-label">本月收入</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ monthlyStats.workingDays || 0 }}</div>
            <div class="stat-label">工作天数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">¥{{ providerDetail.walletBalance || 0 }}</div>
            <div class="stat-label">钱包余额</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 查询条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="统计类型">
          <el-radio-group v-model="statsType" @change="handleStatsTypeChange">
            <el-radio-button label="daily">每日统计</el-radio-button>
            <el-radio-button label="monthly">月度统计</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="statsType === 'daily'" label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadDailyStats"
          />
        </el-form-item>
        
        <el-form-item v-if="statsType === 'monthly'" label="月份">
          <el-date-picker
            v-model="selectedMonth"
            type="month"
            placeholder="选择月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
            @change="loadMonthlyStats"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计图表 -->
    <el-card class="chart-card">
      <template #header>
        <span>{{ statsType === 'daily' ? '每日统计' : '月度统计' }}</span>
      </template>
      
      <div v-loading="loading" class="chart-container">
        <div v-if="statsType === 'daily'" class="daily-stats">
          <el-table :data="dailyStats" stripe>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="orderCount" label="订单数" width="100" align="center" />
            <el-table-column prop="orderAmount" label="订单金额" width="120" align="center">
              <template #default="{ row }">
                ¥{{ row.orderAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="earnings" label="收入" width="120" align="center">
              <template #default="{ row }">
                ¥{{ row.earnings }}
              </template>
            </el-table-column>
            <el-table-column label="订单类型分布">
              <template #default="{ row }">
                <el-tag
                  v-for="(count, type) in row.orderTypes"
                  :key="type"
                  size="small"
                  class="order-type-tag"
                >
                  {{ type }}: {{ count }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-else class="monthly-stats">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="年份">{{ monthlyStats.year }}</el-descriptions-item>
            <el-descriptions-item label="月份">{{ monthlyStats.month }}</el-descriptions-item>
            <el-descriptions-item label="总订单数">{{ monthlyStats.totalOrders }}</el-descriptions-item>
            <el-descriptions-item label="总收入">¥{{ monthlyStats.totalRevenue }}</el-descriptions-item>
            <el-descriptions-item label="总收益">¥{{ monthlyStats.totalEarnings }}</el-descriptions-item>
            <el-descriptions-item label="工作天数">{{ monthlyStats.workingDays }}</el-descriptions-item>
          </el-descriptions>
          
          <h4 style="margin-top: 20px;">每日明细</h4>
          <el-table :data="monthlyStats.dailyStats" stripe max-height="400">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="orderCount" label="订单数" width="100" align="center" />
            <el-table-column prop="orderAmount" label="订单金额" width="120" align="center">
              <template #default="{ row }">
                ¥{{ row.orderAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="earnings" label="收入" width="120" align="center">
              <template #default="{ row }">
                ¥{{ row.earnings }}
              </template>
            </el-table-column>
            <el-table-column label="订单类型分布">
              <template #default="{ row }">
                <el-tag
                  v-for="(count, type) in row.orderTypes"
                  :key="type"
                  size="small"
                  class="order-type-tag"
                >
                  {{ type }}: {{ count }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  getProviderDetail, 
  getProviderDailyStats, 
  getProviderMonthlyStats 
} from '@/api/modules/provider'
import type { ProviderDetail, ProviderDailyStats, ProviderMonthlyStats } from '@/types/api'

const route = useRoute()
const providerId = route.params.id as string

const loading = ref(false)
const statsType = ref<'daily' | 'monthly'>('daily')
const dateRange = ref<[string, string]>()
const selectedMonth = ref<string>()

const providerDetail = ref<ProviderDetail>({
  id: '',
  name: '',
  phone: '',
  avatar: '',
  status: 'unverified',
  isBanned: false,
  createTime: '',
  rating: 0,
  intro: '',
  totalOrders: 0,
  totalRevenue: 0,
  walletBalance: 0,
  withdrawableBalance: 0,
  age: 0,
  experience: 0,
  zodiac: '',
  chineseZodiac: '',
  hometown: '',
  homeAddress: '',
  expectedSalary: 0,
  actualSalary: 0,
  providerTypes: [],
  serviceArea: '',
  isOnline: false,
  isRecommended: false,
  currentOrder: null
})

const dailyStats = ref<ProviderDailyStats[]>([])
const monthlyStats = ref<ProviderMonthlyStats>({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  totalOrders: 0,
  totalRevenue: 0,
  totalEarnings: 0,
  workingDays: 0,
  dailyStats: []
})

// 加载服务者详情
const loadProviderDetail = async () => {
  try {
    const response = await getProviderDetail(providerId)
    providerDetail.value = response.data
  } catch (error) {
    ElMessage.error('获取服务者详情失败')
  }
}

// 加载每日统计
const loadDailyStats = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value
    const response = await getProviderDailyStats(providerId, { startDate, endDate })
    dailyStats.value = response.data
  } catch (error) {
    ElMessage.error('获取每日统计失败')
  } finally {
    loading.value = false
  }
}

// 加载月度统计
const loadMonthlyStats = async () => {
  if (!selectedMonth.value) {
    ElMessage.warning('请选择月份')
    return
  }
  
  loading.value = true
  try {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    const response = await getProviderMonthlyStats(providerId, { year, month })
    monthlyStats.value = response.data
  } catch (error) {
    ElMessage.error('获取月度统计失败')
  } finally {
    loading.value = false
  }
}

// 切换统计类型
const handleStatsTypeChange = (type: 'daily' | 'monthly') => {
  statsType.value = type
  if (type === 'daily') {
    // 默认显示最近7天的数据
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)
    dateRange.value = [
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ]
    loadDailyStats()
  } else {
    // 默认显示当前月的数据
    const now = new Date()
    selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    loadMonthlyStats()
  }
}

onMounted(() => {
  loadProviderDetail()
  handleStatsTypeChange('daily')
})
</script>

<style scoped>
.provider-stats-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-content h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.info-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.filter-card {
  margin-bottom: 20px;
}

.chart-card {
  min-height: 400px;
}

.chart-container {
  min-height: 300px;
}

.order-type-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.daily-stats,
.monthly-stats {
  width: 100%;
}
</style>
