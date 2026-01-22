<template>
  <div class="withdrawal-page">
    <div class="page-header">
      <h2>提现审核</h2>
    </div>
    
    <el-card>
      <el-table :data="withdrawals" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="providerName" label="服务者姓名" width="120" />
        <el-table-column prop="providerPhone" label="手机号" width="120" />
        <el-table-column prop="withdrawalAmount" label="提现金额" width="120" align="center">
          <template #default="{ row }">
            ¥{{ row.withdrawalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'" 
              type="success" 
              size="small" 
              @click="auditWithdrawal(row, 'approve')"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              type="danger" 
              size="small" 
              @click="auditWithdrawal(row, 'reject')"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const withdrawals = ref([])

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return ''
  }
}

const getStatusName = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return status
  }
}

const loadWithdrawals = async () => {
  loading.value = true
  try {
    // TODO: 调用提现列表API
    // const data = await getWithdrawals()
    // withdrawals.value = data
    
    // Mock数据
    withdrawals.value = [
      {
        id: 1,
        providerName: '王阿姨',
        providerPhone: '13900139001',
        withdrawalAmount: 500,
        status: 'pending',
        applyTime: '2023-12-01 10:00:00'
      }
    ]
  } catch (error) {
    console.error('获取提现列表失败:', error)
  } finally {
    loading.value = false
  }
}

const auditWithdrawal = async (withdrawal: any, action: 'approve' | 'reject') => {
  try {
    if (action === 'reject') {
      const { value: reason } = await ElMessageBox.prompt(
        '请输入拒绝原因',
        '拒绝提现',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /.+/,
          inputErrorMessage: '请输入拒绝原因'
        }
      )
      
      if (!reason) {
        return
      }
      
      // TODO: 调用审核API
      // await auditWithdrawal(withdrawal.id, { action: 'reject', rejectReason: reason })
    } else {
      // TODO: 调用审核API
      // await auditWithdrawal(withdrawal.id, { action: 'approve' })
    }
    
    ElMessage.success(action === 'approve' ? '审核通过' : '审核拒绝')
    loadWithdrawals()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadWithdrawals()
})
</script>

<style scoped>
.withdrawal-page {
  padding: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style>
