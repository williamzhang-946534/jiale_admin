<template>
  <div class="marketing-page">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon coupons">
            <el-icon><Ticket /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCoupons || 0 }}</div>
            <div class="stat-label">优惠券总数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeCoupons || 0 }}</div>
            <div class="stat-label">进行中活动</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon used">
            <el-icon><Select /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.usedCoupons || 0 }}</div>
            <div class="stat-label">已使用数量</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon banners">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalBanners || 0 }}</div>
            <div class="stat-label">轮播图数量</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 标签页 -->
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 优惠券管理 -->
        <el-tab-pane label="优惠券管理" name="coupons">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" @click="openCouponDialog">创建优惠券</el-button>
              <el-button @click="loadCoupons" :loading="couponLoading">刷新</el-button>
            </div>
            <div class="toolbar-right">
              <el-select v-model="couponStatus" placeholder="筛选状态" style="width: 120px" @change="loadCoupons">
                <el-option label="全部" value="" />
                <el-option label="进行中" value="active" />
                <el-option label="已结束" value="expired" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </div>
          </div>

          <el-table :data="coupons" v-loading="couponLoading" stripe>
            <el-table-column prop="couponName" label="优惠券名称" min-width="150" />
            
            <el-table-column prop="type" label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 'full' ? 'success' : 'warning'">
                  {{ row.type === 'full' ? '满减' : '折扣' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="优惠信息" width="150" align="center">
              <template #default="{ row }">
                <div class="discount-info">
                  <div v-if="row.type === 'full'">
                    <span class="amount">¥{{ row.discountAmount }}</span>
                    <span class="condition">满¥{{ row.minSpend }}</span>
                  </div>
                  <div v-else>
                    <span class="discount">{{ row.discountRate }}折</span>
                    <span class="condition">满¥{{ row.minSpend }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="totalQuantity" label="总数量" width="100" align="center" />
            
            <el-table-column label="使用情况" width="120" align="center">
              <template #default="{ row }">
                <div class="usage-info">
                  <div>{{ row.usedQuantity || 0 }}</div>
                  <div class="progress-bar">
                    <el-progress 
                      :percentage="Math.round((row.usedQuantity || 0) / row.totalQuantity * 100)"
                      :stroke-width="4"
                      :show-text="false"
                    />
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getCouponStatusType(row.status)">
                  {{ getCouponStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="validDays" label="有效期" width="100" align="center">
              <template #default="{ row }">
                {{ row.validDays }}天
              </template>
            </el-table-column>

            <el-table-column prop="createTime" label="创建时间" width="180" />

            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editCoupon(row)">
                  编辑
                </el-button>
                <el-button link type="success" size="small" @click="viewCouponDetail(row)">
                  详情
                </el-button>
                <el-button 
                  v-if="row.status === 'draft'"
                  link 
                  type="warning" 
                  size="small" 
                  @click="publishCoupon(row)"
                >
                  发布
                </el-button>
                <el-button link type="danger" size="small" @click="deleteCoupon(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="couponPagination.page"
              v-model:page-size="couponPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="couponPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleCouponSizeChange"
              @current-change="handleCouponPageChange"
            />
          </div>
        </el-tab-pane>

        <!-- 轮播图管理 -->
        <el-tab-pane label="轮播图管理" name="banners">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" @click="openBannerDialog">添加轮播图</el-button>
              <el-button @click="loadBanners" :loading="bannerLoading">刷新</el-button>
            </div>
            <div class="toolbar-right">
              <el-select v-model="bannerStatus" placeholder="筛选状态" style="width: 120px" @change="loadBanners">
                <el-option label="全部" value="" />
                <el-option label="已发布" value="published" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </div>
          </div>

          <el-table :data="banners" v-loading="bannerLoading" stripe>
            <el-table-column label="预览图" width="120">
              <template #default="{ row }">
                <el-image
                  :src="row.imageUrl"
                  fit="cover"
                  class="banner-preview"
                  :preview-src-list="[row.imageUrl]"
                />
              </template>
            </el-table-column>

            <el-table-column prop="bannerTitle" label="标题" min-width="150" />

            <el-table-column prop="linkUrl" label="链接地址" min-width="200">
              <template #default="{ row }">
                <el-link :href="row.linkUrl" target="_blank" type="primary">
                  {{ row.linkUrl }}
                </el-link>
              </template>
            </el-table-column>

            <el-table-column prop="sortOrder" label="排序" width="100" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.sortOrder"
                  :min="0"
                  size="small"
                  @change="updateBannerSort(row)"
                />
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.status"
                  active-value="published"
                  inactive-value="draft"
                  @change="updateBannerStatus(row)"
                />
              </template>
            </el-table-column>

            <el-table-column prop="startTime" label="开始时间" width="180" />
            <el-table-column prop="endTime" label="结束时间" width="180" />

            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editBanner(row)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="deleteBanner(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 优惠券编辑对话框 -->
    <el-dialog
      v-model="couponDialog.visible"
      :title="couponDialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="couponDialog.form" label-width="100px">
        <el-form-item label="优惠券名称" required>
          <el-input v-model="couponDialog.form.name" placeholder="请输入优惠券名称" />
        </el-form-item>

        <el-form-item label="优惠类型" required>
          <el-radio-group v-model="couponDialog.form.type">
            <el-radio label="full">满减券</el-radio>
            <el-radio label="discount">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="couponDialog.form.type === 'full'" label="减免金额" required>
          <el-input-number
            v-model="couponDialog.form.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="couponDialog.form.type === 'discount'" label="折扣" required>
          <el-input-number
            v-model="couponDialog.form.discount"
            :min="0.1"
            :max="9.9"
            :step="0.1"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="使用门槛" required>
          <el-input-number
            v-model="couponDialog.form.minSpend"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="最低消费金额"
          />
        </el-form-item>

        <el-form-item label="发放数量" required>
          <el-input-number
            v-model="couponDialog.form.totalQuantity"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="有效期" required>
          <el-input-number
            v-model="couponDialog.form.validDays"
            :min="1"
            style="width: 100%"
          />
          <span style="margin-left: 8px; color: #909399;">天</span>
        </el-form-item>

        <el-form-item label="使用说明">
          <el-input
            v-model="couponDialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入使用说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="couponDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="couponDialog.loading" @click="submitCoupon">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 轮播图编辑对话框 -->
    <el-dialog
      v-model="bannerDialog.visible"
      :title="bannerDialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="bannerDialog.form" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="bannerDialog.form.title" placeholder="请输入轮播图标题" />
        </el-form-item>

        <el-form-item label="图片" required>
          <el-upload
            v-model:file-list="bannerDialog.imageFiles"
            :auto-upload="false"
            list-type="picture-card"
            :limit="1"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="链接地址">
          <el-input v-model="bannerDialog.form.linkUrl" placeholder="请输入链接地址" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="bannerDialog.form.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="展示时间">
          <el-date-picker
            v-model="bannerDialog.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="bannerDialog.form.status">
            <el-radio label="published">已发布</el-radio>
            <el-radio label="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="bannerDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="bannerDialog.loading" @click="submitBanner">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Ticket, Check, Select, Picture, Plus } from '@element-plus/icons-vue'
import { 
  getMarketingStats,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon as deleteCouponApi,
  publishCoupon as publishCouponApi,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner as deleteBannerApi
} from '@/api/modules/marketing'
import type { MarketingStats, Coupon, Banner } from '@/types/api'

const activeTab = ref('coupons')

// 统计数据
const stats = ref<MarketingStats>({
  totalCoupons: 0,
  activeCoupons: 0,
  usedCoupons: 0,
  totalBanners: 0
})

// 优惠券相关
const coupons = ref<Coupon[]>([])
const couponLoading = ref(false)
const couponStatus = ref('')
const couponPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const couponDialog = reactive({
  visible: false,
  loading: false,
  title: '',
  form: {
    name: '',
    type: 'full' as 'full' | 'discount',
    amount: 0,
    discount: 8.0,
    minSpend: 0,
    totalQuantity: 100,
    validDays: 30,
    description: ''
  }
})

// 轮播图相关
const banners = ref<Banner[]>([])
const bannerLoading = ref(false)
const bannerStatus = ref('')

const bannerDialog = reactive({
  visible: false,
  loading: false,
  title: '',
  imageFiles: [] as any[],
  dateRange: null as [Date, Date] | null,
  form: {
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    startTime: '',
    endTime: '',
    status: 'draft' as 'published' | 'draft'
  }
})

const loadStats = async () => {
  try {
    const data = await getMarketingStats()
    stats.value = data
  } catch (error) {
    ElMessage.error('获取营销统计失败')
    // Mock数据
    stats.value = {
      totalCoupons: 15,
      activeCoupons: 8,
      usedCoupons: 234,
      totalBanners: 5
    }
  }
}

const loadCoupons = async () => {
  couponLoading.value = true
  try {
    const params = {
      page: couponPagination.page,
      pageSize: couponPagination.pageSize,
      status: couponStatus.value || undefined
    }
    
    const data = await getCoupons(params)
    coupons.value = data.list
    couponPagination.total = data.total
  } catch (error) {
    ElMessage.error('获取优惠券列表失败')
    // Mock数据
    coupons.value = [
      {
        id: '1',
        name: '新客专享优惠',
        type: 'full',
        amount: 20,
        minSpend: 100,
        totalQuantity: 1000,
        usedQuantity: 156,
        validDays: 7,
        status: 'active',
        createTime: '2024-01-15 10:00:00'
      },
      {
        id: '2',
        name: '周末特惠折扣',
        type: 'discount',
        discount: 8.5,
        minSpend: 200,
        totalQuantity: 500,
        usedQuantity: 78,
        validDays: 3,
        status: 'active',
        createTime: '2024-01-18 14:00:00'
      }
    ]
    couponPagination.total = 2
  } finally {
    couponLoading.value = false
  }
}

const loadBanners = async () => {
  bannerLoading.value = true
  try {
    const params = {
      status: bannerStatus.value || undefined
    }
    
    const data = await getBanners(params)
    banners.value = data
  } catch (error) {
    ElMessage.error('获取轮播图列表失败')
    // Mock数据
    banners.value = [
      {
        id: '1',
        title: '春节大促',
        imageUrl: 'https://example.com/banner1.jpg',
        linkUrl: 'https://example.com/promotion1',
        sortOrder: 1,
        status: 'published',
        startTime: '2024-01-20 00:00:00',
        endTime: '2024-02-20 23:59:59'
      },
      {
        id: '2',
        title: '新用户专享',
        imageUrl: 'https://example.com/banner2.jpg',
        linkUrl: 'https://example.com/newuser',
        sortOrder: 2,
        status: 'published',
        startTime: '2024-01-15 00:00:00',
        endTime: '2024-02-15 23:59:59'
      }
    ]
  } finally {
    bannerLoading.value = false
  }
}

const openCouponDialog = () => {
  couponDialog.title = '创建优惠券'
  couponDialog.form = {
    name: '',
    type: 'full',
    amount: 0,
    discount: 8.0,
    minSpend: 0,
    totalQuantity: 100,
    validDays: 30,
    description: ''
  }
  couponDialog.visible = true
}

const editCoupon = (coupon: Coupon) => {
  couponDialog.title = '编辑优惠券'
  couponDialog.form = {
    name: coupon.name,
    type: coupon.type,
    amount: coupon.amount || 0,
    discount: coupon.discount || 8.0,
    minSpend: coupon.minSpend,
    totalQuantity: coupon.totalQuantity,
    validDays: coupon.validDays,
    description: coupon.description || ''
  }
  couponDialog.visible = true
}

const submitCoupon = async () => {
  if (!couponDialog.form.name || !couponDialog.form.minSpend || !couponDialog.form.totalQuantity) {
    ElMessage.warning('请填写完整信息')
    return
  }

  couponDialog.loading = true
  try {
    if (couponDialog.title === '创建优惠券') {
      await createCoupon(couponDialog.form)
      ElMessage.success('创建成功')
    } else {
      await updateCoupon(couponDialog.form.id || '', couponDialog.form)
      ElMessage.success('更新成功')
    }
    
    couponDialog.visible = false
    loadCoupons()
    loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    couponDialog.loading = false
  }
}

const publishCoupon = async (coupon: Coupon) => {
  try {
    await publishCouponApi(coupon.id)
    ElMessage.success('发布成功')
    loadCoupons()
    loadStats()
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

const deleteCoupon = async (coupon: Coupon) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除优惠券 "${coupon.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteCouponApi(coupon.id)
    ElMessage.success('删除成功')
    loadCoupons()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const viewCouponDetail = (coupon: Coupon) => {
  // 可以打开详情对话框
  ElMessage.info('详情功能开发中')
}

const openBannerDialog = () => {
  bannerDialog.title = '添加轮播图'
  bannerDialog.form = {
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    startTime: '',
    endTime: '',
    status: 'draft'
  }
  bannerDialog.dateRange = null
  bannerDialog.imageFiles = []
  bannerDialog.visible = true
}

const editBanner = (banner: Banner) => {
  bannerDialog.title = '编辑轮播图'
  bannerDialog.form = {
    title: banner.title,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    sortOrder: banner.sortOrder,
    startTime: banner.startTime,
    endTime: banner.endTime,
    status: banner.status
  }
  bannerDialog.dateRange = banner.startTime && banner.endTime 
    ? [new Date(banner.startTime), new Date(banner.endTime)]
    : null
  bannerDialog.imageFiles = banner.imageUrl ? [{
    name: 'banner',
    url: banner.imageUrl
  }] : []
  bannerDialog.visible = true
}

const submitBanner = async () => {
  if (!bannerDialog.form.title) {
    ElMessage.warning('请输入标题')
    return
  }

  bannerDialog.loading = true
  try {
    const formData = { ...bannerDialog.form }
    
    if (bannerDialog.dateRange) {
      formData.startTime = bannerDialog.dateRange[0].toISOString()
      formData.endTime = bannerDialog.dateRange[1].toISOString()
    }
    
    if (bannerDialog.title === '添加轮播图') {
      await createBanner(formData)
      ElMessage.success('添加成功')
    } else {
      await updateBanner(bannerDialog.form.id || '', formData)
      ElMessage.success('更新成功')
    }
    
    bannerDialog.visible = false
    loadBanners()
    loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    bannerDialog.loading = false
  }
}

const updateBannerSort = async (banner: Banner) => {
  try {
    await updateBanner(banner.id, { sortOrder: banner.sortOrder })
    ElMessage.success('排序更新成功')
  } catch (error) {
    ElMessage.error('排序更新失败')
  }
}

const updateBannerStatus = async (banner: Banner) => {
  try {
    await updateBanner(banner.id, { status: banner.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const deleteBanner = async (banner: Banner) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除轮播图 "${banner.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteBannerApi(banner.id)
    ElMessage.success('删除成功')
    loadBanners()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getCouponStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: 'success',
    expired: 'danger',
    draft: 'warning'
  }
  return typeMap[status] || 'info'
}

const getCouponStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '进行中',
    expired: '已结束',
    draft: '草稿'
  }
  return textMap[status] || status
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'coupons') {
    loadCoupons()
  } else if (tabName === 'banners') {
    loadBanners()
  }
}

const handleCouponPageChange = (page: number) => {
  couponPagination.page = page
  loadCoupons()
}

const handleCouponSizeChange = (size: number) => {
  couponPagination.pageSize = size
  couponPagination.page = 1
  loadCoupons()
}

onMounted(() => {
  loadStats()
  loadCoupons()
})
</script>

<style scoped>
.marketing-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
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

.stat-icon.coupons {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.used {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.banners {
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

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.discount-info {
  line-height: 1.4;
}

.amount {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.discount {
  font-size: 16px;
  font-weight: bold;
  color: #e6a23c;
}

.condition {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.usage-info {
  line-height: 1.4;
}

.progress-bar {
  margin-top: 4px;
  width: 80px;
}

.banner-preview {
  width: 80px;
  height: 40px;
  border-radius: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
