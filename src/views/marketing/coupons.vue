<template>
  <div class="coupon-templates-page">
    <div class="page-header">
      <h2>优惠券模板管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新建模板
      </el-button>
    </div>

    <!-- 查询条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="模板名称">
          <el-input
            v-model="filterForm.name"
            placeholder="请输入模板名称"
            clearable
            @clear="loadCoupons"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCoupons">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 优惠券列表 -->
    <el-card>
      <el-table v-loading="loading" :data="coupons" stripe>
        <el-table-column prop="name" label="模板名称" min-width="150" />
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
        <el-table-column prop="remainingQuantity" label="剩余数量" width="100" align="center" />
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
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editCoupon(row)">
              编辑
            </el-button>
            <el-button 
              :type="row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="toggleCouponStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteCoupon(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCoupons"
          @current-change="loadCoupons"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" label-width="120px">
        <el-form-item label="模板名称" required>
          <el-input
            v-model="dialog.form.name"
            placeholder="请输入优惠券模板名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="优惠金额" required>
          <el-input-number
            v-model="dialog.form.amount"
            :min="0.01"
            :precision="2"
            placeholder="请输入优惠金额"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="最低消费" required>
          <el-input-number
            v-model="dialog.form.minSpend"
            :min="0"
            :precision="2"
            placeholder="请输入最低消费金额"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="发放总量" required>
          <el-input-number
            v-model="dialog.form.totalQuantity"
            :min="1"
            placeholder="请输入发放总量"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="有效期" required>
          <el-input-number
            v-model="dialog.form.validDays"
            :min="1"
            placeholder="请输入有效天数"
            style="width: 100%"
          />
          <span style="margin-left: 8px; color: #666;">天</span>
        </el-form-item>
        
        <el-form-item label="每人限领">
          <el-input-number
            v-model="dialog.form.userLimit"
            :min="1"
            placeholder="每人限领数量，不填则不限"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="适用分类">
          <el-select
            v-model="dialog.form.categoryIds"
            multiple
            placeholder="请选择适用分类，不填则全品类通用"
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入优惠券描述"
            maxlength="200"
            show-word-limit
          />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon as deleteCouponApi 
} from '@/api/modules/marketing'
import { getCategories } from '@/api/modules/category'
import type { Coupon, Category } from '@/types/api'

const loading = ref(false)
const coupons = ref<Coupon[]>([])
const categories = ref<Category[]>([])

const filterForm = ref({
  name: '',
  status: ''
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialog = ref({
  visible: false,
  title: '新建优惠券模板',
  loading: false,
  editingCouponId: '', // 添加当前编辑的优惠券ID
  form: {
    name: '',
    amount: 0,
    minSpend: 0,
    totalQuantity: 0,
    validDays: 7,
    userLimit: 1,
    categoryIds: [] as string[],
    description: '',
    status: 'active' as 'active' | 'inactive'
  }
})

// 加载优惠券列表
const loadCoupons = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...filterForm.value
    }
    const response = await getCoupons(params)
    coupons.value = response.data.list
    pagination.value.total = response.data.total
  } catch (error) {
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await getCategories()
    // 处理分类数据，提取所有分类
    const extractCategories = (items: Category[]): Category[] => {
      const result: Category[] = []
      items.forEach(item => {
        result.push(item)
        if (item.children && item.children.length > 0) {
          result.push(...extractCategories(item.children))
        }
      })
      return result
    }
    categories.value = extractCategories(response.data)
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 重置筛选条件
const resetFilter = () => {
  filterForm.value = {
    name: '',
    status: ''
  }
  pagination.value.page = 1
  loadCoupons()
}

// 打开新建对话框
const openCreateDialog = () => {
  dialog.value.title = '新建优惠券模板'
  dialog.value.editingCouponId = '' // 重置编辑的优惠券ID
  dialog.value.form = {
    name: '',
    amount: 0,
    minSpend: 0,
    totalQuantity: 0,
    validDays: 7,
    userLimit: 1,
    categoryIds: [],
    description: '',
    status: 'active'
  }
  dialog.value.visible = true
}

// 编辑优惠券
const editCoupon = (coupon: Coupon) => {
  dialog.value.title = '编辑优惠券模板'
  dialog.value.editingCouponId = coupon.id // 保存当前编辑的优惠券ID
  dialog.value.form = {
    name: coupon.name,
    amount: coupon.amount,
    minSpend: coupon.minSpend,
    totalQuantity: coupon.totalQuantity,
    validDays: coupon.validDays,
    userLimit: coupon.userLimit || 1,
    categoryIds: coupon.categoryIds || [],
    description: coupon.description || '',
    status: coupon.status
  }
  dialog.value.visible = true
}

// 提交优惠券
const submitCoupon = async () => {
  if (!dialog.value.form.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  if (dialog.value.form.amount <= 0) {
    ElMessage.warning('优惠金额必须大于0')
    return
  }
  
  if (dialog.value.form.minSpend < 0) {
    ElMessage.warning('最低消费不能为负数')
    return
  }
  
  if (dialog.value.form.totalQuantity <= 0) {
    ElMessage.warning('发放总量必须大于0')
    return
  }
  
  if (dialog.value.form.validDays <= 0) {
    ElMessage.warning('有效期必须大于0')
    return
  }

  dialog.value.loading = true
  try {
    if (dialog.value.title.includes('编辑')) {
      // 编辑模式 - 使用POST方法进行更新
      const couponId = dialog.value.editingCouponId
      if (!couponId) {
        ElMessage.error('优惠券ID不能为空')
        return
      }
      await updateCoupon(couponId, dialog.value.form)
      ElMessage.success('更新成功')
    } else {
      // 新建模式 - 使用POST方法
      await createCoupon(dialog.value.form)
      ElMessage.success('创建成功')
    }
    
    dialog.value.visible = false
    loadCoupons()
  } catch (error) {
    console.error('优惠券操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    dialog.value.loading = false
  }
}

// 切换优惠券状态
const toggleCouponStatus = async (coupon: Coupon) => {
  const newStatus = coupon.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}优惠券模板"${coupon.name}"吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await updateCoupon(coupon.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadCoupons()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 删除优惠券
const deleteCoupon = async (coupon: Coupon) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除优惠券模板"${coupon.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteCouponApi(coupon.id)
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
  loadCategories()
})
</script>

<style scoped>
.coupon-templates-page {
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

.filter-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
