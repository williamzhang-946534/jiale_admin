<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <Warning />
      </div>
      <h1 class="error-code">403</h1>
      <h2 class="error-title">没有权限访问</h2>
      <p class="error-description">
        抱歉，您没有权限访问此页面，请联系管理员获取相应权限。
      </p>
      <el-button type="primary" @click="goBack">
        返回上一页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Warning } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  router.go(-1)
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
  color: #f56c6c;
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
</style>
