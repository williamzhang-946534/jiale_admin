<template>
  <div class="roles-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="keyword"
          placeholder="角色名称"
          clearable
          style="width: 200px"
          @clear="filterList"
          @keyup.enter="filterList"
        />
        <el-button type="primary" @click="openCreate">新增角色</el-button>
        <el-button type="success" @click="openBatchImport">批量导入</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="exportRoles">导出配置</el-button>
        <el-button @click="fetchRoles" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-table :data="filteredRoles" v-loading="loading" stripe>
      <el-table-column prop="name" label="角色名称" width="180">
        <template #default="{ row }">
          <el-tag :type="row.name === 'admin' ? 'danger' : 'primary'">
            {{ row.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="desc" label="描述" min-width="240" />
      <el-table-column prop="permissions" label="权限" min-width="400">
        <template #default="{ row }">
          <div class="permission-tags">
            <el-tag 
              v-for="p in row.permissions" 
              :key="p" 
              size="small" 
              style="margin-right: 6px; margin-bottom: 4px"
              :type="p === '*' ? 'danger' : 'info'"
            >
              {{ getPermissionDisplayName(p) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="userCount" label="用户数" width="100" align="center" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="editRole(row)">
            编辑
          </el-button>
          <el-button link type="success" size="small" @click="duplicateRole(row)">
            复制
          </el-button>
          <el-button 
            link 
            type="danger" 
            size="small" 
            @click="deleteRole(row)"
            :disabled="row.name === 'admin'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 增强版角色编辑对话框 -->
    <el-dialog 
      v-model="createDialog.visible" 
      :title="isEdit ? '编辑角色' : '新增角色'" 
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="createDialog.form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色名称" required>
              <el-input 
                v-model="createDialog.form.name" 
                placeholder="输入角色名称" 
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="描述">
              <el-input v-model="createDialog.form.desc" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="权限配置">
          <PermissionSelector v-model="createDialog.form.permissions" />
        </el-form-item>
        
        <el-form-item label="权限预览">
          <div class="permission-preview">
            <span v-if="createDialog.form.permissions.length === 0" class="no-permissions">
              暂无权限
            </span>
            <el-tag
              v-for="perm in createDialog.form.permissions"
              :key="perm"
              size="small"
              style="margin: 2px"
              :type="perm === '*' ? 'danger' : 'info'"
            >
              {{ getPermissionDisplayName(perm) }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="createDialog.loading" @click="submitCreate">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PermissionSelector from '@/components/PermissionSelector.vue'
import { ROLE_TEMPLATES, getPermissionName } from '@/utils/permissionConfig'

interface RoleItem {
  name: string
  desc?: string
  permissions: string[]
  userCount?: number
}

const loading = ref(false)
const isEdit = ref(false)
const roles = ref<RoleItem[]>([
  { name: 'admin', desc: '系统管理员', permissions: ['*'], userCount: 2 },
  { name: 'operator', desc: '运营专员', permissions: ['user:view', 'order:view'], userCount: 5 },
  { name: 'finance', desc: '财务专员', permissions: ['finance:view', 'order:refund'], userCount: 1 },
])
const keyword = ref('')

const createDialog = ref({
  visible: false,
  loading: false,
  form: {
    name: '',
    desc: '',
    permissions: [] as string[],
  },
})

const fetchRoles = async () => {
  loading.value = true
  try {
    // TODO: 等后端提供角色接口后替换为真实请求
  } finally {
    loading.value = false
  }
}

const filteredRoles = computed(() => {
  if (!keyword.value) return roles.value
  return roles.value.filter(r => r.name.includes(keyword.value) || (r.desc || '').includes(keyword.value))
})

const filterList = () => {
  // computed 已处理
}

const openCreate = () => {
  isEdit.value = false
  createDialog.value.visible = true
  createDialog.value.form = { name: '', desc: '', permissions: [] }
}

const editRole = (role: RoleItem) => {
  isEdit.value = true
  createDialog.value.visible = true
  createDialog.value.form = {
    name: role.name,
    desc: role.desc || '',
    permissions: [...role.permissions]
  }
}

const duplicateRole = (role: RoleItem) => {
  isEdit.value = false
  createDialog.value.visible = true
  createDialog.value.form = {
    name: `${role.name}_copy`,
    desc: `${role.desc || ''} (复制)`,
    permissions: [...role.permissions]
  }
}

const deleteRole = async (role: RoleItem) => {
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
    
    const index = roles.value.findIndex(r => r.name === role.name)
    if (index > -1) {
      roles.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const openBatchImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

const exportRoles = () => {
  const data = JSON.stringify(roles.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'roles-config.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const getPermissionDisplayName = (permission: string): string => {
  if (permission === '*') return '超级权限'
  return getPermissionName(permission)
}

const submitCreate = async () => {
  if (!createDialog.value.form.name) {
    ElMessage.warning('请输入角色名称')
    return
  }
  
  if (createDialog.value.form.permissions.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    return
  }
  
  createDialog.value.loading = true
  try {
    if (isEdit.value) {
      // 编辑模式
      const index = roles.value.findIndex(r => r.name === createDialog.value.form.name)
      if (index > -1) {
        roles.value[index] = {
          ...roles.value[index],
          desc: createDialog.value.form.desc,
          permissions: createDialog.value.form.permissions
        }
      }
      ElMessage.success('更新成功')
    } else {
      // 检查角色名是否已存在
      if (roles.value.some(r => r.name === createDialog.value.form.name)) {
        ElMessage.error('角色名已存在')
        return
      }
      
      // 新增模式
      roles.value.push({
        name: createDialog.value.form.name,
        desc: createDialog.value.form.desc,
        permissions: createDialog.value.form.permissions,
        userCount: 0
      })
      ElMessage.success('创建成功')
    }
    
    createDialog.value.visible = false
  } finally {
    createDialog.value.loading = false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.roles-page {
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

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.permission-preview {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background: #f5f7fa;
}

.no-permissions {
  color: #909399;
  font-style: italic;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-tag) {
  font-size: 12px;
}
</style>


