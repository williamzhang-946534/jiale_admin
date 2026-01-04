<template>
  <div class="breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
        <router-link
          v-if="index < breadcrumbs.length - 1"
          :to="item.path"
          class="breadcrumb-link"
        >
          {{ item.title }}
        </router-link>
        <span v-else class="breadcrumb-current">
          {{ item.title }}
        </span>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

interface BreadcrumbItem {
  title: string
  path: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 生成面包屑数据
const breadcrumbs = computed(() => {
  const result: BreadcrumbItem[] = []
  const matched = route.matched

  // 添加首页
  result.push({
    title: '首页',
    path: '/dashboard',
  })

  // 添加匹配的路由
  matched.forEach(match => {
    if (match.meta?.title && !match.meta.hidden) {
      result.push({
        title: match.meta.title as string,
        path: match.path,
      })
    }
  })

  return result
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 24px;
  padding: 16px 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.breadcrumb-link {
  color: #409eff;
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: #666;
  font-weight: 500;
}
</style>
