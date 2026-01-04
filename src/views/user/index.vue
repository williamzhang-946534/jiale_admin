<template>
  <div class="user-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="query.keyword"
          placeholder="手机号 / 昵称"
          clearable
          style="width: 220px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.level"
          placeholder="会员等级"
          clearable
          style="width: 140px"
          @change="handleSearch"
        >
          <el-option label="全部" value=""></el-option>
          <el-option label="普通" value="normal"></el-option>
          <el-option label="会员" value="vip"></el-option>
        </el-select>
        <el-button type="primary" :loading="loading" @click="handleSearch">
          查询
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="refresh">
          刷新
        </el-button>
      </div>
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column prop="phone" label="手机号" width="160" />
      <el-table-column prop="level" label="等级" width="100" />
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="viewDetail(row)">
            详情
          </el-button>
          <el-button link type="success" size="small" @click="openCoupon(row)">
            赠券
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-drawer v-model="detailVisible" title="用户详情" size="40%">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detail.nickname || detail.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="等级">{{ detail.level || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无数据" />
    </el-drawer>

    <el-dialog v-model="couponDialog.visible" title="赠送优惠券" width="400px">
      <el-form :model="couponDialog" label-width="100px">
        <el-form-item label="用户">
          <span>{{ couponDialog.user?.nickname || couponDialog.user?.username }}</span>
        </el-form-item>
        <el-form-item label="优惠券ID">
          <el-input v-model="couponDialog.couponId" placeholder="输入优惠券ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="couponDialog.loading" @click="submitCoupon">
          赠送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUsers, getUserDetail, giveCoupon, type UserListItem, type UserDetail } from '@/api/modules/user'

const loading = ref(false)
const users = ref<UserListItem[]>([])
const detailVisible = ref(false)
const detail = ref<UserDetail | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const query = reactive({
  keyword: '',
  level: '',
})

const couponDialog = reactive({
  visible: false,
  user: null as UserListItem | null,
  couponId: '',
  loading: false,
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      keyword: query.keyword || undefined,
      level: query.level || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    users.value = res.list
    pagination.total = res.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

const handlePageChange = () => {
  fetchList()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchList()
}

const viewDetail = async (row: UserListItem) => {
  detailVisible.value = true
  detail.value = null
  try {
    detail.value = await getUserDetail(row.id)
  } catch (error) {
    ElMessage.error('获取用户详情失败')
  }
}

const openCoupon = (row: UserListItem) => {
  couponDialog.user = row
  couponDialog.couponId = ''
  couponDialog.visible = true
}

const submitCoupon = async () => {
  if (!couponDialog.user || !couponDialog.couponId) {
    ElMessage.warning('请输入优惠券ID')
    return
  }
  couponDialog.loading = true
  try {
    await giveCoupon(couponDialog.user.id, couponDialog.couponId)
    ElMessage.success('赠送成功')
    couponDialog.visible = false
  } catch (error) {
    ElMessage.error('赠送失败')
  } finally {
    couponDialog.loading = false
  }
}

const refresh = () => fetchList()

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>

