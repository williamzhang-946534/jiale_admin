<template>
  <div class="audit-log-table">
    <el-table
      :data="logs"
      stripe
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="action" label="操作" width="150" />
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column prop="target" label="操作对象" width="150" />
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column prop="userAgent" label="用户代理" width="200" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="操作时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="details" label="详情" show-overflow-tooltip />
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { formatDate } from '@/utils/formatDate'

interface AuditLog {
  id: string
  action: string
  operator: string
  target: string
  ip: string
  userAgent: string
  createdAt: string
  details?: string
}

interface Props {
  loading?: boolean
  logs?: AuditLog[]
  total?: number
}

interface Emits {
  (e: 'size-change', size: number): void
  (e: 'current-change', current: number): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  logs: () => [],
  total: 0,
})

const emit = defineEmits<Emits>()

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: props.total,
})

// 监听props变化
watch(() => props.total, (newTotal) => {
  pagination.total = newTotal
})

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleCurrentChange = (current: number) => {
  emit('current-change', current)
}
</script>

<style scoped>
.audit-log-table {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
