<template>
  <div class="provider-list">
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
          v-model="queryParams.name"
          placeholder="搜索服务者姓名"
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
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="140" />
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
        <el-table-column prop="rating" label="评分" width="80">
          <template #default="{ row }">
            <span>{{ row.rating.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="serviceCount" label="服务次数" width="100" />
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
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
              v-if="row.status === 'verified'"
              type="warning"
              size="small"
              @click="handleBan(row)"
              v-permission="['provider:ban']"
            >
              封禁
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
      width="500px"
    >
      <el-form :model="auditDialog.form" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditDialog.form.action">
            <el-radio label="approve">通过</el-radio>
            <el-radio label="reject">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="auditDialog.form.action === 'reject'"
          label="拒绝原因"
        >
          <el-input
            v-model="auditDialog.form.reason"
            type="textarea"
            placeholder="请输入拒绝原因"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmAudit"
          :loading="auditDialog.loading"
        >
          确定
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
import { getProviders, auditProvider, banProvider, type Provider, type ProviderQueryParams } from '@/api/modules/provider'

const { confirm } = useConfirm()
const { pagination, handleSizeChange, handleCurrentChange, resetPagination } = usePagination()

// 查询参数
const queryParams = reactive<ProviderQueryParams>({
  page: 1,
  pageSize: 20,
  status: undefined,
  name: '',
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

// 审核弹窗
const auditDialog = reactive({
  visible: false,
  provider: null as Provider | null,
  form: {
    action: 'approve' as 'approve' | 'reject',
    reason: '',
  },
  loading: false,
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
    providers.value = result.items
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
        createdAt: '2024-01-15 10:30:00',
        updatedAt: '2024-01-15 10:30:00',
      },
      {
        id: '2',
        name: '李四',
        phone: '13800138002',
        status: 'verified',
        rating: 4.8,
        serviceCount: 45,
        createdAt: '2024-01-10 14:20:00',
        updatedAt: '2024-01-10 14:20:00',
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
const handleViewDetail = (provider: Provider) => {
  // 这里可以跳转到详情页或打开详情弹窗
  ElMessage.info(`查看服务者 ${provider.name} 的详情`)
}

// 审核
const handleAudit = (provider: Provider, action: 'approve' | 'reject') => {
  auditDialog.provider = provider
  auditDialog.form.action = action
  auditDialog.form.reason = ''
  auditDialog.visible = true
}

// 确认审核
const confirmAudit = async () => {
  if (!auditDialog.provider) return

  auditDialog.loading = true
  try {
    const params = {
      action: auditDialog.form.action,
      rejectReason: auditDialog.form.reason || ''
    }
    
    await auditProvider(auditDialog.provider.id, params)
    ElMessage.success('审核完成')
    auditDialog.visible = false
    loadData()
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败')
  } finally {
    auditDialog.loading = false
  }
}

// 封禁
const handleBan = async (provider: Provider) => {
  const confirmed = await confirm({
    message: `确定要封禁服务者 ${provider.name} 吗？`,
    type: 'warning',
  })

  if (confirmed) {
    try {
      await banProvider(provider.id, !provider.isBanned)
      ElMessage.success(provider.isBanned ? '解封成功' : '封禁成功')
      loadData()
    } catch (error) {
      console.error('封禁操作失败:', error)
      ElMessage.error(provider.isBanned ? '解封失败' : '封禁失败')
    }
  }
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
