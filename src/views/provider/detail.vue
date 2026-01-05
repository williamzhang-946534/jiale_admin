<template>
  <div class="provider-detail-page">
    <div v-loading="loading" class="detail-container">
      <!-- 头部信息 -->
      <el-card class="header-card">
        <div class="provider-header">
          <div class="avatar-section">
            <el-avatar :src="providerDetail?.avatar" :size="80">
              {{ providerDetail?.name?.charAt(0) }}
            </el-avatar>
            <div class="status-badge">
              <el-tag :type="getStatusType(providerDetail?.status)">
                {{ getStatusText(providerDetail?.status) }}
              </el-tag>
              <el-tag v-if="providerDetail?.isBanned" type="danger" style="margin-left: 8px">
                已封禁
              </el-tag>
            </div>
          </div>
          
          <div class="basic-info">
            <h2>{{ providerDetail?.name }}</h2>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>{{ providerDetail?.phone }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>注册时间: {{ formatDate(providerDetail?.createTime) }}</span>
            </div>
            <div class="info-item" v-if="providerDetail?.rating">
              <el-icon><Star /></el-icon>
              <el-rate
                v-model="providerDetail.rating"
                disabled
                show-score
                text-color="#ff9900"
              />
            </div>
          </div>

          <div class="action-buttons">
            <el-button type="primary" @click="editMode = !editMode">
              <el-icon><Edit /></el-icon>
              {{ editMode ? '取消编辑' : '编辑信息' }}
            </el-button>
            <el-button 
              v-if="providerDetail?.status === 'pending'"
              type="success" 
              @click="handleAudit('approve')"
            >
              通过审核
            </el-button>
            <el-button 
              v-if="providerDetail?.status === 'pending'"
              type="danger" 
              @click="handleAudit('reject')"
            >
              拒绝审核
            </el-button>
            <el-button 
              :type="providerDetail?.isBanned ? 'success' : 'danger'"
              @click="toggleBan"
            >
              {{ providerDetail?.isBanned ? '解封账号' : '封禁账号' }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 详细信息标签页 -->
      <el-card class="content-card">
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form 
              :model="editForm" 
              :disabled="!editMode"
              label-width="120px"
              class="detail-form"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="姓名">
                    <el-input v-model="editForm.name" placeholder="请输入姓名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号">
                    <el-input v-model="editForm.phone" placeholder="请输入手机号" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="身份证号">
                    <el-input v-model="editForm.idCard" placeholder="请输入身份证号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="状态">
                    <el-select v-model="editForm.status" placeholder="选择状态">
                      <el-option label="未认证" value="unverified" />
                      <el-option label="待审核" value="pending" />
                      <el-option label="已认证" value="verified" />
                      <el-option label="已拒绝" value="rejected" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="个人简介">
                <el-input 
                  v-model="editForm.description" 
                  type="textarea" 
                  :rows="4"
                  placeholder="请输入个人简介"
                />
              </el-form-item>

              <el-form-item label="服务标签">
                <el-select
                  v-model="editForm.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="添加服务标签"
                  style="width: 100%"
                >
                  <el-option
                    v-for="tag in commonTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>

              <el-form-item v-if="editMode">
                <el-button type="primary" @click="saveBasicInfo" :loading="saveLoading">
                  保存基本信息
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 个人资料 -->
          <el-tab-pane label="个人资料" name="profile">
            <div v-if="providerDetail?.profile" class="profile-content">
              <el-form 
                :model="editProfileForm" 
                :disabled="!editMode"
                label-width="120px"
                class="detail-form"
              >
                <el-form-item label="个人介绍">
                  <el-input 
                    v-model="editProfileForm.intro" 
                    type="textarea" 
                    :rows="4"
                    placeholder="请输入个人介绍"
                  />
                </el-form-item>

                <el-form-item label="个人属性">
                  <div class="attributes-grid">
                    <div 
                      v-for="(value, key) in editProfileForm.attributes" 
                      :key="key"
                      class="attribute-item"
                    >
                      <el-input 
                        v-model="editProfileForm.attributes[key]"
                        :placeholder="key"
                        :disabled="!editMode"
                      />
                    </div>
                    <el-button 
                      v-if="editMode"
                      type="primary" 
                      plain 
                      @click="addAttribute"
                      style="margin-top: 8px"
                    >
                      添加属性
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item label="服务统计">
                  <div class="stats-grid">
                    <div 
                      v-for="(value, key) in editProfileForm.stats" 
                      :key="key"
                      class="stat-item"
                    >
                      <span class="stat-label">{{ key }}:</span>
                      <el-input-number 
                        v-model="editProfileForm.stats[key]"
                        :min="0"
                        :disabled="!editMode"
                        size="small"
                      />
                    </div>
                  </div>
                </el-form-item>

                <el-form-item label="资质证书">
                  <div class="certs-list">
                    <el-tag
                      v-for="(cert, index) in editProfileForm.certs"
                      :key="index"
                      closable
                      @close="removeCert(index)"
                      :disable-transitions="false"
                      style="margin: 4px"
                    >
                      {{ cert }}
                    </el-tag>
                    <el-input
                      v-if="certInputVisible"
                      ref="certInputRef"
                      v-model="certInputValue"
                      class="cert-input"
                      size="small"
                      @keyup.enter="handleCertInputConfirm"
                      @blur="handleCertInputConfirm"
                    />
                    <el-button v-else-if="editMode" size="small" @click="showCertInput">
                      + 添加证书
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item label="工作经历">
                  <div class="work-history">
                    <div 
                      v-for="(work, index) in editProfileForm.workHistory" 
                      :key="index"
                      class="work-item"
                    >
                      <el-card>
                        <template #header>
                          <div class="work-header">
                            <span>工作经历 {{ index + 1 }}</span>
                            <el-button 
                              v-if="editMode"
                              type="danger" 
                              size="small" 
                              @click="removeWorkHistory(index)"
                            >
                              删除
                            </el-button>
                          </div>
                        </template>
                        <el-form :model="work" label-width="80px">
                          <el-form-item label="公司">
                            <el-input v-model="work.company" :disabled="!editMode" />
                          </el-form-item>
                          <el-form-item label="职位">
                            <el-input v-model="work.position" :disabled="!editMode" />
                          </el-form-item>
                          <el-form-item label="时间段">
                            <el-date-picker
                              v-model="work.period"
                              type="daterange"
                              range-separator="至"
                              start-placeholder="开始日期"
                              end-placeholder="结束日期"
                              :disabled="!editMode"
                            />
                          </el-form-item>
                          <el-form-item label="描述">
                            <el-input 
                              v-model="work.description" 
                              type="textarea" 
                              :rows="2"
                              :disabled="!editMode"
                            />
                          </el-form-item>
                        </el-form>
                      </el-card>
                    </div>
                    <el-button 
                      v-if="editMode"
                      type="primary" 
                      plain 
                      @click="addWorkHistory"
                      style="margin-top: 16px"
                    >
                      添加工作经历
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item v-if="editMode">
                  <el-button type="primary" @click="saveProfile" :loading="saveLoading">
                    保存个人资料
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 证件图片 -->
          <el-tab-pane label="证件图片" name="documents">
            <div class="documents-section">
              <div class="document-group">
                <h4>身份证照片</h4>
                <div class="image-grid">
                  <div v-if="providerDetail?.idCardImages" class="image-item">
                    <el-image
                      v-for="(image, index) in providerDetail.idCardImages"
                      :key="index"
                      :src="image"
                      :preview-src-list="providerDetail.idCardImages"
                      fit="cover"
                      class="document-image"
                    />
                  </div>
                  <el-empty v-else description="暂无身份证照片" />
                </div>
              </div>

              <div class="document-group">
                <h4>资质证书</h4>
                <div class="image-grid">
                  <div v-if="providerDetail?.certFiles" class="image-item">
                    <el-image
                      v-for="(image, index) in providerDetail.certFiles"
                      :key="index"
                      :src="image"
                      :preview-src-list="providerDetail.certFiles"
                      fit="cover"
                      class="document-image"
                    />
                  </div>
                  <el-empty v-else description="暂无资质证书" />
                </div>
              </div>

              <div class="document-group">
                <h4>个人相册</h4>
                <div class="image-grid">
                  <div v-if="providerDetail?.profile?.gallery" class="image-item">
                    <el-image
                      v-for="(image, index) in providerDetail.profile.gallery"
                      :key="index"
                      :src="image"
                      :preview-src-list="providerDetail.profile.gallery"
                      fit="cover"
                      class="gallery-image"
                    />
                  </div>
                  <el-empty v-else description="暂无个人相册" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 钱包信息 -->
          <el-tab-pane label="钱包信息" name="wallet">
            <div v-if="providerDetail?.wallet" class="wallet-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="当前余额">
                  <span class="balance">¥{{ providerDetail.wallet.balance }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="冻结金额">
                  <span class="frozen">¥{{ providerDetail.wallet.frozen || 0 }}</span>
                </el-descriptions-item>
              </el-descriptions>

              <h4 style="margin-top: 24px">交易记录</h4>
              <el-table :data="providerDetail.wallet.history" stripe>
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getTransactionType(row.type)">
                      {{ getTransactionText(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="{ row }">
                    <span :class="row.amount > 0 ? 'income' : 'expense'">
                      ¥{{ row.amount }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="createTime" label="时间" width="180" />
              </el-table>
            </div>
          </el-tab-pane>

          <!-- 银行信息 -->
          <el-tab-pane label="银行信息" name="bank">
            <div class="bank-content">
              <el-form 
                :model="editBankForm" 
                :disabled="!editMode"
                label-width="120px"
                class="detail-form"
              >
                <el-form-item label="银行名称">
                  <el-input v-model="editBankForm.bankName" placeholder="请输入银行名称" />
                </el-form-item>
                <el-form-item label="银行卡号">
                  <el-input v-model="editBankForm.cardNumber" placeholder="请输入银行卡号" />
                </el-form-item>
                <el-form-item label="开户行">
                  <el-input v-model="editBankForm.branchName" placeholder="请输入开户行" />
                </el-form-item>
                <el-form-item label="持卡人姓名">
                  <el-input v-model="editBankForm.accountName" placeholder="请输入持卡人姓名" />
                </el-form-item>

                <el-form-item v-if="editMode">
                  <el-button type="primary" @click="saveBankInfo" :loading="saveLoading">
                    保存银行信息
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="auditDialog.visible"
      :title="`审核服务者 - ${providerDetail?.name}`"
      width="500px"
    >
      <el-form :model="auditDialog.form" label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditDialog.form.action">
            <el-radio label="approve">通过审核</el-radio>
            <el-radio label="reject">拒绝审核</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item
          v-if="auditDialog.form.action === 'reject'"
          label="拒绝原因"
          required
        >
          <el-input
            v-model="auditDialog.form.reason"
            type="textarea"
            placeholder="请输入拒绝原因"
            :rows="4"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="auditDialog.loading"
          @click="submitAudit"
        >
          确认审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Phone, 
  Calendar, 
  Star, 
  Edit 
} from '@element-plus/icons-vue'
import { 
  getProviderDetail, 
  auditProvider, 
  banProvider,
  updateProvider
} from '@/api/modules/provider'
import type { ProviderDetail, ProviderAuditParams } from '@/types/api'

const route = useRoute()
const providerId = route.params.id as string

// 状态管理
const loading = ref(false)
const saveLoading = ref(false)
const editMode = ref(false)
const activeTab = ref('basic')
const providerDetail = ref<ProviderDetail | null>(null)

// 审核对话框
const auditDialog = reactive({
  visible: false,
  loading: false,
  form: {
    action: 'approve' as 'approve' | 'reject',
    reason: ''
  }
})

// 编辑表单
const editForm = reactive({
  name: '',
  phone: '',
  idCard: '',
  status: 'unverified' as const,
  description: '',
  tags: [] as string[]
})

const editProfileForm = reactive({
  intro: '',
  attributes: {} as Record<string, string>,
  stats: {} as Record<string, number>,
  certs: [] as string[],
  workHistory: [] as any[],
  gallery: [] as string[]
})

const editBankForm = reactive({
  bankName: '',
  cardNumber: '',
  branchName: '',
  accountName: ''
})

// 证书输入
const certInputVisible = ref(false)
const certInputValue = ref('')
const certInputRef = ref()

// 常用标签
const commonTags = [
  '金牌月嫂', '育儿嫂', '保姆', '钟点工', '保洁', '护工', '老人护理', '病人护理'
]

// 获取服务者详情
const loadProviderDetail = async () => {
  loading.value = true
  try {
    const data = await getProviderDetail(providerId)
    providerDetail.value = data
    
    // 初始化编辑表单
    editForm.name = data.name
    editForm.phone = data.phone
    editForm.idCard = data.idCard || ''
    editForm.status = data.status
    editForm.description = data.description || ''
    editForm.tags = data.tags || []

    if (data.profile) {
      editProfileForm.intro = data.profile.intro || ''
      editProfileForm.attributes = { ...data.profile.attributes }
      editProfileForm.stats = { ...data.profile.stats }
      editProfileForm.certs = [...data.profile.certs]
      editProfileForm.workHistory = [...(data.profile.workHistory || [])]
      editProfileForm.gallery = [...(data.profile.gallery || [])]
    }

    if (data.bankInfo) {
      // 解析银行信息字符串
      const bankInfo = data.bankInfo.split('|')
      editBankForm.bankName = bankInfo[0] || ''
      editBankForm.cardNumber = bankInfo[1] || ''
      editBankForm.branchName = bankInfo[2] || ''
      editBankForm.accountName = bankInfo[3] || ''
    }
  } catch (error) {
    ElMessage.error('获取服务者详情失败')
    // Mock数据
    providerDetail.value = {
      id: providerId,
      name: '王阿姨',
      phone: '13800138001',
      status: 'pending',
      isBanned: false,
      createTime: '2024-01-15 10:30:00',
      rating: 4.8,
      orders: 88,
      description: '有5年育儿经验，擅长新生儿护理和早教',
      tags: ['金牌月嫂', '育儿嫂'],
      idCard: '110101199001011234',
      idCardImages: [
        'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=身份证正面',
        'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=身份证背面'
      ],
      certFiles: [
        'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=母婴护理证',
        'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=健康证'
      ],
      profile: {
        intro: '本人有5年育儿经验，擅长新生儿护理和早教，性格温和有耐心',
        attributes: {
          '年龄': '47岁',
          '籍贯': '辽宁',
          '学历': '高中',
          '民族': '汉族'
        },
        stats: {
          '服务家庭': 88,
          '好评数': 85,
          '接单率': '95%'
        },
        certs: ['母婴护理高级证', '健康证', '早教师资格证'],
        gallery: [
          'https://via.placeholder.com/200x200/E91E63/FFFFFF?text=工作照1',
          'https://via.placeholder.com/200x200/00BCD4/FFFFFF?text=工作照2'
        ],
        workHistory: [
          {
            company: '北京家政服务公司',
            position: '金牌月嫂',
            period: ['2020-01-01', '2023-12-31'],
            description: '负责新生儿护理和产妇照料'
          }
        ]
      },
      wallet: {
        balance: 2580.50,
        frozen: 120.00,
        history: [
          {
            type: 'income',
            amount: 500,
            description: '订单收入',
            createTime: '2024-01-20 14:30:00'
          }
        ]
      },
      bankInfo: '中国工商银行|6222021234567890123|北京朝阳支行|王秀英'
    }
    
    // 初始化编辑表单
    const data = providerDetail.value
    editForm.name = data.name
    editForm.phone = data.phone
    editForm.idCard = data.idCard || ''
    editForm.status = data.status
    editForm.description = data.description || ''
    editForm.tags = data.tags || []

    if (data.profile) {
      editProfileForm.intro = data.profile.intro || ''
      editProfileForm.attributes = { ...data.profile.attributes }
      editProfileForm.stats = { ...data.profile.stats }
      editProfileForm.certs = [...data.profile.certs]
      editProfileForm.workHistory = [...(data.profile.workHistory || [])]
      editProfileForm.gallery = [...(data.profile.gallery || [])]
    }

    if (data.bankInfo) {
      const bankInfo = data.bankInfo.split('|')
      editBankForm.bankName = bankInfo[0] || ''
      editBankForm.cardNumber = bankInfo[1] || ''
      editBankForm.branchName = bankInfo[2] || ''
      editBankForm.accountName = bankInfo[3] || ''
    }
  } finally {
    loading.value = false
  }
}

// 保存基本信息
const saveBasicInfo = async () => {
  saveLoading.value = true
  try {
    await updateProvider(providerId, {
      name: editForm.name,
      phone: editForm.phone,
      idCard: editForm.idCard,
      status: editForm.status,
      description: editForm.description,
      tags: editForm.tags
    })
    ElMessage.success('基本信息保存成功')
    editMode.value = false
    loadProviderDetail()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 保存个人资料
const saveProfile = async () => {
  saveLoading.value = true
  try {
    await updateProvider(providerId, {
      profile: editProfileForm
    })
    ElMessage.success('个人资料保存成功')
    editMode.value = false
    loadProviderDetail()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 保存银行信息
const saveBankInfo = async () => {
  saveLoading.value = true
  try {
    const bankInfoStr = `${editBankForm.bankName}|${editBankForm.cardNumber}|${editBankForm.branchName}|${editBankForm.accountName}`
    await updateProvider(providerId, {
      bankInfo: bankInfoStr
    })
    ElMessage.success('银行信息保存成功')
    editMode.value = false
    loadProviderDetail()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 处理审核
const handleAudit = (action: 'approve' | 'reject') => {
  auditDialog.form.action = action
  auditDialog.form.reason = ''
  auditDialog.visible = true
}

// 提交审核
const submitAudit = async () => {
  if (auditDialog.form.action === 'reject' && !auditDialog.form.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  auditDialog.loading = true
  try {
    await auditProvider(providerId, {
      action: auditDialog.form.action,
      rejectReason: auditDialog.form.reason
    })
    ElMessage.success('审核完成')
    auditDialog.visible = false
    loadProviderDetail()
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    auditDialog.loading = false
  }
}

// 切换封禁状态
const toggleBan = async () => {
  const isBanned = providerDetail.value?.isBanned
  const action = isBanned ? '解封' : '封禁'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}该服务者账号吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await banProvider(providerId, !isBanned)
    ElMessage.success(`${action}成功`)
    loadProviderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 添加属性
const addAttribute = () => {
  const key = prompt('请输入属性名称')
  if (key) {
    editProfileForm.attributes[key] = ''
  }
}

// 添加工作经历
const addWorkHistory = () => {
  editProfileForm.workHistory.push({
    company: '',
    position: '',
    period: [],
    description: ''
  })
}

// 删除工作经历
const removeWorkHistory = (index: number) => {
  editProfileForm.workHistory.splice(index, 1)
}

// 证书相关方法
const showCertInput = () => {
  certInputVisible.value = true
  nextTick(() => {
    certInputRef.value?.focus()
  })
}

const handleCertInputConfirm = () => {
  if (certInputValue.value) {
    editProfileForm.certs.push(certInputValue.value)
  }
  certInputVisible.value = false
  certInputValue.value = ''
}

const removeCert = (index: number) => {
  editProfileForm.certs.splice(index, 1)
}

// 工具方法
const getStatusType = (status?: string) => {
  const typeMap: Record<string, string> = {
    unverified: 'info',
    pending: 'warning',
    verified: 'success',
    rejected: 'danger'
  }
  return typeMap[status || ''] || 'info'
}

const getStatusText = (status?: string) => {
  const textMap: Record<string, string> = {
    unverified: '未认证',
    pending: '待审核',
    verified: '已认证',
    rejected: '已拒绝'
  }
  return textMap[status || ''] || status
}

const getTransactionType = (type: string) => {
  const typeMap: Record<string, string> = {
    income: 'success',
    expense: 'danger',
    frozen: 'warning',
    unfrozen: 'info'
  }
  return typeMap[type] || 'info'
}

const getTransactionText = (type: string) => {
  const textMap: Record<string, string> = {
    income: '收入',
    expense: '支出',
    frozen: '冻结',
    unfrozen: '解冻'
  }
  return textMap[type] || type
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadProviderDetail()
})
</script>

<style scoped>
.provider-detail-page {
  padding: 24px;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 24px;
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basic-info {
  flex: 1;
}

.basic-info h2 {
  margin: 0 0 16px 0;
  color: #303133;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-card {
  min-height: 600px;
}

.detail-form {
  padding: 20px 0;
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.attribute-item {
  display: flex;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-weight: 500;
  color: #606266;
}

.certs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cert-input {
  width: 120px;
  margin: 4px 0;
}

.work-history {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.documents-section {
  padding: 20px 0;
}

.document-group {
  margin-bottom: 32px;
}

.document-group h4 {
  margin-bottom: 16px;
  color: #303133;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-item {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.document-image,
.gallery-image {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  cursor: pointer;
}

.gallery-image {
  width: 150px;
  height: 150px;
}

.wallet-content {
  padding: 20px 0;
}

.balance {
  color: #67C23A;
  font-weight: bold;
  font-size: 18px;
}

.frozen {
  color: #E6A23C;
  font-weight: bold;
}

.income {
  color: #67C23A;
  font-weight: bold;
}

.expense {
  color: #F56C6C;
  font-weight: bold;
}

.bank-content {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .provider-header {
    flex-direction: column;
    text-align: center;
  }
  
  .action-buttons {
    flex-direction: row;
    justify-content: center;
  }
  
  .attributes-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
