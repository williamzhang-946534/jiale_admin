<template>
  <div class="generator-page">
    <div class="page-header">
      <h2>代码生成器</h2>
    </div>
    
    <el-card>
      <el-form :model="form" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="表名">
              <el-input v-model="form.tableName" placeholder="请输入表名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模块名">
              <el-input v-model="form.moduleName" placeholder="请输入模块名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作者">
              <el-input v-model="form.author" placeholder="请输入作者名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="包名">
              <el-input v-model="form.packageName" placeholder="请输入包名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="生成类型">
          <el-checkbox-group v-model="form.generateTypes">
            <el-checkbox label="vue">Vue页面</el-checkbox>
            <el-checkbox label="api">API接口</el-checkbox>
            <el-checkbox label="types">TypeScript类型</el-checkbox>
            <el-checkbox label="sql">SQL脚本</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="generateCode" :loading="loading">
            生成代码
          </el-button>
          <el-button @click="previewCode">预览代码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 代码预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="代码预览"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Vue组件" name="vue">
          <pre><code>{{ previewCode.vue }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="API接口" name="api">
          <pre><code>{{ previewCode.api }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="TypeScript类型" name="types">
          <pre><code>{{ previewCode.types }}</code></pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const previewVisible = ref(false)
const activeTab = ref('vue')

const form = reactive({
  tableName: '',
  moduleName: '',
  author: 'System',
  packageName: 'com.jiale',
  generateTypes: ['vue', 'api', 'types']
})

const previewCode = reactive({
  vue: '',
  api: '',
  types: ''
})

const generateCode = async () => {
  if (!form.tableName || !form.moduleName) {
    ElMessage.warning('请填写表名和模块名')
    return
  }

  loading.value = true
  try {
    // TODO: 调用代码生成API
    ElMessage.success('代码生成成功')
    
    // 模拟生成代码
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('代码已生成到 /generated 目录')
  } catch (error) {
    ElMessage.error('代码生成失败')
  } finally {
    loading.value = false
  }
}

const previewCode = () => {
  if (!form.tableName || !form.moduleName) {
    ElMessage.warning('请填写表名和模块名')
    return
  }

  // 模拟预览代码
  previewCode.vue = `<template>
  <div class="${form.moduleName}-page">
    <h2>${form.moduleName}管理</h2>
    <!-- 页面内容 -->
  </div>
</template>

<script setup lang="ts">
// ${form.moduleName} 页面逻辑
</script>

<style scoped>
.${form.moduleName}-page {
  padding: 20px;
}
</style>`

  previewCode.api = `// ${form.moduleName} API接口
import { get, post, put, del } from '@/utils/request'

export const get${form.moduleName}List = (params?: any) => {
  return get('/${form.moduleName}', params)
}

export const create${form.moduleName} = (data: any) => {
  return post('/${form.moduleName}', data)
}

export const update${form.moduleName} = (id: string, data: any) => {
  return put(\`/\${form.moduleName}/\${id}\`, data)
}

export const delete${form.moduleName} = (id: string) => {
  return del(\`/\${form.moduleName}/\${id}\`)
}`

  previewCode.types = `// ${form.moduleName} TypeScript类型定义
export interface ${form.moduleName} {
  id: string
  createTime: string
  updateTime: string
  // 其他字段...
}`

  previewVisible.value = true
}
</script>

<style scoped>
.generator-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 400px;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
}
</style>
