<template>
  <div class="permission-analysis">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>权限分析中心</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="generateReport">生成报告</el-button>
        <el-button @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 权限概览 -->
      <el-col :span="8">
        <el-card title="权限概览">
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-value">{{ totalRoles }}</div>
              <div class="stat-label">总角色数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalPermissions }}</div>
              <div class="stat-label">总权限点</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 权限分布 -->
      <el-col :span="8">
        <el-card title="权限分布">
          <div class="permission-chart">
            <div v-for="(count, module) in permissionDistribution" :key="module" class="chart-item">
              <div class="chart-label">{{ getModuleName(module) }}</div>
              <div class="chart-bar">
                <div 
                  class="chart-fill" 
                  :style="{ width: `${(count / maxPermissionCount) * 100}%` }"
                ></div>
              </div>
              <div class="chart-value">{{ count }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 角色使用情况 -->
      <el-col :span="8">
        <el-card title="角色使用情况">
          <div class="role-usage">
            <div v-for="role in roleUsageStats" :key="role.name" class="usage-item">
              <div class="usage-info">
                <span class="usage-name">{{ role.name }}</span>
                <span class="usage-count">{{ role.userCount }} 用户</span>
              </div>
              <el-progress 
                :percentage="(role.userCount / totalUsers) * 100" 
                :stroke-width="8"
                :show-text="false"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 权限冲突检测 -->
    <el-card title="权限冲突检测" style="margin-top: 20px">
      <div class="conflict-detection">
        <el-alert
          v-if="conflicts.length === 0"
          title="未发现权限冲突"
          type="success"
          :closable="false"
        />
        <div v-else class="conflict-list">
          <el-alert
            v-for="(conflict, index) in conflicts"
            :key="index"
            :title="conflict.description"
            :type="conflict.severity"
            style="margin-bottom: 8px"
          />
        </div>
      </div>
    </el-card>

    <!-- 权限冗余分析 -->
    <el-card title="权限冗余分析" style="margin-top: 20px">
      <el-table :data="redundancyAnalysis" stripe>
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="redundantPermissions" label="冗余权限" min-width="300">
          <template #default="{ row }">
            <el-tag
              v-for="perm in row.redundantPermissions"
              :key="perm"
              size="small"
              type="warning"
              style="margin-right: 6px"
            >
              {{ getPermissionDisplayName(perm) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" label="建议" min-width="200" />
      </el-table>
    </el-card>

    <!-- 权限覆盖分析 -->
    <el-card title="权限覆盖分析" style="margin-top: 20px">
      <div class="coverage-analysis">
        <el-table :data="coverageAnalysis" stripe>
          <el-table-column prop="permission" label="权限点" width="200" />
          <el-table-column prop="coveredRoles" label="覆盖角色" min-width="300">
            <template #default="{ row }">
              <el-tag
                v-for="role in row.coveredRoles"
                :key="role"
                size="small"
                style="margin-right: 6px"
              >
                {{ role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="coverage" label="覆盖率" width="120">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.coverage" 
                :stroke-width="6"
                :show-text="true"
                :format="() => `${row.coverage}%`"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { PERMISSION_GROUPS, PERMISSION_LIST, getPermissionName } from '@/utils/permissionConfig'

interface Role {
  name: string
  desc?: string
  permissions: string[]
  userCount: number
}

interface Conflict {
  description: string
  severity: 'warning' | 'error' | 'info'
}

interface Redundancy {
  roleName: string
  redundantPermissions: string[]
  suggestion: string
}

interface Coverage {
  permission: string
  coveredRoles: string[]
  coverage: number
}

// 模拟数据
const roles = ref<Role[]>([
  { name: 'admin', desc: '系统管理员', permissions: ['*'], userCount: 2 },
  { name: 'operator', desc: '运营专员', permissions: ['user:view', 'order:view'], userCount: 5 },
  { name: 'finance', desc: '财务专员', permissions: ['finance:view', 'order:refund'], userCount: 1 },
  { name: 'super_user', desc: '超级用户', permissions: ['user:view', 'user:edit', 'user:delete', 'order:view', 'order:assign'], userCount: 3 },
])

const conflicts = ref<Conflict[]>([])
const redundancyAnalysis = ref<Redundancy[]>([])
const coverageAnalysis = ref<Coverage[]>([])

// 计算属性
const totalRoles = computed(() => roles.value.length)
const totalPermissions = computed(() => PERMISSION_LIST.length)
const totalUsers = computed(() => roles.value.reduce((sum, role) => sum + role.userCount, 0))

const permissionDistribution = computed(() => {
  const distribution: Record<string, number> = {}
  
  Object.keys(PERMISSION_GROUPS).forEach(module => {
    distribution[module] = 0
  })
  
  roles.value.forEach(role => {
    if (role.permissions.includes('*')) {
      Object.keys(distribution).forEach(module => {
        distribution[module] += role.userCount
      })
    } else {
      role.permissions.forEach(permission => {
        const [module] = permission.split(':')
        if (distribution[module] !== undefined) {
          distribution[module] += role.userCount
        }
      })
    }
  })
  
  return distribution
})

const maxPermissionCount = computed(() => {
  return Math.max(...Object.values(permissionDistribution.value))
})

const roleUsageStats = computed(() => {
  return roles.value
    .filter(role => role.userCount > 0)
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 5)
})

// 方法
const getModuleName = (module: string): string => {
  const group = PERMISSION_GROUPS[module as keyof typeof PERMISSION_GROUPS]
  return group?.name || module
}

const getPermissionDisplayName = (permission: string): string => {
  if (permission === '*') return '超级权限'
  return getPermissionName(permission)
}

const detectConflicts = () => {
  const newConflicts: Conflict[] = []
  
  // 检测权限过度集中的角色
  roles.value.forEach(role => {
    if (role.permissions.length > 10 && role.permissions[0] !== '*') {
      newConflicts.push({
        description: `角色 "${role.name}" 拥有过多权限 (${role.permissions.length}个)，建议拆分`,
        severity: 'warning'
      })
    }
  })
  
  // 检测权限覆盖问题
  const permissionRoles: Record<string, string[]> = {}
  
  roles.value.forEach(role => {
    role.permissions.forEach(permission => {
      if (!permissionRoles[permission]) {
        permissionRoles[permission] = []
      }
      permissionRoles[permission].push(role.name)
    })
  })
  
  Object.entries(permissionRoles).forEach(([permission, roleNames]) => {
    if (roleNames.length > roles.value.length * 0.8) {
      newConflicts.push({
        description: `权限 "${getPermissionDisplayName(permission)}" 被 ${roleNames.length} 个角色拥有，可能过于普遍`,
        severity: 'info'
      })
    }
  })
  
  conflicts.value = newConflicts
}

const analyzeRedundancy = () => {
  const newRedundancy: Redundancy[] = []
  
  roles.value.forEach(role => {
    if (role.permissions[0] === '*') return
    
    // 检查是否有包含关系的权限
    const redundant: string[] = []
    
    // 如果有 delete 权限，通常不需要单独的 view 权限
    if (role.permissions.some(p => p.includes(':delete'))) {
      role.permissions.forEach(permission => {
        if (permission.includes(':view')) {
          redundant.push(permission)
        }
      })
    }
    
    if (redundant.length > 0) {
      newRedundancy.push({
        roleName: role.name,
        redundantPermissions: redundant,
        suggestion: '删除权限冗余，简化权限配置'
      })
    }
  })
  
  redundancyAnalysis.value = newRedundancy
}

const analyzeCoverage = () => {
  const newCoverage: Coverage[] = []
  
  PERMISSION_LIST.forEach(permission => {
    if (permission === '*') return
    
    const coveredRoles = roles.value
      .filter(role => 
        role.permissions.includes('*') || role.permissions.includes(permission)
      )
      .map(role => role.name)
    
    const coverage = Math.round((coveredRoles.length / roles.value.length) * 100)
    
    newCoverage.push({
      permission: getPermissionDisplayName(permission),
      coveredRoles,
      coverage
    })
  })
  
  coverageAnalysis.value = newCoverage
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 10)
}

const generateReport = () => {
  detectConflicts()
  analyzeRedundancy()
  analyzeCoverage()
  ElMessage.success('分析报告已生成')
}

const refreshData = () => {
  // 这里可以重新从后端获取数据
  generateReport()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  generateReport()
})
</script>

<style scoped>
.permission-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.toolbar-left h2 {
  margin: 0;
  color: #303133;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.permission-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-label {
  width: 80px;
  font-size: 12px;
  color: #606266;
}

.chart-bar {
  flex: 1;
  height: 20px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}

.chart-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.chart-value {
  width: 30px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  color: #303133;
}

.role-usage {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-name {
  font-weight: 500;
  color: #303133;
}

.usage-count {
  font-size: 12px;
  color: #909399;
}

.conflict-detection {
  min-height: 60px;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coverage-analysis {
  overflow-x: auto;
}

:deep(.el-card__header) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f2f5;
}
</style>
