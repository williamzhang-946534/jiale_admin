<template>
  <div class="system-settings-page">
    <div class="page-header">
      <h2>系统设置</h2>
      <el-button type="primary" @click="saveSettings" :loading="loading">
        <el-icon><Check /></el-icon>
        保存设置
      </el-button>
    </div>

    <el-form :model="settings" label-width="150px">
      <!-- 基础信息 -->
      <el-card class="settings-card">
        <template #header>
          <span>基础信息</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="系统名称">
              <el-input
                v-model="settings.systemName"
                placeholder="请输入系统名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="系统版本">
              <el-input
                v-model="settings.systemVersion"
                placeholder="请输入系统版本"
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input
                v-model="settings.contactPhone"
                placeholder="请输入联系电话"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱">
              <el-input
                v-model="settings.contactEmail"
                placeholder="请输入联系邮箱"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="营业时间">
          <el-input
            v-model="settings.businessHours"
            placeholder="请输入营业时间，如：09:00-18:00"
            maxlength="20"
          />
        </el-form-item>
      </el-card>

      <!-- 订单设置 -->
      <el-card class="settings-card">
        <template #header>
          <span>订单设置</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单超时时间">
              <el-input-number
                v-model="settings.orderTimeout"
                :min="5"
                :max="120"
                placeholder="分钟"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #666;">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低订单金额">
              <el-input-number
                v-model="settings.minOrderAmount"
                :min="0"
                :precision="2"
                placeholder="元"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #666;">元</span>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务范围">
              <el-input-number
                v-model="settings.serviceRadius"
                :min="1"
                :max="200"
                placeholder="公里"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #666;">公里</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自动派单">
              <el-switch
                v-model="settings.autoAssign"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 系统状态 -->
      <el-card class="settings-card">
        <template #header>
          <span>系统状态</span>
        </template>
        
        <el-form-item label="维护模式">
          <el-switch
            v-model="settings.maintenanceMode"
            active-text="开启"
            inactive-text="关闭"
          />
          <div style="margin-top: 8px; color: #666; font-size: 12px;">
            开启维护模式后，用户端将无法正常使用系统
          </div>
        </el-form-item>
        
        <el-form-item label="系统公告">
          <el-input
            v-model="settings.announcement"
            type="textarea"
            :rows="3"
            placeholder="请输入系统公告，将在用户端显示"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-card>

      <!-- 通知设置 -->
      <el-card class="settings-card">
        <template #header>
          <span>通知设置</span>
        </template>
        
        <el-form-item label="新订单通知">
          <el-switch
            v-model="settings.newOrderNotification"
            active-text="开启"
            inactive-text="关闭"
          />
          <div style="margin-top: 8px; color: #666; font-size: 12px;">
            有新订单时发送通知给相关服务者
          </div>
        </el-form-item>
        
        <el-form-item label="提现通知">
          <el-switch
            v-model="settings.withdrawNotification"
            active-text="开启"
            inactive-text="关闭"
          />
          <div style="margin-top: 8px; color: #666; font-size: 12px;">
            服务者提现申请时发送通知给管理员
          </div>
        </el-form-item>
        
        <el-form-item label="错误通知">
          <el-switch
            v-model="settings.errorNotification"
            active-text="开启"
            inactive-text="关闭"
          />
          <div style="margin-top: 8px; color: #666; font-size: 12px;">
            系统出现错误时发送通知给管理员
          </div>
        </el-form-item>
        
        <el-form-item label="通知邮箱">
          <el-input
            v-model="settings.notificationEmail"
            placeholder="请输入接收通知的邮箱地址"
            maxlength="50"
          />
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { getSystemSettings, updateSystemSettings } from '@/api/modules/settings'
import type { SystemSettings } from '@/types/api'

const loading = ref(false)

const settings = ref<SystemSettings>({
  systemName: '',
  systemVersion: '',
  contactPhone: '',
  contactEmail: '',
  businessHours: '',
  orderTimeout: 30,
  autoAssign: false,
  minOrderAmount: 0,
  serviceRadius: 50,
  maintenanceMode: false,
  announcement: '',
  newOrderNotification: true,
  withdrawNotification: true,
  errorNotification: true,
  notificationEmail: '',
  // 以下是原有字段，保持兼容性
  systemLogo: '',
  servicePhone: '',
  companyAddress: '',
  defaultServiceRate: 0,
  minWithdrawAmount: 0,
  withdrawFeeRate: 0,
  autoConfirmTime: 0
})

// 加载系统设置
const loadSettings = async () => {
  loading.value = true
  try {
    const response = await getSystemSettings()
    settings.value = { ...settings.value, ...response.data }
  } catch (error) {
    ElMessage.error('获取系统设置失败')
  } finally {
    loading.value = false
  }
}

// 保存系统设置
const saveSettings = async () => {
  // 验证必填字段
  if (!settings.value.systemName) {
    ElMessage.warning('请输入系统名称')
    return
  }
  
  if (!settings.value.contactPhone) {
    ElMessage.warning('请输入联系电话')
    return
  }
  
  if (!settings.value.contactEmail) {
    ElMessage.warning('请输入联系邮箱')
    return
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(settings.value.contactEmail)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }
  
  // 验证通知邮箱格式（如果填写了）
  if (settings.value.notificationEmail && !emailRegex.test(settings.value.notificationEmail)) {
    ElMessage.warning('请输入正确的通知邮箱格式')
    return
  }

  loading.value = true
  try {
    await updateSystemSettings(settings.value)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.system-settings-page {
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

.settings-card {
  margin-bottom: 20px;
}

.settings-card:last-child {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
