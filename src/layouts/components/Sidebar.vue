<template>
  <div class="sidebar" :class="{ collapsed }">
    <!-- Logo区域 -->
    <div class="sidebar-logo">
      <img src="@/assets/logo.png" alt="家乐家政" class="logo-img" />
      <span v-if="!collapsed" class="logo-text">家乐家政</span>
    </div>

    <!-- 菜单区域 -->
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      :collapse="collapsed"
      :unique-opened="true"
      router
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
    >
      <template v-if="menus && menus.length > 0">
        <template v-for="menu in menus" :key="menu.id">
        <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
          <template #title>
            <el-icon>
              <component :is="iconMap[menu.icon] || iconMap.Menu" />
            </el-icon>
            <span>{{ menu.name }}</span>
          </template>
          <el-menu-item
            v-for="child in menu.children"
            :key="child.id"
            :index="child.path"
          >
            <el-icon>
              <component :is="iconMap[child.icon] || iconMap.Document" />
            </el-icon>
            <span>{{ child.name }}</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-else :index="menu.path">
          <el-icon>
            <component :is="iconMap[menu.icon] || iconMap.Document" />
          </el-icon>
          <span>{{ menu.name }}</span>
        </el-menu-item>
        </template>
      </template>
      <div v-else class="empty-menu">
        <p>暂无菜单数据</p>
      </div>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import type { MenuItem } from '@/store/auth'
// 导入所有可能用到的图标
import {
  Monitor,
  Avatar,
  Document,
  Service,
  User,
  Money,
  Ticket,
  Tools,
  Lock,
  Menu,
  House,
  Star
} from '@element-plus/icons-vue'

interface Props {
  collapsed: boolean
  menus: MenuItem[]
}

interface Emits {
  (e: 'update:collapsed', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const authStore = useAuthStore()

// 图标映射
const iconMap: Record<string, any> = {
  Monitor,
  Avatar,
  Document,
  Service,
  User,
  Money,
  Ticket,
  Tools,
  Lock,
  Menu,
  House,
  Star
}

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 监听路由变化，自动展开对应的菜单
watch(
  () => route.path,
  (newPath) => {
    // 这里可以添加逻辑来展开对应的父级菜单
  }
)
</script>

<style scoped>
.sidebar {
  background-color: #304156;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid #1f2d3d;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

.empty-menu {
  padding: 20px;
  text-align: center;
  color: #bfcbd9;
  font-size: 14px;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }
}
</style>
