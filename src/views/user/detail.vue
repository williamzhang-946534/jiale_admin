<template>
  <div class="user-detail-page">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/user' }">用户管理</el-breadcrumb-item>
        <el-breadcrumb-item>用户详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <el-card>
      <div class="user-info">
        <el-descriptions title="用户信息" :column="2" border>
          <el-descriptions-item label="用户ID">{{ userInfo.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ userInfo.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleType(userInfo.role)">{{ getRoleName(userInfo.role) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="userInfo.status === 'active' ? 'success' : 'danger'">
              {{ userInfo.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ userInfo.createTime }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ userInfo.lastLoginTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElBreadcrumb, ElBreadcrumbItem, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'

const route = useRoute()
const userInfo = ref({})

const getRoleType = (role: string) => {
  switch (role) {
    case 'super_admin': return 'danger'
    case 'admin': return 'warning'
    case 'operator': return 'info'
    default: return ''
  }
}

const getRoleName = (role: string) => {
  switch (role) {
    case 'super_admin': return '超级管理员'
    case 'admin': return '管理员'
    case 'operator': return '操作员'
    default: return role
  }
}

const loadUserDetail = async () => {
  const userId = route.params.id
  // TODO: 调用获取用户详情API
  // const data = await getUserDetail(userId)
  // userInfo.value = data
  
  // Mock数据
  userInfo.value = {
    id: userId,
    username: 'admin',
    nickname: '管理员',
    phone: '13800138000',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createTime: '2023-12-01 10:00:00',
    lastLoginTime: '2023-12-01 15:30:00'
  }
}

onMounted(() => {
  loadUserDetail()
})
</script>

<style scoped>
.user-detail-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.user-info {
  padding: 20px;
}
</style>
