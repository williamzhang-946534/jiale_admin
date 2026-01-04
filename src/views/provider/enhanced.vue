<template>
  <div class="provider-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleRefresh">
          <RefreshRight />
          刷新
        </el-button>
        <el-button 
          v-if="selectedProviders.length > 0"
          type="success" 
          @click="handleBatchAudit('approve')"
          :disabled="!hasPendingInSelection"
        >
          批量通过 ({{ selectedPendingCount }})
        </el-button>
        <el-button 
          v-if="selectedProviders.length > 0"
          type="danger" 
          @click="handleBatchAudit('reject')"
          :disabled="!hasPendingInSelection"
        >
          批量拒绝 ({{ selectedPendingCount }})
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索姓名/手机号"
          style="width: 200px"
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
          placeholder="选择状态"
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
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总服务者数</div>
        </div>
      </el-card>
      <el-card class="stat-card pending">
        <div class="stat-content">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </el-card>
      <el-card class="stat-card verified">
        <div class="stat-content">
          <div class="stat-number">{{ stats.verified }}</div>
          <div class="stat-label">已认证</div>
        </div>
      </el-card>
      <el-card class="stat-card banned">
        <div class="stat-content">
          <div class="stat-number">{{ stats.banned }}</div>
          <div class="stat-label">已封禁</div>
        </div>
      </el-card>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="providers"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="服务者信息" min-width="200">
          <template #default="{ row }">
            <div class="provider-info">
              <el-avatar :src="row.avatar" :size="50">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <div class="provider-details">
                <div class="provider-name">{{ row.name }}</div>
                <div class="provider-phone">{{ row.phone }}</div>
                <div class="provider-tags">
                  <el-tag v-if="row.isBanned" type="danger" size="small">已封禁</el-tag>
                  <el-tag v-if="row.isVerified" type="success" size="small">已认证</el-tag>
                  <el-tag v-if="row.rating >= 4.5" type="warning" size="small">金牌</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="rating" label="评分" width="120">
          <template #default="{ row }">
            <div class="rating-info">
              <el-rate
                v-model="row.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="serviceCount" label="服务次数" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="viewProviderOrders(row)">
              {{ row.serviceCount }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleAudit(row, 'approve')"
              v-permission="['provider:audit']"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleAudit(row, 'reject')"
              v-permission="['provider:audit']"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status === 'verified' || row.isBanned"
              :type="row.isBanned ? 'success' : 'warning'"
              size="small"
              @click="handleBan(row)"
              v-permission="['provider:ban']"
            >
              {{ row.isBanned ? '解封' : '封禁' }}
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

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="auditDialog.visible"
      :title="`审核服务者 - ${auditDialog.provider?.name}`"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="audit-content">
        <!-- 服务者基本信息 -->
        <div class="provider-summary">
          <el-avatar :src="auditDialog.provider?.avatar" :size="60">
            {{ auditDialog.provider?.name?.charAt(0) }}
          </el-avatar>
          <div class="summary-info">
            <h3>{{ auditDialog.provider?.name }}</h3>
            <p>{{ auditDialog.provider?.phone }}</p>
            <p>注册时间: {{ formatDate(auditDialog.provider?.createTime) }}</p>
          </div>
        </div>

        <el-form :model="auditDialog.form" label-width="100px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="auditDialog.form.action">
              <el-radio label="approve">通过审核</el-radio>
              <el-radio label="reject">拒绝审核</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item
            v-if="auditDialog.form.action === 'reject'"
            label="拒绝原因"
            required
          >
            <el-select v-model="auditDialog.form.reasonType" placeholder="选择拒绝原因" style="width: 100%">
              <el-option label="身份证照片模糊" value="id_card_blur" />
              <el-option label="证书不真实" value="cert_fake" />
              <el-option label="信息不完整" value="info_incomplete" />
              <el-option label="其他原因" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item
            v-if="auditDialog.form.action === 'reject'"
            label="详细说明"
          >
            <el-input
              v-model="auditDialog.form.reason"
              type="textarea"
              placeholder="请输入详细说明"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="auditDialog.loading"
          @click="submitAudit"
        >
          确认审核
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="`服务者详情 - ${detailDialog.provider?.name}`"
      width="800px"
    >
      <div v-if="detailDialog.provider" class="provider-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ detailDialog.provider.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailDialog.provider.phone }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailDialog.provider.status)">
              {{ getStatusLabel(detailDialog.provider.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="评分">
            <el-rate
              v-model="detailDialog.provider.rating"
              disabled
              show-score
              text-color="#ff9900"
            />
          </el-descriptions-item>
          <el-descriptions-item label="服务次数">{{ detailDialog.provider.serviceCount }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(detailDialog.provider.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 证书信息 -->
        <div v-if="detailDialog.provider.certFiles" class="cert-section">
          <h4>资质证书</h4>
          <el-image
            v-for="(cert, index) in detailDialog.provider.certFiles"
            :key="index"
            :src="cert"
            :preview-src-list="detailDialog.provider.certFiles"
            fit="cover"
            class="cert-image"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { getProviders, auditProvider, banProvider, getProviderDetail } from '@/api/modules/provider'
import type { Provider, ProviderDetail, ProviderAuditParams } from '@/types/api'

// 查询参数
const queryParams = reactive({
  keyword: '',
  status: '',
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

// 状态选项
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'verified' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已封禁', value: 'banned' },
]

// 响应式数据
const loading = ref(false)
const providers = ref<Provider[]>([])
const selectedProviders = ref<Provider[]>([])

// 统计数据
const stats = computed(() => {
  const total = providers.value.length
  const pending = providers.value.filter(p => p.status === 'pending').length
  const verified = providers.value.filter(p => p.status === 'verified').length
  const banned = providers.value.filter(p => p.isBanned).length
  
  return { total, pending, verified, banned }
})

// 选中项统计
const selectedPendingCount = computed(() => {
  return selectedProviders.value.filter(p => p.status === 'pending').length
})

const hasPendingInSelection = computed(() => {
  return selectedProviders.value.some(p => p.status === 'pending')
})

// 审核弹窗
const auditDialog = reactive({
  visible: false,
  provider: null as Provider | null,
  form: {
    action: 'approve' as 'approve' | 'reject',
    reasonType: '',
    reason: '',
  },
  loading: false,
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  provider: null as ProviderDetail | null,
})

// 获取状态标签类型
const getStatusTagType = (status: Provider['status']) => {
  const typeMap = {
    unverified: 'info',
    pending: 'warning',
    verified: 'success',
    rejected: 'danger',
    banned: 'danger',
  }
  return typeMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: Provider['status']) => {
  const labelMap = {
    unverified: '未认证',
    pending: '待审核',
    verified: '已通过',
    rejected: '已拒绝',
    banned: '已封禁',
  }
  return labelMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
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
    const result = await getProviders(params)
    providers.value = result.list
    pagination.total = result.total
  } catch (error) {
    ElMessage.error('获取服务者列表失败')
    // Mock数据
    providers.value = [
      {
        id: '1',
        name: '张三',
        phone: '13800138001',
        status: 'pending',
        rating: 4.5,
        serviceCount: 25,
        createTime: '2024-01-15 10:30:00',
        isBanned: false,
        isVerified: false,
        avatar: '',
        description: '经验丰富的保洁阿姨'
      },
      {
        id: '2',
        name: '李四',
        phone: '13800138002',
        status: 'verified',
        rating: 4.8,
        serviceCount: 45,
        createTime: '2024-01-10 14:20:00',
        isBanned: false,
        isVerified: true,
        avatar: '',
        description: '金牌月嫂'
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
const handleSelectionChange = (selection: Provider[]) => {
  selectedProviders.value = selection
}

// 查看详情
const handleViewDetail = async (provider: Provider) => {
  try {
    const detail = await getProviderDetail(provider.id)
    detailDialog.provider = detail
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取服务者详情失败')
    // Mock详情
    detailDialog.provider = {
      ...provider,
      idCard: '110101199001011234',
      certFiles: ['https://example.com/cert1.jpg', 'https://example.com/cert2.jpg'],
      bankInfo: '工商银行 6222021234567890',
      profile: {
        intro: provider.description || '',
        attributes: { age: '35岁', hometown: '河北' },
        stats: { households: 88, reviews: 51 },
        certs: ['母婴护理高级证'],
        gallery: [],
        workHistory: []
      }
    }
    detailDialog.visible = true
  }
}

// 单个审核
const handleAudit = (provider: Provider, action: 'approve' | 'reject') => {
  auditDialog.provider = provider
  auditDialog.form.action = action
  auditDialog.form.reasonType = ''
  auditDialog.form.reason = ''
  auditDialog.visible = true
}

// 批量审核
const handleBatchAudit = async (action: 'approve' | 'reject') => {
  const pendingProviders = selectedProviders.value.filter(p => p.status === 'pending')
  
  if (pendingProviders.length === 0) {
    ElMessage.warning('请选择待审核的服务者')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要${action === 'approve' ? '通过' : '拒绝'}选中的 ${pendingProviders.length} 个服务者吗？`,
      '批量审核确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 执行批量审核
    const promises = pendingProviders.map(provider => 
      auditProvider(provider.id, { action, rejectReason: action === 'reject' ? '批量拒绝' : undefined })
    )
    
    await Promise.all(promises)
    ElMessage.success(`批量${action === 'approve' ? '通过' : '拒绝'}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量审核失败')
    }
  }
}

// 提交审核
const submitAudit = async () => {
  if (!auditDialog.provider) return

  if (auditDialog.form.action === 'reject' && !auditDialog.form.reasonType) {
    ElMessage.warning('请选择拒绝原因')
    return
  }

  auditDialog.loading = true
  try {
    const params: ProviderAuditParams = {
      action: auditDialog.form.action,
    }
    
    if (auditDialog.form.action === 'reject') {
      params.rejectReason = auditDialog.form.reason || auditDialog.form.reasonType
    }

    await auditProvider(auditDialog.provider.id, params)
    ElMessage.success('审核完成')
    auditDialog.visible = false
    loadData()
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    auditDialog.loading = false
  }
}

// 封禁/解封
const handleBan = async (provider: Provider) => {
  const action = provider.isBanned ? '解封' : '封禁'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}服务者 ${provider.name} 吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await banProvider(provider.id, !provider.isBanned)
    ElMessage.success(`${action}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 查看服务者订单
const viewProviderOrders = (provider: Provider) => {
  ElMessage.info(`查看服务者 ${provider.name} 的订单记录`)
  // 这里可以跳转到订单页面并筛选该服务者的订单
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.provider-list {
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

.stat-card.verified {
  border-left: 4px solid #67c23a;
}

.stat-card.banned {
  border-left: 4px solid #f56c6c;
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

.provider-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-details {
  flex: 1;
}

.provider-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.provider-phone {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.provider-tags {
  display: flex;
  gap: 4px;
}

.rating-info {
  display: flex;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.audit-content {
  padding: 16px 0;
}

.provider-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.summary-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.summary-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.provider-detail {
  padding: 16px 0;
}

.cert-section {
  margin-top: 24px;
}

.cert-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.cert-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  margin-right: 12px;
  margin-bottom: 12px;
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
