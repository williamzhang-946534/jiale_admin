<template>
  <div class="role-page">
    <div class="page-header">
      <h2>角色权限管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="roles" v-loading="loading" stripe>
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="userCount" label="用户数量" width="100" align="center" />
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
            <el-button link type="primary" size="small" @click="editRole(row)">
              编辑
            </el-button>
            <el-button link type="success" size="small" @click="configPermissions(row)">
              权限配置
            </el-button>
            <el-button link type="danger" size="small" @click="deleteRole(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="dialog.form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="dialog.form.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dialog.form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitRole">
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
const roles = ref([])

const dialog = reactive({
  visible: false,
  loading: false,
  title: '新增角色',
  editingRoleId: '',
  form: {
    name: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  }
})

const loadRoles = async () => {
  loading.value = true
  try {
    // TODO: 调用角色API
    // const data = await getRoles()
    // roles.value = data
    
    // Mock数据
    roles.value = [
      {
        id: '1',
        name: '超级管理员',
        code: 'super_admin',
        description: '拥有系统所有权限',
        userCount: 1,
        status: 'active',
        createTime: '2023-12-01 10:00:00'
      }
    ]
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  dialog.title = '新增角色'
  dialog.editingRoleId = ''
  dialog.form = {
    name: '',
    code: '',
    description: '',
    status: 'active'
  }
  dialog.visible = true
}

const editRole = (role: any) => {
  dialog.title = '编辑角色'
  dialog.editingRoleId = role.id
  dialog.form = {
    name: role.name,
    code: role.code,
    description: role.description,
    status: role.status
  }
  dialog.visible = true
}

const submitRole = async () => {
  if (!dialog.form.name || !dialog.form.code) {
    ElMessage.warning('请填写完整信息')
    return
  }

  dialog.loading = true
  try {
    // TODO: 调用创建/更新角色API
    ElMessage.success(dialog.title.includes('编辑') ? '更新成功' : '创建成功')
    dialog.visible = false
    loadRoles()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const configPermissions = (role: any) => {
  ElMessage.info('权限配置功能开发中')
}

const deleteRole = async (role: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // TODO: 调用删除角色API
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.role-page {
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
