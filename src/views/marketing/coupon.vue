<template>
  <div class="coupon-page">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增优惠券
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="coupons" v-loading="loading" stripe>
        <el-table-column prop="name" label="优惠券名称" />
        <el-table-column prop="amount" label="优惠金额" width="120" align="center">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="minSpend" label="最低消费" width="120" align="center">
          <template #default="{ row }">
            ¥{{ row.minSpend }}
          </template>
        </el-table-column>
        <el-table-column prop="totalQuantity" label="发放总量" width="100" align="center" />
        <el-table-column prop="usedQuantity" label="已使用" width="100" align="center" />
        <el-table-column prop="validDays" label="有效期" width="80" align="center">
          <template #default="{ row }">
            {{ row.validDays }}天
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editCoupon(row)">
              编辑
            </el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="toggleCouponStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="deleteCoupon(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 优惠券编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" label-width="120px">
        <el-form-item label="优惠券名称" required>
          <el-input v-model="dialog.form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="优惠金额" required>
          <el-input-number v-model="dialog.form.amount" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="最低消费" required>
          <el-input-number v-model="dialog.form.minSpend" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="发放总量" required>
          <el-input-number v-model="dialog.form.totalQuantity" :min="1" />
        </el-form-item>
        <el-form-item label="有效期" required>
          <el-input-number v-model="dialog.form.validDays" :min="1" />
          <span style="margin-left: 8px;">天</span>
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="dialog.form.userLimit" :min="1" placeholder="不填则不限" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dialog.form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitCoupon">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const coupons = ref([])

const dialog = reactive({
  visible: false,
  loading: false,
  title: '新增优惠券',
  editingCouponId: '',
  form: {
    name: '',
    amount: 0,
    minSpend: 0,
    totalQuantity: 0,
    validDays: 7,
    userLimit: 1,
    status: 'active' as 'active' | 'inactive'
  }
})

const loadCoupons = async () => {
  loading.value = true
  try {
    // TODO: 调用优惠券API
    // const data = await getCoupons()
    // coupons.value = data
    
    // Mock数据
    coupons.value = [
      {
        id: '1',
        name: '新客立减',
        amount: 20,
        minSpend: 100,
        totalQuantity: 1000,
        usedQuantity: 150,
        validDays: 7,
        status: 'active',
        createTime: '2023-12-01 10:00:00'
      }
    ]
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  dialog.title = '新增优惠券'
  dialog.editingCouponId = ''
  dialog.form = {
    name: '',
    amount: 0,
    minSpend: 0,
    totalQuantity: 0,
    validDays: 7,
    userLimit: 1,
    status: 'active'
  }
  dialog.visible = true
}

const editCoupon = (coupon: any) => {
  dialog.title = '编辑优惠券'
  dialog.editingCouponId = coupon.id
  dialog.form = {
    name: coupon.name,
    amount: coupon.amount,
    minSpend: coupon.minSpend,
    totalQuantity: coupon.totalQuantity,
    validDays: coupon.validDays,
    userLimit: coupon.userLimit,
    status: coupon.status
  }
  dialog.visible = true
}

const submitCoupon = async () => {
  if (!dialog.form.name || dialog.form.amount <= 0 || dialog.form.minSpend < 0 || dialog.form.totalQuantity <= 0 || dialog.form.validDays <= 0) {
    ElMessage.warning('请填写完整信息')
    return
  }

  dialog.loading = true
  try {
    // TODO: 调用创建/更新优惠券API
    ElMessage.success(dialog.title.includes('编辑') ? '更新成功' : '创建成功')
    dialog.visible = false
    loadCoupons()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const toggleCouponStatus = async (coupon: any) => {
  const newStatus = coupon.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}优惠券 "${coupon.name}" 吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // TODO: 调用状态更新API
    ElMessage.success(`${action}成功`)
    loadCoupons()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

const deleteCoupon = async (coupon: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除优惠券 "${coupon.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadCoupons()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.coupon-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style>
