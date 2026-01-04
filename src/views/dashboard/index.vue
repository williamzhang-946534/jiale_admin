<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalGmv?.toLocaleString() || 0 }}</div>
            <div class="stat-label">总销售额 (元)</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon orders">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayOrders || 0 }}</div>
            <div class="stat-label">今日订单量</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon providers">
            <el-icon><Avatar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingProviders || 0 }}</div>
            <div class="stat-label">待审核阿姨</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active-users">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeUsers || 0 }}</div>
            <div class="stat-label">活跃用户数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="24">
      <el-col :span="16">
        <el-card title="业务趋势" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>业务趋势</span>
              <el-select v-model="chartRange" size="small" style="width: 120px" @change="loadChartData">
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
                <el-option label="本年" value="year" />
              </el-select>
            </div>
          </template>
          <div ref="chartContainer" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card title="快捷操作" class="quick-actions-card">
          <div class="quick-actions">
            <div class="action-item" @click="goToProviders">
              <el-icon class="action-icon"><Avatar /></el-icon>
              <div class="action-content">
                <div class="action-title">服务者审核</div>
                <div class="action-desc">{{ stats.pendingProviders || 0 }} 人待审核</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            
            <div class="action-item" @click="goToOrders">
              <el-icon class="action-icon"><Document /></el-icon>
              <div class="action-content">
                <div class="action-title">订单管理</div>
                <div class="action-desc">{{ stats.todayOrders || 0 }} 个今日订单</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
            
            <div class="action-item" @click="goToUsers">
              <el-icon class="action-icon"><User /></el-icon>
              <div class="action-content">
                <div class="action-title">用户管理</div>
                <div class="action-desc">{{ stats.activeUsers || 0 }} 个活跃用户</div>
              </div>
              <el-icon class="action-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Avatar, Document, ArrowRight } from '@element-plus/icons-vue'
import { getDashboardStats, getDashboardCharts } from '@/api/modules/dashboard'
import { useAuthStore } from '@/store/auth'
import type { DashboardStats, DashboardChart } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<DashboardStats>({
  totalGmv: 0,
  todayOrders: 0,
  pendingProviders: 0,
  activeUsers: 0
})

const chartData = ref<DashboardChart>({
  labels: [],
  orderValues: [],
  revenueValues: []
})

const chartRange = ref<'week' | 'month' | 'year'>('week')
const chartContainer = ref<HTMLElement>()

const loadStats = async () => {
  try {
    const data = await getDashboardStats()
    stats.value = data
  } catch (error) {
    ElMessage.error('获取统计数据失败')
    // Mock数据
    stats.value = {
      totalGmv: 125800,
      todayOrders: 45,
      pendingProviders: 12,
      activeUsers: 340
    }
  }
}

const loadChartData = async () => {
  try {
    const data = await getDashboardCharts({ range: chartRange.value })
    chartData.value = data
    renderChart()
  } catch (error) {
    ElMessage.error('获取图表数据失败')
    // Mock数据
    chartData.value = {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      orderValues: [12, 19, 15, 25, 22, 30, 28],
      revenueValues: [1200, 1900, 1500, 2500, 2200, 3000, 2800]
    }
    renderChart()
  }
}

const renderChart = () => {
  // 这里可以集成 ECharts 或其他图表库
  // 简单的CSS图表实现
  nextTick(() => {
    if (chartContainer.value) {
      // 实现图表渲染逻辑
      console.log('渲染图表:', chartData.value)
    }
  })
}

const goToProviders = () => {
  router.push('/provider/list')
}

const goToOrders = () => {
  router.push('/order/list')
}

const goToUsers = () => {
  router.push('/user/list')
}

onMounted(() => {
  loadStats()
  loadChartData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
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

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.providers {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.active-users {
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

.chart-card {
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  position: relative;
}

.chart-container::before {
  content: '图表功能开发中...';
  color: #909399;
  font-size: 14px;
}

.quick-actions-card {
  height: fit-content;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #909399;
}

.action-arrow {
  color: #c0c4cc;
  transition: all 0.3s ease;
}

.action-item:hover .action-arrow {
  color: #409eff;
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 200px;
  }
}
</style>
