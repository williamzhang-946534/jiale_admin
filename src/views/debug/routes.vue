<template>
  <div class="debug-routes">
    <h2>路由调试信息</h2>
    
    <el-card title="用户菜单信息" class="debug-card">
      <pre>{{ JSON.stringify(authStore.userMenus, null, 2) }}</pre>
    </el-card>

    <el-card title="生成的路由信息" class="debug-card">
      <pre>{{ JSON.stringify(generatedRoutes, null, 2) }}</pre>
    </el-card>

    <el-card title="当前路由信息" class="debug-card">
      <div>
        <p><strong>当前路径:</strong> {{ $route.path }}</p>
        <p><strong>当前名称:</strong> {{ $route.name }}</p>
        <p><strong>路由参数:</strong> {{ $route.params }}</p>
        <p><strong>查询参数:</strong> {{ $route.query }}</p>
      </div>
    </el-card>

    <el-card title="所有路由" class="debug-card">
      <div v-for="route in $router.getRoutes()" :key="route.path" class="route-item">
        <strong>{{ route.path }}</strong> - {{ route.name }}
        <span v-if="route.meta?.title">({{ route.meta.title }})</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { usePermissionStore } from '@/store/permission'

const authStore = useAuthStore()
const permissionStore = usePermissionStore()

const generatedRoutes = computed(() => {
  return permissionStore.dynamicRoutes.map(route => ({
    path: route.path,
    name: route.name,
    title: route.meta?.title,
    component: route.component?.toString?.().slice(0, 100) + '...'
  }))
})
</script>

<style scoped>
.debug-routes {
  padding: 20px;
}

.debug-card {
  margin-bottom: 20px;
}

.debug-card pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}

.route-item {
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}
</style>
