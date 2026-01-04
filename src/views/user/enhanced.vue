<template>
  <div class="user-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleRefresh">
          <RefreshRight />
          刷新
        </el-button>
        <el-button 
          v-if="selectedUsers.length > 0"
          type="success" 
          @click="handleBatchCoupon"
        >
          批量赠券 ({{ selectedUsers.length }})
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="queryParams.keyword"
          placeholder="手机号/昵称"
          style="width: 220px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <Search />
          </template>
        </el-input>
        <el-select
          v-model="queryParams.level"
          placeholder="会员等级"
          style="width: 140px"
          clearable
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="普通会员" value="normal" />
          <el-option label="VIP会员" value="vip" />
          <el-option label="SVIP会员" value="svip" />
        </el-select>
        <el-select
          v-model="queryParams.status"
          placeholder="状态"
          style="width: 120px"
          clearable
          @change="handleSearch"
        >
          <el-option label="正常" value="active" />
          <el-option label="封禁" value="banned" />
        </el-select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </el-card>
      <el-card class="stat-card active">
        <div class="stat-content">
          <div class="stat-number">{{ stats.active }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
      </el-card>
      <el-card class="stat-card vip">
        <div class="stat-content">
          <div class="stat-number">{{ stats.vip }}</div>
          <div class="stat-label">VIP用户</div>
        </div>
      </el-card>
      <el-card class="stat-card new">
        <div class="stat-content">
          <div class="stat-number">{{ stats.newUsers }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </el-card>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="users"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.avatar" :size="50">
                {{ row.nickname?.charAt(0) || row.username?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.nickname || row.username }}</div>
                <div class="user-phone">{{ row.phone }}</div>
                <div class="user-tags">
                  <el-tag v-if="row.level === 'svip'" type="danger" size="small">SVIP</el-tag>
                  <el-tag v-else-if="row.level === 'vip'" type="warning" size="small">VIP</el-tag>
                  <el-tag v-if="row.status === 'banned'" type="danger" size="small">已封禁</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="会员等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" size="small">
              {{ getLevelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="账户余额" width="120" align="right">
          <template #default="{ row }">
            <div class="balance">¥{{ row.balance || 0 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="积分" width="100" align="right">
          <template #default="{ row }">
            <div class="points">{{ row.points || 0 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="订单数" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="viewUserOrders(row)">
              {{ row.stats?.totalOrders || 0 }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="消费金额" width="120" align="right">
          <template #default="{ row }">
            <div class="total-spent">¥{{ row.stats?.totalSpent || 0 }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDate(row.lastLoginTime) }}
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
              type="success"
              size="small"
              @click="handleGiveCoupon(row)"
            >
              赠券
            </el-button>
            <el-button
              v-if="row.status === 'active'"
              type="danger"
              size="small"
              @click="handleBanUser(row)"
            >
              封禁
            </el-button>
            <el-button
              v-else
              type="success"
              size="small"
              @click="handleUnbanUser(row)"
            >
              解封
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

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="`用户详情 - ${detailDialog.user?.nickname || detailDialog.user?.username}`"
      width="900px"
    >
      <div v-if="detailDialog.user" class="user-detail">
        <el-row :gutter="24">
          <el-col :span="16">
            <el-descriptions title="基本信息" :column="2" border>
              <el-descriptions-item label="用户名">{{ detailDialog.user.username }}</el-descriptions-item>
              <el-descriptions-item label="昵称">{{ detailDialog.user.nickname || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detailDialog.user.phone }}</el-descriptions-item>
              <el-descriptions-item label="会员等级">
                <el-tag :type="getLevelTagType(detailDialog.user.level)">
                  {{ getLevelLabel(detailDialog.user.level) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="账户余额">¥{{ detailDialog.user.balance || 0 }}</el-descriptions-item>
              <el-descriptions-item label="积分">{{ detailDialog.user.points || 0 }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="detailDialog.user.status === 'active' ? 'success' : 'danger'">
                  {{ detailDialog.user.status === 'active' ? '正常' : '已封禁' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ formatDate(detailDialog.user.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="最后登录">{{ formatDate(detailDialog.user.lastLoginTime) }}</el-descriptions-item>
            </el-descriptions>

            <!-- 统计信息 -->
            <el-descriptions title="消费统计" :column="2" border style="margin-top: 20px">
              <el-descriptions-item label="总订单数">{{ detailDialog.user.stats?.totalOrders || 0 }}</el-descriptions-item>
              <el-descriptions-item label="总消费金额">¥{{ detailDialog.user.stats?.totalSpent || 0 }}</el-descriptions-item>
              <el-descriptions-item label="平均客单价">¥{{ detailDialog.user.stats?.avgOrderValue || 0 }}</el-descriptions-item>
              <el-descriptions-item label="最近消费">{{ formatDate(detailDialog.user.stats?.lastOrderTime) || '无' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
          
          <el-col :span="8">
            <el-card title="账户概览" class="account-card">
              <div class="account-overview">
                <div class="account-item">
                  <div class="account-label">余额</div>
                  <div class="account-value">¥{{ detailDialog.user.balance || 0 }}</div>
                </div>
                <div class="account-item">
                  <div class="account-label">积分</div>
                  <div class="account-value">{{ detailDialog.user.points || 0 }}</div>
                </div>
                <div class="account-item">
                  <div class="account-label">优惠券</div>
                  <div class="account-value">{{ detailDialog.user.coupons?.length || 0 }} 张</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 地址信息 -->
        <div v-if="detailDialog.user.addresses" class="addresses-section">
          <h4>收货地址 ({{ detailDialog.user.addresses.length }})</h4>
          <div class="addresses-list">
            <div 
              v-for="address in detailDialog.user.addresses" 
              :key="address.id"
              class="address-item"
            >
              <div class="address-info">
                <div class="address-contact">
                  <span class="contact-name">{{ address.name }}</span>
                  <span class="contact-phone">{{ address.phone }}</span>
                  <el-tag v-if="address.isDefault" type="primary" size="small">默认</el-tag>
                </div>
                <div class="address-detail">
                  {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近订单 -->
        <div v-if="detailDialog.user.recentOrders" class="recent-orders-section">
          <h4>最近订单</h4>
          <el-table :data="detailDialog.user.recentOrders" size="small">
            <el-table-column prop="orderNo" label="订单号" width="150" />
            <el-table-column prop="serviceName" label="服务" />
            <el-table-column prop="amount" label="金额" width="100" align="right">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small">
                  {{ getOrderStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 赠券弹窗 -->
    <el-dialog
      v-model="couponDialog.visible"
      :title="`赠送优惠券 - ${couponDialog.user?.nickname || couponDialog.user?.username}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="couponDialog.form" label-width="100px">
        <el-form-item label="优惠券类型">
          <el-select v-model="couponDialog.form.couponId" placeholder="选择优惠券" style="width: 100%">
            <el-option
              v-for="coupon in availableCoupons"
              :key="coupon.id"
              :label="`${coupon.name} - ¥${coupon.amount} (满${coupon.minSpend}可用)`"
              :value="coupon.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="赠送数量">
          <el-input-number
            v-model="couponDialog.form.quantity"
            :min="1"
            :max="10"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="couponDialog.form.remark"
            type="textarea"
            placeholder="可选，填写赠送原因"
            :rows="2"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="couponDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="couponDialog.loading"
          @click="submitGiveCoupon"
        >
          确认赠送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { getUsers, getUserDetail, giveCoupon } from '@/api/modules/user'
import { getCoupons } from '@/api/modules/marketing'
import type { User, UserDetail, UserListParams, Coupon } from '@/types/api'

// 查询参数
const queryParams = reactive<UserListParams>({
  keyword: '',
  level: '',
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

// 响应式数据
const loading = ref(false)
const users = ref<User[]>([])
const selectedUsers = ref<User[]>([])
const availableCoupons = ref<Coupon[]>([])

// 统计数据
const stats = computed(() => {
  const total = users.value.length
  const active = users.value.filter(u => u.status === 'active').length
  const vip = users.value.filter(u => ['vip', 'svip'].includes(u.level || '')).length
  const currentMonth = new Date().getMonth()
  const newUsers = users.value.filter(u => 
    new Date(u.createTime).getMonth() === currentMonth
  ).length
  
  return { total, active, vip, newUsers }
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  user: null as UserDetail | null,
})

// 赠券弹窗
const couponDialog = reactive({
  visible: false,
  user: null as User | null,
  form: {
    couponId: '',
    quantity: 1,
    remark: '',
  },
  loading: false,
})

// 获取等级标签类型
const getLevelTagType = (level: string) => {
  const typeMap = {
    normal: '',
    vip: 'warning',
    svip: 'danger',
  }
  return typeMap[level] || ''
}

// 获取等级标签文本
const getLevelLabel = (level: string) => {
  const labelMap = {
    normal: '普通会员',
    vip: 'VIP会员',
    svip: 'SVIP会员',
  }
  return labelMap[level] || '普通会员'
}

// 获取订单状态类型
const getOrderStatusType = (status: string) => {
  const typeMap = {
    pending: 'warning',
    accepted: 'primary',
    in_service: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return typeMap[status] || 'info'
}

// 获取订单状态标签
const getOrderStatusLabel = (status: string) => {
  const labelMap = {
    pending: '待指派',
    accepted: '已接受',
    in_service: '服务中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return labelMap[status] || status
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '无'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载用户数据
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const result = await getUsers(params)
    users.value = result.list
    pagination.total = result.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    // Mock数据
    users.value = [
      {
        id: '1',
        username: 'user001',
        nickname: '张三',
        phone: '13800138001',
        level: 'vip',
        status: 'active',
        balance: 150.50,
        points: 2800,
        createTime: '2023-10-01 10:30:00',
        lastLoginTime: '2024-01-19 15:20:00',
        stats: {
          totalOrders: 15,
          totalSpent: 2580,
          avgOrderValue: 172,
          lastOrderTime: '2024-01-15 14:00:00'
        }
      },
      {
        id: '2',
        username: 'user002',
        nickname: '李四',
        phone: '13800138002',
        level: 'svip',
        status: 'active',
        balance: 320.00,
        points: 5600,
        createTime: '2023-09-15 09:20:00',
        lastLoginTime: '2024-01-19 18:45:00',
        stats: {
          totalOrders: 32,
          totalSpent: 5420,
          avgOrderValue: 169,
          lastOrderTime: '2024-01-18 16:30:00'
        }
      },
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

// 加载优惠券
const loadCoupons = async () => {
  try {
    const coupons = await getCoupons()
    availableCoupons.value = coupons.filter(c => c.status === 'active')
  } catch (error) {
    // Mock数据
    availableCoupons.value = [
      { id: 'coupon1', name: '新客专享', amount: 20, minSpend: 100, status: 'active' },
      { id: 'coupon2', name: '保洁优惠', amount: 50, minSpend: 200, status: 'active' },
      { id: 'coupon3', name: '会员专享', amount: 100, minSpend: 300, status: 'active' },
    ] as Coupon[]
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

// 刷新
const handleRefresh = () => {
  loadUsers()
}

// 选择变化
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

// 查看详情
const handleViewDetail = async (user: User) => {
  try {
    const detail = await getUserDetail(user.id)
    detailDialog.user = detail
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取用户详情失败')
    // Mock详情数据
    detailDialog.user = {
      ...user,
      addresses: [
        {
          id: 'addr1',
          name: '张三',
          phone: '13800138001',
          province: '北京市',
          city: '朝阳区',
          district: 'xxx街道',
          detail: 'xxx小区xxx号楼',
          isDefault: true
        }
      ],
      coupons: [
        { id: 'c1', name: '新客专享', amount: 20, minSpend: 100 }
      ],
      recentOrders: [
        {
          id: 'order1',
          orderNo: 'ORD-2024-001',
          serviceName: '家庭日常保洁',
          amount: 180,
          status: 'completed',
          createTime: '2024-01-15 14:00:00'
        }
      ]
    }
    detailDialog.visible = true
  }
}

// 赠送优惠券
const handleGiveCoupon = (user: User) => {
  couponDialog.user = user
  couponDialog.form = {
    couponId: '',
    quantity: 1,
    remark: '',
  }
  couponDialog.visible = true
  loadCoupons()
}

// 批量赠券
const handleBatchCoupon = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择用户')
    return
  }
  
  ElMessage.info('批量赠券功能开发中，请单独为每个用户赠券')
}

// 提交赠券
const submitGiveCoupon = async () => {
  if (!couponDialog.user || !couponDialog.form.couponId) {
    ElMessage.warning('请选择优惠券')
    return
  }

  couponDialog.loading = true
  try {
    await giveCoupon(couponDialog.user.id, couponDialog.form.couponId)
    ElMessage.success('优惠券赠送成功')
    couponDialog.visible = false
  } catch (error) {
    ElMessage.error('优惠券赠送失败')
  } finally {
    couponDialog.loading = false
  }
}

// 封禁用户
const handleBanUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要封禁用户 ${user.nickname || user.username} 吗？封禁后用户将无法正常使用系统。`,
      '封禁确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 这里应该调用封禁用户的API
    ElMessage.success('用户已封禁')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('封禁失败')
    }
  }
}

// 解封用户
const handleUnbanUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要解封用户 ${user.nickname || user.username} 吗？`,
      '解封确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 这里应该调用解封用户的API
    ElMessage.success('用户已解封')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('解封失败')
    }
  }
}

// 查看用户订单
const viewUserOrders = (user: User) => {
  ElMessage.info(`查看用户 ${user.nickname || user.username} 的订单记录`)
  // 这里可以跳转到订单页面并筛选该用户的订单
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadUsers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-page {
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

.stat-card.active {
  border-left: 4px solid #67c23a;
}

.stat-card.vip {
  border-left: 4px solid #e6a23c;
}

.stat-card.new {
  border-left: 4px solid #409eff;
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

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.user-tags {
  display: flex;
  gap: 4px;
}

.balance,
.total-spent {
  font-weight: bold;
  color: #f56c6c;
}

.points {
  font-weight: bold;
  color: #409eff;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.user-detail {
  padding: 16px 0;
}

.account-card {
  margin-bottom: 20px;
}

.account-overview {
  padding: 16px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.account-item:last-child {
  border-bottom: none;
}

.account-label {
  font-size: 14px;
  color: #606266;
}

.account-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.addresses-section,
.recent-orders-section {
  margin-top: 24px;
}

.addresses-section h4,
.recent-orders-section h4 {
  margin-bottom: 16px;
  color: #303133;
}

.addresses-list {
  display: grid;
  gap: 12px;
}

.address-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.address-contact {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.contact-name {
  font-weight: 500;
}

.contact-phone {
  color: #606266;
  font-size: 14px;
}

.address-detail {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
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
