<template>
  <div class="category-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="openCreate('root')">新增一级分类</el-button>
        <el-button @click="expandAll">展开全部</el-button>
        <el-button @click="collapseAll">收起全部</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="loadCategories" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-card>
      <el-table
        ref="tableRef"
        :data="categoryTree"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <div class="category-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="!row.parentId" size="small" type="primary">一级</el-tag>
              <el-tag v-else size="small" type="info">二级</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="sortOrder" label="排序" width="100" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.sortOrder"
              :min="0"
              size="small"
              @change="updateSortOrder(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              :before-change="() => handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" />

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openCreate('child', row)">
              新增子分类
            </el-button>
            <el-button link type="success" size="small" @click="editCategory(row)">
              编辑
            </el-button>
            <el-button 
              link 
              type="danger" 
              size="small" 
              @click="deleteCategory(row)"
              :disabled="row.children && row.children.length > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialog.form" label-width="100px">
        <el-form-item label="分类名称" required>
          <el-input v-model="dialog.form.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="父级分类" v-if="dialog.type === 'child'">
          <el-input v-model="dialog.parentName" disabled />
        </el-form-item>

        <el-form-item label="图标" v-if="dialog.type === 'root'">
          <el-input v-model="dialog.form.icon" placeholder="请输入图标URL">
            <template #append>
              <el-button @click="previewIcon">预览</el-button>
            </template>
          </el-input>
          <div v-if="dialog.form.icon" class="icon-preview">
            <img :src="dialog.form.icon" alt="图标预览" />
          </div>
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="dialog.form.sortOrder" :min="0" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="dialog.form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitCategory">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { getCategories, createCategory, updateCategory, deleteCategory as deleteCategoryApi } from '@/api/modules/category'
import type { Category } from '@/types/api'

const tableRef = ref<InstanceType<typeof ElTable>>()
const loading = ref(false)
const categoryTree = ref<Category[]>([])
const isInitialLoading = ref(true) // 添加初始加载标识

const dialog = ref({
  visible: false,
  loading: false,
  title: '',
  type: 'root' as 'root' | 'child' | 'edit',
  parentName: '',
  parentId: '',
  editingCategoryId: '', // 添加当前编辑的分类ID
  form: {
    name: '',
    parentId: null as string | null,
    icon: '',
    sortOrder: 0,
    status: 'active' as 'active' | 'inactive'
  }
})

const loadCategories = async () => {
  loading.value = true
  isInitialLoading.value = true // 设置初始加载状态
  try {
    const data = await getCategories()
    
    // 处理不同的数据结构
    let categoryList = []
    if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
      // API返回格式: { data: [] } 或 { data: { data: [] } }
      if (Array.isArray(data.data)) {
        categoryList = data.data
      } else if (data.data.data && Array.isArray(data.data.data)) {
        categoryList = data.data.data
      }
    } else if (data && data.list && Array.isArray(data.list)) {
      // 标准分页格式: { list: [] }
      categoryList = data.list
    } else if (Array.isArray(data)) {
      // 直接返回数组
      categoryList = data
    } else {
      ElMessage.error('分类数据格式不正确')
      categoryList = []
    }
    
    categoryTree.value = buildTree(categoryList)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    // Mock数据
    categoryTree.value = [
      {
        id: 'cleaning',
        name: '保洁清洗',
        icon: 'https://example.com/cleaning.png',
        sortOrder: 1,
        status: 'active',
        createTime: '2023-10-01 10:00:00',
        children: [
          {
            id: 'daily_clean',
            name: '日常保洁',
            parentId: 'cleaning',
            sortOrder: 1,
            status: 'active',
            createTime: '2023-10-01 10:00:00'
          },
          {
            id: 'deep_clean',
            name: '深度保洁',
            parentId: 'cleaning',
            sortOrder: 2,
            status: 'active',
            createTime: '2023-10-01 10:00:00'
          }
        ]
      },
      {
        id: 'nanny',
        name: '母婴护理',
        icon: 'https://example.com/nanny.png',
        sortOrder: 2,
        status: 'active',
        createTime: '2023-10-01 10:00:00',
        children: [
          {
            id: 'gold_matron',
            name: '金牌月嫂',
            parentId: 'nanny',
            sortOrder: 1,
            status: 'active',
            createTime: '2023-10-01 10:00:00'
          }
        ]
      }
    ]
  } finally {
    loading.value = false
    isInitialLoading.value = false // 重置初始加载状态
  }
}

const buildTree = (flatList: Category[]): Category[] => {
  if (!Array.isArray(flatList)) {
    return []
  }
  
  if (flatList.length === 0) {
    return []
  }
  
  // 检查是否已经是树形结构（有children字段）
  const hasTreeStructure = flatList.some(item => item.children && item.children.length > 0)
  
  if (hasTreeStructure) {
    // 直接返回所有数据，让表格自己处理树形结构
    // 为每个分类添加默认status字段
    const sortedData = [...flatList].map(item => ({
      ...item,
      status: item.status || 'active' // 如果没有status字段，默认为active
    })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    return sortedData
  }
  
  // 如果是扁平数据，构建树形结构
  const tree: Category[] = []
  const map = new Map<string, Category>()

  // 创建映射
  flatList.forEach(item => {
    map.set(item.id, { 
      ...item, 
      children: [],
      status: item.status || 'active' // 添加默认status
    })
  })

  // 构建树形结构
  flatList.forEach(item => {
    const node = map.get(item.id)!
    if (item.parentId) {
      const parent = map.get(item.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        // 如果找不到父分类，作为根节点处理
        tree.push(node)
      }
    } else {
      tree.push(node)
    }
  })

  // 按sortOrder排序
  const sortByOrder = (items: Category[]) => {
    items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortByOrder(item.children)
      }
    })
  }
  
  sortByOrder(tree)
  return tree
}

const openCreate = (type: 'root' | 'child', parent?: Category) => {
  dialog.value.type = type
  dialog.value.title = type === 'root' ? '新增一级分类' : '新增子分类'
  dialog.value.parentId = parent?.id || ''
  dialog.value.parentName = parent?.name || ''
  dialog.value.form = {
    name: '',
    parentId: parent?.id || null,
    icon: '',
    sortOrder: 0,
    status: 'active'
  }
  dialog.value.visible = true
}

const editCategory = (category: Category) => {
  dialog.value.type = 'edit'
  dialog.value.title = '编辑分类'
  dialog.value.editingCategoryId = category.id // 保存当前编辑的分类ID
  dialog.value.form = {
    name: category.name,
    parentId: category.parentId || null,
    icon: category.icon || '',
    sortOrder: category.sortOrder || 0,
    status: category.status || 'active'
  }
  dialog.value.visible = true
}

const submitCategory = async () => {
  if (!dialog.value.form.name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  dialog.value.loading = true
  try {
    const formData = {
      name: dialog.value.form.name,
      parentId: dialog.value.form.parentId,
      icon: dialog.value.form.icon,
      sortOrder: dialog.value.form.sortOrder,
      status: dialog.value.form.status
    }

    if (dialog.value.type === 'edit') {
      // 编辑模式 - 使用PUT方法
      const categoryId = getCurrentCategoryId()
      if (!categoryId) {
        ElMessage.error('分类ID不能为空')
        return
      }
      await updateCategory(categoryId, formData)
      ElMessage.success('更新成功')
    } else {
      // 新增模式 - 使用POST方法
      await createCategory(formData)
      ElMessage.success('创建成功')
    }
    
    dialog.value.visible = false
    loadCategories()
  } catch (error) {
    console.error('分类操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    dialog.value.loading = false
  }
}

// 获取当前编辑的分类ID
const getCurrentCategoryId = (): string => {
  if (dialog.value.type === 'edit') {
    return dialog.value.editingCategoryId
  }
  return ''
}

const deleteCategory = async (category: Category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteCategoryApi(category.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 防抖排序更新
const sortOrderUpdateTimeouts = new Map<string, NodeJS.Timeout>()

const updateSortOrder = async (category: Category) => {
  if (!category.id) return
  
  // 如果正在初始加载，不触发更新
  if (isInitialLoading.value) return
  
  // 清除之前的定时器
  const existingTimeout = sortOrderUpdateTimeouts.get(category.id)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  
  // 设置新的定时器，延迟800ms执行（排序操作通常需要更长时间思考）
  const timeout = setTimeout(async () => {
    try {
      await updateCategory(category.id, { sortOrder: category.sortOrder })
      ElMessage.success('排序更新成功')
    } catch (error) {
      ElMessage.error('排序更新失败')
    } finally {
      sortOrderUpdateTimeouts.delete(category.id)
    }
  }, 800)
  
  sortOrderUpdateTimeouts.set(category.id, timeout)
}

// 防抖状态更新
const statusUpdateTimeouts = new Map<string, NodeJS.Timeout>()

const handleStatusChange = (category: Category) => {
  // 防止重复调用
  if (!category.id) return false
  
  // 如果正在初始加载，不允许切换
  if (isInitialLoading.value) {
    // 恢复原状态
    category.status = category.status === 'active' ? 'inactive' : 'active'
    return false
  }
  
  // 清除之前的定时器
  const existingTimeout = statusUpdateTimeouts.get(category.id)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  
  // 设置新的定时器，延迟500ms执行
  const timeout = setTimeout(async () => {
    try {
      await updateCategory(category.id, { status: category.status })
      ElMessage.success('状态更新成功')
    } catch (error) {
      // 如果更新失败，恢复原状态
      category.status = category.status === 'active' ? 'inactive' : 'active'
      ElMessage.error('状态更新失败')
    } finally {
      // 清除定时器
      statusUpdateTimeouts.delete(category.id)
    }
  }, 500)
  
  statusUpdateTimeouts.set(category.id, timeout)
  return true // 允许状态切换
}

// 保留原来的updateStatus函数以防其他地方使用
const updateStatus = async (category: Category) => {
  // 防止重复调用
  if (!category.id) return
  
  // 如果正在初始加载，不触发更新
  if (isInitialLoading.value) return
  
  // 清除之前的定时器
  const existingTimeout = statusUpdateTimeouts.get(category.id)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  
  // 设置新的定时器，延迟500ms执行
  const timeout = setTimeout(async () => {
    try {
      await updateCategory(category.id, { status: category.status })
      ElMessage.success('状态更新成功')
    } catch (error) {
      // 如果更新失败，恢复原状态
      category.status = category.status === 'active' ? 'inactive' : 'active'
      ElMessage.error('状态更新失败')
    } finally {
      // 清除定时器
      statusUpdateTimeouts.delete(category.id)
    }
  }, 500)
  
  statusUpdateTimeouts.set(category.id, timeout)
}

const previewIcon = () => {
  if (dialog.value.form.icon) {
    // 可以在这里添加图标预览逻辑
    console.log('预览图标:', dialog.value.form.icon)
  }
}

const expandAll = () => {
  nextTick(() => {
    if (tableRef.value) {
      categoryTree.value.forEach(row => {
        tableRef.value!.toggleRowExpansion(row, true)
      })
    }
  })
}

const collapseAll = () => {
  nextTick(() => {
    if (tableRef.value) {
      categoryTree.value.forEach(row => {
        tableRef.value!.toggleRowExpansion(row, false)
      })
    }
  })
}

// 组件卸载时清理定时器
onUnmounted(() => {
  // 清除所有状态更新定时器
  statusUpdateTimeouts.forEach(timeout => clearTimeout(timeout))
  statusUpdateTimeouts.clear()
  
  // 清除所有排序更新定时器
  sortOrderUpdateTimeouts.forEach(timeout => clearTimeout(timeout))
  sortOrderUpdateTimeouts.clear()
})

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.icon-preview {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.icon-preview img {
  max-width: 60px;
  max-height: 60px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-input-number) {
  width: 80px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
}

:deep(.el-table .el-table__row--level-0 .el-table__cell:first-child) {
  padding-left: 4px !important;
}
:deep(.el-table .el-table__row--level-0 .el-table__cell:first-child .cell) {
    display: flex;
    align-items: center;
}

/* 二级分类缩进 */
:deep(.el-table .el-table__row--level-1 .el-table__cell:first-child) {
  padding-left: 14px !important;
}

/* 展开图标基础样式 */
:deep(.el-table .el-table__expand-icon) {
  position: absolute !important;
  left: 4px !important;
  width: 16px !important;
  height: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  color: #909399 !important;
  font-size: 12px !important;
  transition: transform 0.2s ease !important;
}

/* 一级分类展开图标位置 */
:deep(.el-table .el-table__row--level-0 .el-table__expand-icon) {
  left: 4px !important;
}

/* 二级分类展开图标位置 */
:deep(.el-table .el-table__row--level-1 .el-table__expand-icon) {
  left: 14px !important;
}

/* 分类名称容器 */
:deep(.el-table .el-table__cell:first-child .category-name) {
  display: inline-flex !important;
  align-items: center !important;
  margin-left: 10px !important;
  white-space: nowrap !important;
  vertical-align: middle !important;
}

/* 一级分类名称位置 */
:deep(.el-table .el-table__row--level-0 .el-table__cell:first-child .category-name) {
  margin-left: 6px !important;
  vertical-align: middle !important;
}

/* 二级分类名称位置 */
:deep(.el-table .el-table__row--level-1 .el-table__cell:first-child .category-name) {
  margin-left: 0px !important;
  vertical-align: middle !important;
}
:deep(.el-table__placeholder) {
    display: none;
}
</style>
