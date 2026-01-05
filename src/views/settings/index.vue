<template>
  <div class="settings-page">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 会员配置 -->
        <el-tab-pane label="会员配置" name="membership">
          <div class="tab-content">
            <el-form :model="membershipForm" label-width="120px" style="max-width: 600px">
              <h3>会员等级设置</h3>
              
              <el-form-item label="普通会员">
                <div class="membership-level">
                  <el-input v-model="membershipForm.basic.name" placeholder="等级名称" style="width: 200px" />
                  <el-input-number 
                    v-model="membershipForm.basic.price" 
                    :min="0" 
                    :precision="2"
                    placeholder="价格"
                    style="width: 150px; margin-left: 12px"
                  />
                  <span style="margin-left: 8px; color: #909399;">元/月</span>
                </div>
                <el-input
                  v-model="membershipForm.basic.benefits"
                  type="textarea"
                  :rows="3"
                  placeholder="会员权益描述"
                  style="margin-top: 12px"
                />
              </el-form-item>

              <el-form-item label="黄金会员">
                <div class="membership-level">
                  <el-input v-model="membershipForm.gold.name" placeholder="等级名称" style="width: 200px" />
                  <el-input-number 
                    v-model="membershipForm.gold.price" 
                    :min="0" 
                    :precision="2"
                    placeholder="价格"
                    style="width: 150px; margin-left: 12px"
                  />
                  <span style="margin-left: 8px; color: #909399;">元/月</span>
                </div>
                <el-input
                  v-model="membershipForm.gold.benefits"
                  type="textarea"
                  :rows="3"
                  placeholder="会员权益描述"
                  style="margin-top: 12px"
                />
              </el-form-item>

              <el-form-item label="钻石会员">
                <div class="membership-level">
                  <el-input v-model="membershipForm.diamond.name" placeholder="等级名称" style="width: 200px" />
                  <el-input-number 
                    v-model="membershipForm.diamond.price" 
                    :min="0" 
                    :precision="2"
                    placeholder="价格"
                    style="width: 150px; margin-left: 12px"
                  />
                  <span style="margin-left: 8px; color: #909399;">元/月</span>
                </div>
                <el-input
                  v-model="membershipForm.diamond.benefits"
                  type="textarea"
                  :rows="3"
                  placeholder="会员权益描述"
                  style="margin-top: 12px"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="membershipLoading" @click="saveMembership">
                  保存配置
                </el-button>
                <el-button @click="loadMembership">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 管理员账号 -->
        <el-tab-pane label="管理员账号" name="admins">
          <div class="tab-content">
            <div class="toolbar">
              <div class="toolbar-left">
                <el-button type="primary" @click="openAdminDialog">添加管理员</el-button>
                <el-button @click="loadAdmins" :loading="adminLoading">刷新</el-button>
              </div>
              <div class="toolbar-right">
                <el-input
                  v-model="adminSearchKeyword"
                  placeholder="搜索用户名"
                  style="width: 200px"
                  clearable
                  @clear="loadAdmins"
                  @keyup.enter="loadAdmins"
                />
              </div>
            </div>

            <el-table :data="admins" v-loading="adminLoading" stripe>
              <el-table-column prop="username" label="用户名" min-width="150" />
              
              <el-table-column prop="realName" label="真实姓名" width="120" />
              
              <el-table-column prop="email" label="邮箱" min-width="200" />
              
              <el-table-column prop="adminId" label="ID" width="80" />
              
              <el-table-column prop="role" label="角色" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getRoleType(row.role)">
                    {{ getRoleText(row.role) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    active-value="active"
                    inactive-value="disabled"
                    @change="updateAdminStatus(row)"
                  />
                </template>
              </el-table-column>

              <el-table-column prop="lastLoginTime" label="最后登录" width="180" />
              
              <el-table-column prop="createTime" label="创建时间" width="180" />

              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="editAdmin(row)">
                    编辑
                  </el-button>
                  <el-button link type="warning" size="small" @click="resetPassword(row)">
                    重置密码
                  </el-button>
                  <el-button 
                    v-if="row.adminId !== currentAdminId"
                    link 
                    type="danger" 
                    size="small" 
                    @click="deleteAdmin(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 系统参数 -->
        <el-tab-pane label="系统参数" name="system">
          <div class="tab-content">
            <el-form :model="systemForm" label-width="150px" style="max-width: 800px">
              <h3>基础设置</h3>
              
              <el-form-item label="系统名称">
                <el-input v-model="systemForm.systemName" placeholder="请输入系统名称" />
              </el-form-item>

              <el-form-item label="系统Logo">
                <el-upload
                  v-model:file-list="logoFiles"
                  :auto-upload="false"
                  list-type="picture-card"
                  :limit="1"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </el-form-item>

              <el-form-item label="客服电话">
                <el-input v-model="systemForm.servicePhone" placeholder="请输入客服电话" />
              </el-form-item>

              <el-form-item label="客服邮箱">
                <el-input v-model="systemForm.serviceEmail" placeholder="请输入客服邮箱" />
              </el-form-item>

              <el-form-item label="公司地址">
                <el-input v-model="systemForm.companyAddress" placeholder="请输入公司地址" />
              </el-form-item>

              <h3 style="margin-top: 30px">业务设置</h3>

              <el-form-item label="默认服务费率">
                <el-input-number 
                  v-model="systemForm.defaultServiceRate" 
                  :min="0" 
                  :max="100"
                  :precision="2"
                  style="width: 200px"
                />
                <span style="margin-left: 8px; color: #909399;">%</span>
              </el-form-item>

              <el-form-item label="最低提现金额">
                <el-input-number 
                  v-model="systemForm.minWithdrawAmount" 
                  :min="0" 
                  :precision="2"
                  style="width: 200px"
                />
                <span style="margin-left: 8px; color: #909399;">元</span>
              </el-form-item>

              <el-form-item label="提现手续费率">
                <el-input-number 
                  v-model="systemForm.withdrawFeeRate" 
                  :min="0" 
                  :max="100"
                  :precision="2"
                  style="width: 200px"
                />
                <span style="margin-left: 8px; color: #909399;">%</span>
              </el-form-item>

              <el-form-item label="订单自动确认时间">
                <el-input-number 
                  v-model="systemForm.autoConfirmTime" 
                  :min="0"
                  style="width: 200px"
                />
                <span style="margin-left: 8px; color: #909399;">小时</span>
              </el-form-item>

              <h3 style="margin-top: 30px">通知设置</h3>

              <el-form-item label="新订单通知">
                <el-switch v-model="systemForm.newOrderNotification" />
              </el-form-item>

              <el-form-item label="提现申请通知">
                <el-switch v-model="systemForm.withdrawNotification" />
              </el-form-item>

              <el-form-item label="系统异常通知">
                <el-switch v-model="systemForm.errorNotification" />
              </el-form-item>

              <el-form-item label="通知邮箱">
                <el-input v-model="systemForm.notificationEmail" placeholder="接收通知的邮箱" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="systemLoading" @click="saveSystem">
                  保存配置
                </el-button>
                <el-button @click="loadSystem">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 管理员编辑对话框 -->
    <el-dialog
      v-model="adminDialog.visible"
      :title="adminDialog.title"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="adminDialog.form" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="adminDialog.form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="真实姓名" required>
          <el-input v-model="adminDialog.form.realName" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="邮箱" required>
          <el-input v-model="adminDialog.form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="adminDialog.form.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="角色" required>
          <el-select v-model="adminDialog.form.role" placeholder="选择角色" style="width: 100%">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="管理员" value="admin" />
            <el-option label="运营" value="operator" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="adminDialog.title === '添加管理员'" label="密码" required>
          <el-input
            v-model="adminDialog.form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="adminDialog.form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adminDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="adminDialog.loading" @click="submitAdmin">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'
import { 
  getMembershipSettings,
  updateMembershipSettings,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin as deleteAdminApi,
  resetAdminPassword,
  getSystemSettings,
  updateSystemSettings
} from '@/api/modules/settings'
import type { Admin, MembershipSettings, SystemSettings } from '@/types/api'

const authStore = useAuthStore()
const activeTab = ref('membership')
const currentAdminId = ref(authStore.user?.id || '')

// 会员配置
const membershipForm = reactive({
  basic: {
    name: '普通会员',
    price: 0,
    benefits: '基础服务权益\n每月2张优惠券\n标准客服支持'
  },
  gold: {
    name: '黄金会员',
    price: 29.9,
    benefits: '全部基础权益\n每月5张优惠券\n优先客服支持\n95折服务优惠'
  },
  diamond: {
    name: '钻石会员',
    price: 99.9,
    benefits: '全部黄金权益\n每月10张优惠券\n专属客服经理\n9折服务优惠\n免费上门评估'
  }
})
const membershipLoading = ref(false)

// 管理员账号
const admins = ref<Admin[]>([])
const adminLoading = ref(false)
const adminSearchKeyword = ref('')

const adminDialog = reactive({
  visible: false,
  loading: false,
  title: '',
  form: {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'admin',
    password: '',
    status: 'active'
  }
})

// 系统参数
const systemForm = reactive({
  systemName: '家乐家政管理系统',
  systemLogo: '',
  servicePhone: '400-123-4567',
  serviceEmail: 'service@jiale.com',
  companyAddress: '北京市朝阳区xxx街道xxx号',
  defaultServiceRate: 10,
  minWithdrawAmount: 100,
  withdrawFeeRate: 2,
  autoConfirmTime: 24,
  newOrderNotification: true,
  withdrawNotification: true,
  errorNotification: true,
  notificationEmail: 'admin@jiale.com'
})
const systemLoading = ref(false)
const logoFiles = ref([] as any[])

const loadMembership = async () => {
  membershipLoading.value = true
  try {
    const data = await getMembershipSettings()
    if (data) {
      Object.assign(membershipForm, data)
    }
  } catch (error) {
    ElMessage.error('获取会员配置失败')
    // 使用默认值
  } finally {
    membershipLoading.value = false
  }
}

const saveMembership = async () => {
  membershipLoading.value = true
  try {
    await updateMembershipSettings(membershipForm)
    ElMessage.success('会员配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    membershipLoading.value = false
  }
}

const loadAdmins = async () => {
  adminLoading.value = true
  try {
    const data = await getAdmins({ keyword: adminSearchKeyword.value })
    admins.value = data
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
    // Mock数据
    admins.value = [
      {
        id: '1',
        username: 'admin',
        realName: '系统管理员',
        email: 'admin@jiale.com',
        phone: '13800138000',
        role: 'super_admin',
        status: 'active',
        lastLoginTime: '2024-01-20 09:30:00',
        createTime: '2023-01-01 10:00:00'
      },
      {
        id: '2',
        username: 'operator1',
        realName: '张三',
        email: 'zhangsan@jiale.com',
        phone: '13800138001',
        role: 'operator',
        status: 'active',
        lastLoginTime: '2024-01-19 14:20:00',
        createTime: '2023-06-15 11:00:00'
      }
    ]
  } finally {
    adminLoading.value = false
  }
}

const openAdminDialog = () => {
  adminDialog.title = '添加管理员'
  adminDialog.form = {
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'admin',
    password: '',
    status: 'active'
  }
  adminDialog.visible = true
}

const editAdmin = (admin: Admin) => {
  adminDialog.title = '编辑管理员'
  adminDialog.form = {
    username: admin.username,
    realName: admin.realName,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    password: '',
    status: admin.status
  }
  adminDialog.visible = true
}

const submitAdmin = async () => {
  if (!adminDialog.form.username || !adminDialog.form.realName || !adminDialog.form.email) {
    ElMessage.warning('请填写完整信息')
    return
  }

  adminDialog.loading = true
  try {
    if (adminDialog.title === '添加管理员') {
      if (!adminDialog.form.password) {
        ElMessage.warning('请输入密码')
        return
      }
      await createAdmin(adminDialog.form)
      ElMessage.success('添加成功')
    } else {
      await updateAdmin(adminDialog.form.id || '', adminDialog.form)
      ElMessage.success('更新成功')
    }
    
    adminDialog.visible = false
    loadAdmins()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    adminDialog.loading = false
  }
}

const updateAdminStatus = async (admin: Admin) => {
  try {
    await updateAdmin(admin.id, { status: admin.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const resetPassword = async (admin: Admin) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置 ${admin.realName} 的密码吗？`,
      '重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const result = await resetAdminPassword(admin.id)
    ElMessage.success(`密码已重置为: ${result.newPassword}`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败')
    }
  }
}

const deleteAdmin = async (admin: Admin) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除管理员 ${admin.realName} 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteAdminApi(admin.id)
    ElMessage.success('删除成功')
    loadAdmins()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const loadSystem = async () => {
  systemLoading.value = true
  try {
    const data = await getSystemSettings()
    if (data) {
      Object.assign(systemForm, data)
    }
  } catch (error) {
    ElMessage.error('获取系统配置失败')
    // 使用默认值
  } finally {
    systemLoading.value = false
  }
}

const saveSystem = async () => {
  systemLoading.value = true
  try {
    await updateSystemSettings(systemForm)
    ElMessage.success('系统配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    systemLoading.value = false
  }
}

const getRoleType = (role: string) => {
  const typeMap: Record<string, string> = {
    super_admin: 'danger',
    admin: 'warning',
    operator: 'primary'
  }
  return typeMap[role] || 'info'
}

const getRoleText = (role: string) => {
  const textMap: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    operator: '运营'
  }
  return textMap[role] || role
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'membership') {
    loadMembership()
  } else if (tabName === 'admins') {
    loadAdmins()
  } else if (tabName === 'system') {
    loadSystem()
  }
}

onMounted(() => {
  loadMembership()
})
</script>

<style scoped>
.settings-page {
  padding: 0;
}

.tab-content {
  padding: 20px 0;
}

.toolbar {
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

.membership-level {
  display: flex;
  align-items: center;
}

h3 {
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .membership-level {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
