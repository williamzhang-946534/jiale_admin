<template>
  <div class="log-page">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>
    
    <el-card>
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user" label="操作用户" width="120" />
        <el-table-column prop="action" label="操作类型" width="120" />
        <el-table-column prop="resource" label="操作资源" width="150" />
        <el-table-column prop="ip" label="IP地址" width="120" />
        <el-table-column prop="createTime" label="操作时间" width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const loading = ref(false)
const logs = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadLogs = async () => {
  loading.value = true
  try {
    // TODO: 调用日志API
    // const data = await getLogs(pagination)
    // logs.value = data.list
    // pagination.total = data.total
    
    // Mock数据
    logs.value = [
      {
        id: 1,
        user: 'admin',
        action: 'CREATE',
        resource: '分类管理',
        ip: '192.168.1.100',
        createTime: '2023-12-01 10:30:00',
        status: 'success'
      }
    ]
    pagination.total = 1
  } catch (error) {
    console.error('获取日志失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadLogs()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.log-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
