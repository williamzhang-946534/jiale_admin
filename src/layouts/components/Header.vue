<template>
  <div class="header">
    <!-- 左侧：折叠按钮 -->
    <div class="header-left">
      <el-button
        type="text"
        size="large"
        @click="handleToggleSidebar"
      >
        <el-icon>
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </el-button>
    </div>

    <!-- 右侧：用户信息和操作 -->
    <div class="header-right">
      <!-- 消息通知 -->
      <el-badge :value="notificationCount" :max="99" class="notification-badge">
        <el-button type="text" size="large" @click="showNotifications">
          <el-icon>
            <Bell />
          </el-icon>
        </el-button>
      </el-badge>

      <!-- 用户下拉菜单 -->
      <el-dropdown @command="handleCommand" class="user-dropdown">
        <span class="user-info">
          <el-avatar
            :size="32"
            :src="authStore.user?.avatar"
            class="user-avatar"
          >
            {{ authStore.user?.nickname?.charAt(0) || '用' }}
          </el-avatar>
          <span class="user-name">{{ authStore.user?.nickname || '用户' }}</span>
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Fold,
  Expand,
  Bell,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'

interface Props {
  collapsed: boolean
}

interface Emits {
  (e: 'toggle-sidebar'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const authStore = useAuthStore()

// 通知数量（暂时写死，后续从接口获取）
const notificationCount = ref(0)

const handleToggleSidebar = () => {
  emit('toggle-sidebar')
}

const showNotifications = () => {
  ElMessage.info('消息通知功能开发中')
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中')
      break
    case 'settings':
      ElMessage.info('系统设置功能开发中')
      break
    case 'logout':
      await handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    authStore.logout()
    router.push('/login')
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
.header {
  height: 64px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.user-avatar {
  margin-right: 8px;
}

.user-name {
  margin-right: 8px;
  font-size: 14px;
  color: #333;
}

.notification-badge {
  cursor: pointer;
}

@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }

  .user-name {
    display: none;
  }
}
</style>
