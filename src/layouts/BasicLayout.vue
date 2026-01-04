<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <Sidebar
      class="layout-sidebar"
      :class="{ collapsed: sidebarCollapsed }"
      v-model:collapsed="sidebarCollapsed"
      :menus="authStore.userMenus"
    />

    <!-- 主内容区 -->
    <div class="layout-main">
      <!-- 顶部栏 -->
      <Header
        :collapsed="sidebarCollapsed"
        @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
      />

      <!-- 主体内容 -->
      <div class="layout-body">
        <!-- 面包屑导航 -->
        <Breadcrumb />

        <!-- 页面内容 -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import Breadcrumb from './components/Breadcrumb.vue'

const authStore = useAuthStore()
const sidebarCollapsed = ref(false)

// 初始化认证状态
onMounted(() => {
  authStore.initAuth()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: row;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .layout-body {
    padding: 16px;
  }
}
</style>
