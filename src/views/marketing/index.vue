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
          <div class="stat-icon special">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalSpecialOffers || 0 }}</div>
            <div class="stat-label">限时特惠</div>
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
            <el-table-column prop="name" label="优惠券名称" min-width="150" />
            
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
                    <span class="amount">¥{{ row.amount }}</span>
                    <span class="condition">满¥{{ row.minSpend }}</span>
                  </div>
                  <div v-else>
                    <span class="discount">{{ (row.amount * 10).toFixed(1) }}折</span>
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

            <el-table-column prop="createdAt" label="创建时间" width="180" />

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

        <!-- 限时特惠管理 -->
        <el-tab-pane label="限时特惠管理" name="specialOffers">
          <div class="tab-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" @click="openSpecialOfferDialog">创建限时特惠</el-button>
              <el-button @click="loadSpecialOffers" :loading="specialOfferLoading">刷新</el-button>
            </div>
            <div class="toolbar-right">
              <el-select v-model="specialOfferStatus" placeholder="筛选状态" style="width: 120px" @change="loadSpecialOffers">
                <el-option label="全部" value="" />
                <el-option label="上架" value="active" />
                <el-option label="下架" value="inactive" />
              </el-select>
              <el-select v-model="specialOfferCategory" placeholder="筛选分类" style="width: 120px" @change="loadSpecialOffers">
                <el-option label="全部" value="" />
                <el-option label="保洁清洗" value="保洁清洗" />
                <el-option label="维修安装" value="维修安装" />
                <el-option label="搬家运输" value="搬家运输" />
                <el-option label="月嫂保姆" value="月嫂保姆" />
              </el-select>
            </div>
          </div>

          <el-table :data="specialOffers" v-loading="specialOfferLoading" stripe>
            <el-table-column label="服务图片" width="120">
              <template #default="{ row }">
                <div 
                  class="special-offer-image-wrapper"
                  @click="openImagePreview([row.image], 0)"
                >
                  <el-image
                    :src="row.image"
                    fit="cover"
                    class="special-offer-preview"
                  />
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="name" label="服务名称" min-width="150" />
            
            <el-table-column prop="category" label="分类" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info">{{ row.category }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="价格" width="120" align="center">
              <template #default="{ row }">
                <div class="price-info">
                  <div class="price">¥{{ row.price }}</div>
                  <div class="unit">/{{ row.unit }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="rating" label="评分" width="100" align="center">
              <template #default="{ row }">
                <div class="rating">
                  <el-rate
                    v-model="row.rating"
                    disabled
                    show-score
                    text-color="#ff9900"
                    score-template="{value}"
                    size="small"
                  />
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="providerCount" label="服务者数量" width="120" align="center" />

            <el-table-column label="标签" width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="tag in row.tags"
                  :key="tag"
                  size="small"
                  style="margin-right: 4px; margin-bottom: 4px;"
                >
                  {{ tag }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="sortOrder" label="排序" width="100" align="center" />

            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  active-value="active"
                  inactive-value="inactive"
                  @change="(value) => updateSpecialOfferStatus({ ...row, status: value })"
                />
              </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="创建时间" width="180" />

            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editSpecialOffer(row)">
                  编辑
                </el-button>
                <el-button link type="success" size="small" @click="viewSpecialOfferDetail(row)">
                  详情
                </el-button>
                <el-button link type="danger" size="small" @click="deleteSpecialOffer(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="specialOfferPagination.page"
              v-model:page-size="specialOfferPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="specialOfferPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSpecialOfferSizeChange"
              @current-change="handleSpecialOfferPageChange"
            />
          </div>
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
            <el-radio value="full">满减券</el-radio>
            <el-radio value="discount">折扣券</el-radio>
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

    <!-- 限时特惠编辑对话框 -->
    <el-dialog
      v-model="specialOfferDialog.visible"
      :title="specialOfferDialog.title"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="specialOfferDialog.form" label-width="100px">
        <el-form-item label="服务名称" required>
          <el-input v-model="specialOfferDialog.form.name" placeholder="请输入服务名称" />
        </el-form-item>

        <el-form-item label="服务分类" required>
          <el-select v-model="specialOfferDialog.form.category" placeholder="请选择服务分类" style="width: 100%">
            <el-option label="保洁清洗" value="保洁清洗" />
            <el-option label="维修安装" value="维修安装" />
            <el-option label="搬家运输" value="搬家运输" />
            <el-option label="月嫂保姆" value="月嫂保姆" />
          </el-select>
        </el-form-item>

        <el-form-item label="价格" required>
          <el-input-number
            v-model="specialOfferDialog.form.price"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <el-select v-model="specialOfferDialog.form.unit" placeholder="单位" style="width: 100px; margin-left: 8px">
            <el-option label="次" value="次" />
            <el-option label="小时" value="小时" />
            <el-option label="天" value="天" />
            <el-option label="月" value="月" />
          </el-select>
        </el-form-item>

        <el-form-item label="评分" required>
          <el-rate
            v-model="specialOfferDialog.form.rating"
            :max="5"
            :step="0.1"
            show-score
            text-color="#ff9900"
            score-template="{value}"
          />
        </el-form-item>

        <el-form-item label="服务图片" required>
          <el-upload
            v-model:file-list="specialOfferDialog.imageFiles"
            :auto-upload="false"
            list-type="picture-card"
            :limit="1"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="服务描述">
          <el-input
            v-model="specialOfferDialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入服务描述"
          />
        </el-form-item>

        <el-form-item label="服务者数量" required>
          <el-input-number
            v-model="specialOfferDialog.form.providerCount"
            :min="0"
            style="width: 100%"
            placeholder="可提供此服务的服务者数量"
          />
        </el-form-item>

        <el-form-item label="服务标签">
          <el-select
            v-model="specialOfferDialog.form.tags"
            multiple
            filterable
            allow-create
            placeholder="请输入或选择标签"
            style="width: 100%"
          >
            <el-option label="深度清洁" value="深度清洁" />
            <el-option label="除螨" value="除螨" />
            <el-option label="专业" value="专业" />
            <el-option label="上门服务" value="上门服务" />
            <el-option label="快速响应" value="快速响应" />
          </el-select>
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="specialOfferDialog.form.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="specialOfferDialog.form.status">
            <el-radio value="active">上架</el-radio>
            <el-radio value="inactive">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="specialOfferDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="specialOfferDialog.loading" @click="submitSpecialOffer">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览组件 -->
    <ImagePreview 
      v-model:visible="imagePreviewVisible"
      :images="previewImages"
      :initial-index="previewIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Ticket, Check, Select, Picture, Plus, Star } from '@element-plus/icons-vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { 
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon as deleteCouponApi,
  publishCoupon as publishCouponApi,
  getSpecialOffers,
  createSpecialOffer,
  updateSpecialOffer,
  deleteSpecialOffer as deleteSpecialOfferApi,
  updateSpecialOfferStatus as updateSpecialOfferStatusApi
} from '@/api/modules/marketing'
import type { Coupon, SpecialOffer } from '@/types/api'

const activeTab = ref('coupons')

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 统计数据
const stats = ref({
  totalCoupons: 0,
  activeCoupons: 0,
  usedCoupons: 0,
  totalSpecialOffers: 0,
  activeSpecialOffers: 0
})

// 优惠券相关
const coupons = ref<Coupon[]>([])
const couponLoading = ref(false)
const couponStatus = ref('')
const isInitialized = ref(false) // 添加初始化标志
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

// 限时特惠相关
const specialOffers = ref<SpecialOffer[]>([])
const specialOfferLoading = ref(false)
const specialOfferStatus = ref('')
const specialOfferCategory = ref('')
const specialOfferPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const specialOfferDialog = reactive({
  visible: false,
  loading: false,
  title: '',
  imageFiles: [] as any[],
  form: {
    name: '',
    category: '',
    price: 0,
    unit: '次',
    rating: 4.5,
    image: '',
    description: '',
    providerCount: 0,
    tags: [] as string[],
    status: 'active' as 'active' | 'inactive',
    sortOrder: 0
  }
})

const loadStats = async () => {
  try {
    // 获取各模块数据来计算统计值
    const [couponsData, specialOffersData] = await Promise.all([
      getCoupons(),
      getSpecialOffers()
    ])
    
    // 计算优惠券统计
    const couponsList = couponsData.list || couponsData || []
    const totalCoupons = couponsList.length
    const activeCoupons = couponsList.filter(c => c.status === 'active').length
    const usedCoupons = couponsList.reduce((sum, c) => sum + (c.usedQuantity || 0), 0)
    
    // 计算限时特惠统计
    const specialOffersList = specialOffersData.list || specialOffersData || []
    const totalSpecialOffers = specialOffersList.length
    const activeSpecialOffers = specialOffersList.filter(s => s.status === 'active').length
    
    // 更新统计数据
    stats.value = {
      totalCoupons,
      activeCoupons,
      usedCoupons,
      totalSpecialOffers,
      activeSpecialOffers
    }
    
    console.log('营销统计数据:', stats.value)
  } catch (error) {
    console.error('获取营销统计数据失败:', error)
    // 设置默认值
    stats.value = {
      totalCoupons: 0,
      activeCoupons: 0,
      usedCoupons: 0,
      totalSpecialOffers: 0,
      activeSpecialOffers: 0
    }
  }
}

const loadCoupons = async () => {
  // 如果还没初始化，跳过调用（避免重复加载）
  if (!isInitialized.value) {
    return
  }
  
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
    console.error('获取优惠券列表失败:', error)
  } finally {
    couponLoading.value = false
  }
}

const loadSpecialOffers = async () => {
  specialOfferLoading.value = true
  try {
    const params = {
      page: specialOfferPagination.page,
      pageSize: specialOfferPagination.pageSize,
      status: specialOfferStatus.value || undefined,
      category: specialOfferCategory.value || undefined
    }
    
    const data = await getSpecialOffers(params)
    specialOffers.value = data.list
    specialOfferPagination.total = data.total
  } catch (error) {
    ElMessage.error('获取限时特惠列表失败')
    console.error('获取限时特惠列表失败:', error)
  } finally {
    specialOfferLoading.value = false
  }
}

const openSpecialOfferDialog = () => {
  specialOfferDialog.title = '创建限时特惠'
  specialOfferDialog.form = {
    name: '',
    category: '',
    price: 0,
    unit: '次',
    rating: 4.5,
    image: '',
    description: '',
    providerCount: 0,
    tags: [],
    status: 'active',
    sortOrder: 0
  }
  specialOfferDialog.imageFiles = []
  specialOfferDialog.visible = true
}

const editSpecialOffer = (specialOffer: SpecialOffer) => {
  specialOfferDialog.title = '编辑限时特惠'
  specialOfferDialog.form = {
    name: specialOffer.name,
    category: specialOffer.category,
    price: specialOffer.price,
    unit: specialOffer.unit,
    rating: specialOffer.rating,
    image: specialOffer.image,
    description: specialOffer.description,
    providerCount: specialOffer.providerCount,
    tags: specialOffer.tags,
    status: specialOffer.status,
    sortOrder: specialOffer.sortOrder
  }
  specialOfferDialog.imageFiles = specialOffer.image ? [{
    name: 'specialOffer',
    url: specialOffer.image
  }] : []
  specialOfferDialog.visible = true
}

const submitSpecialOffer = async () => {
  if (!specialOfferDialog.form.name || !specialOfferDialog.form.category || !specialOfferDialog.form.price) {
    ElMessage.warning('请填写完整信息')
    return
  }

  specialOfferDialog.loading = true
  try {
    const formData = { ...specialOfferDialog.form }
    
    // 处理图片上传（这里简化处理，实际应该上传到服务器）
    if (specialOfferDialog.imageFiles.length > 0) {
      formData.image = specialOfferDialog.imageFiles[0].url || specialOfferDialog.image
    }
    
    if (specialOfferDialog.title === '创建限时特惠') {
      await createSpecialOffer(formData)
      ElMessage.success('创建成功')
    } else {
      // 编辑时需要确保有id
      if (!formData.id) {
        ElMessage.error('缺少限时特惠ID')
        return
      }
      await updateSpecialOffer(formData.id, formData)
      ElMessage.success('更新成功')
    }
    
    specialOfferDialog.visible = false
    loadSpecialOffers()
    loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
    console.error('限时特惠操作失败:', error)
  } finally {
    specialOfferDialog.loading = false
  }
}

const updateSpecialOfferStatus = async (specialOffer: SpecialOffer) => {
  try {
    await updateSpecialOfferStatusApi(specialOffer.id, specialOffer.status)
    ElMessage.success('状态更新成功')
    // 更新本地数据
    const index = specialOffers.value.findIndex(s => s.id === specialOffer.id)
    if (index !== -1) {
      specialOffers.value[index].status = specialOffer.status
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const deleteSpecialOffer = async (specialOffer: SpecialOffer) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除限时特惠 "${specialOffer.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteSpecialOfferApi(specialOffer.id)
    ElMessage.success('删除成功')
    loadSpecialOffers()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const viewSpecialOfferDetail = (specialOffer: SpecialOffer) => {
  // 可以打开详情对话框
  ElMessage.info('详情功能开发中')
}

const handleSpecialOfferPageChange = (page: number) => {
  specialOfferPagination.page = page
  loadSpecialOffers()
}

const handleSpecialOfferSizeChange = (size: number) => {
  specialOfferPagination.pageSize = size
  specialOfferPagination.page = 1
  loadSpecialOffers()
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
    discount: coupon.type === 'discount' ? (coupon.amount * 10) : 8.0, // 计算折扣值
    minSpend: coupon.minSpend,
    totalQuantity: coupon.totalQuantity,
    validDays: coupon.validDays,
    description: '' // 接口中没有description字段
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
    // 准备提交数据，处理折扣计算
    const submitData = {
      name: couponDialog.form.name,
      type: couponDialog.form.type,
      amount: couponDialog.form.type === 'discount' 
        ? (couponDialog.form.discount / 10) // 折扣类型转换为小数
        : couponDialog.form.amount, // 满减类型直接使用金额
      minSpend: couponDialog.form.minSpend,
      totalQuantity: couponDialog.form.totalQuantity,
      validDays: couponDialog.form.validDays
    }

    if (couponDialog.title === '创建优惠券') {
      await createCoupon(submitData)
      ElMessage.success('创建成功')
    } else {
      await updateCoupon(couponDialog.form.id || '', submitData)
      ElMessage.success('更新成功')
    }
    
    couponDialog.visible = false
    loadCoupons()
    loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
    console.error('优惠券操作失败:', error)
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
  bannerDialog.visible = true
}

const editBanner = (banner: Banner) => {
  console.log('编辑轮播图数据:', banner)
  bannerDialog.title = '编辑轮播图'
  bannerDialog.form = {
    title: banner.title || '',
    imageUrl: banner.imageUrl || '',
    linkUrl: banner.linkUrl || '',
    sortOrder: banner.sortOrder || 0,
    startTime: banner.startTime || '',
    endTime: banner.endTime || '',
    status: banner.status || 'draft'
  }
  bannerDialog.dateRange = null
  console.log('表单数据已设置:', bannerDialog.form)
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

const updateBannerStatus = async (banner: Banner) => {
  try {
    console.log('更新轮播图状态:', banner.id, banner.status)
    await updateBannerStatusApi(banner.id.toString(), banner.status)
    ElMessage.success('状态更新成功')
    // 更新本地数据
    const index = banners.value.findIndex(b => b.id === banner.id)
    if (index !== -1) {
      banners.value[index].status = banner.status
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    console.error('轮播图状态更新失败:', error)
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

    await deleteBannerApi(banner.id.toString())
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
  if (tabName === 'specialOffers') {
    loadSpecialOffers()
  } else if (tabName === 'banners') {
    loadBanners()
  }
  // 优惠券标签页在页面加载时已经加载，这里不需要重复加载
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

// 图片预览相关方法
const openImagePreview = (images: string[], index: number = 0) => {
  if (!images || images.length === 0) return
  
  previewImages.value = images
  previewIndex.value = index
  imagePreviewVisible.value = true
}

onMounted(() => {
  loadStats()
  // 直接加载优惠券数据，不通过 loadCoupons 函数
  couponLoading.value = true
  getCoupons({
    page: couponPagination.page,
    pageSize: couponPagination.pageSize,
    status: couponStatus.value || undefined
  }).then(data => {
    coupons.value = data.list
    couponPagination.total = data.total
  }).catch(error => {
    ElMessage.error('获取优惠券列表失败')
    console.error('获取优惠券列表失败:', error)
  }).finally(() => {
    couponLoading.value = false
    isInitialized.value = true // 设置初始化完成标志
  })
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

.stat-icon.special {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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

.special-offer-preview {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
}

.special-offer-image-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
  overflow: hidden;
  display: inline-block;
}

.special-offer-image-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.price-info {
  line-height: 1.4;
}

.price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.unit {
  font-size: 12px;
  color: #909399;
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
