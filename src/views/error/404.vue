<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <InfoFilled />
      </div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-description">
        抱歉，您访问的页面不存在，请检查URL或返回首页。
      </p>
      <div class="error-actions">
        <el-button @click="goBack">
          返回上一页
        </el-button>
        <el-button type="primary" @click="goHome">
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.error-content {
  text-align: center;
  padding: 48px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 72px;
  color: #909399;
  margin-bottom: 24px;
}

.error-code {
  margin: 0 0 16px 0;
  font-size: 48px;
  font-weight: bold;
  color: #333;
}

.error-title {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #666;
}

.error-description {
  margin: 0 0 32px 0;
  color: #999;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
