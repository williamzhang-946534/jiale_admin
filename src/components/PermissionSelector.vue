<template>
  <div class="permission-selector">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane 
        v-for="(group, module) in permissionGroups" 
        :key="module"
        :label="group.name"
        :name="module"
      >
        <el-checkbox-group v-model="selectedPermissions">
          <div class="permission-grid">
            <el-checkbox
              v-for="permission in group.permissions"
              :key="permission"
              :value="permission"
              :label="getPermissionDisplayName(permission)"
            />
          </div>
        </el-checkbox-group>
      </el-tab-pane>
    </el-tabs>
    
    <div class="permission-summary">
      <h4>已选权限 ({{ selectedPermissions.length }})</h4>
      <div class="selected-tags">
        <el-tag
          v-for="perm in selectedPermissions"
          :key="perm"
          closable
          @close="removePermission(perm)"
          size="small"
          style="margin: 4px"
        >
          {{ getPermissionDisplayName(perm) }}
        </el-tag>
      </div>
      
      <div class="quick-actions">
        <el-button size="small" @click="selectAll">全选</el-button>
        <el-button size="small" @click="clearAll">清空</el-button>
        <el-select v-model="selectedTemplate" placeholder="选择角色模板" size="small" style="width: 150px">
          <el-option
            v-for="(template, key) in roleTemplates"
            :key="key"
            :label="template.name"
            :value="key"
            @click="applyTemplate(key)"
          />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PERMISSION_GROUPS, ROLE_TEMPLATES, getPermissionName } from '@/utils/permissionConfig'

interface Props {
  modelValue: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('user')
const selectedTemplate = ref('')

const permissionGroups = PERMISSION_GROUPS
const roleTemplates = ROLE_TEMPLATES

const selectedPermissions = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听模板选择
const applyTemplate = (templateKey: string) => {
  const template = roleTemplates[templateKey as keyof typeof roleTemplates]
  if (template) {
    selectedPermissions.value = [...template.permissions]
  }
}

// 权限显示名称
const getPermissionDisplayName = (permission: string): string => {
  const [module, action] = permission.split(':')
  const actionNames: Record<string, string> = {
    view: '查看',
    create: '创建',
    edit: '编辑', 
    delete: '删除',
    audit: '审核',
    ban: '封禁',
    assign: '指派',
    refund: '退款',
    manage: '管理',
    export: '导出',
    give_coupon: '赠送优惠券',
    audit_withdrawal: '审核提现',
    manage_banner: '管理轮播图',
    manage_coupon: '管理优惠券',
    manage_role: '管理角色',
    manage_admin: '管理管理员',
    view_log: '查看日志',
    use_generator: '使用代码生成器'
  }
  
  return `${actionNames[action] || action}`
}

// 移除权限
const removePermission = (permission: string) => {
  const index = selectedPermissions.value.indexOf(permission)
  if (index > -1) {
    selectedPermissions.value.splice(index, 1)
  }
}

// 全选当前模块
const selectAll = () => {
  const currentGroup = permissionGroups[activeTab.value as keyof typeof permissionGroups]
  if (currentGroup) {
    const newPermissions = new Set(selectedPermissions.value)
    currentGroup.permissions.forEach(perm => newPermissions.add(perm))
    selectedPermissions.value = Array.from(newPermissions)
  }
}

// 清空所有
const clearAll = () => {
  selectedPermissions.value = []
}

// 监听标签页变化，自动展开对应权限
watch(activeTab, (newTab) => {
  // 可以在这里添加自动展开逻辑
})
</script>

<style scoped>
.permission-selector {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 16px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.permission-summary {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.permission-summary h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.selected-tags {
  min-height: 40px;
  margin-bottom: 12px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-tabs__content) {
  padding: 16px 0;
}

:deep(.el-checkbox) {
  margin-right: 12px;
  margin-bottom: 8px;
}
</style>
