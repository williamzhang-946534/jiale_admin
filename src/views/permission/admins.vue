<template>
  <div class="admin-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCreate">新增管理员</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="fetchAdmins" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-table :data="admins" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="username" label="用户名" width="160" />
      <el-table-column prop="nickname" label="昵称" width="160" />
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
    </el-table>

    <el-dialog v-model="createDialog.visible" title="新增管理员" width="420px">
      <el-form :model="createDialog.form" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="createDialog.form.username" placeholder="输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="createDialog.form.password" type="password" placeholder="输入密码" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="createDialog.form.nickname" placeholder="可选" />
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="createDialog.form.role" placeholder="例如：admin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="createDialog.loading" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdmins, createAdmin, type AdminItem, type CreateAdminPayload } from '@/api/modules/admin'

const loading = ref(false)
const admins = ref<AdminItem[]>([])

const createDialog = ref({
  visible: false,
  loading: false,
  form: {
    username: '',
    password: '',
    nickname: '',
    role: '',
  } as CreateAdminPayload,
})

const fetchAdmins = async () => {
  loading.value = true
  try {
    const res = await getAdmins()
    admins.value = res.list
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  createDialog.value.visible = true
  createDialog.value.form = {
    username: '',
    password: '',
    nickname: '',
    role: '',
  }
}

const submitCreate = async () => {
  if (!createDialog.value.form.username || !createDialog.value.form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  createDialog.value.loading = true
  try {
    await createAdmin(createDialog.value.form)
    ElMessage.success('创建成功')
    createDialog.value.visible = false
    fetchAdmins()
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    createDialog.value.loading = false
  }
}

onMounted(() => {
  fetchAdmins()
})
</script>

<style scoped>
.admin-page {
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
</style>


