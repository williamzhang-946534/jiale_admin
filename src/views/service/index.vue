<template>
  <div class="service-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="query.keyword"
          placeholder="搜索服务名称"
          clearable
          style="width: 220px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="query.categoryId"
          placeholder="选择分类"
          clearable
          style="width: 200px"
          filterable
          :loading="!categoriesLoaded"
          @change="handleSearch"
        >
          <el-option
            v-for="option in searchCategoryOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
          <template v-if="!categoriesLoaded">
            <el-option disabled value="loading">加载中...</el-option>
          </template>
          <template v-else-if="searchCategoryOptions.length === 0">
            <el-option disabled value="empty">暂无分类数据</el-option>
          </template>
        </el-select>
        <el-select
          v-model="query.status"
          placeholder="状态"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="已上架" value="active" />
          <el-option label="已下架" value="inactive" />
        </el-select>
        
        <!-- 营销设置筛选 -->
        <el-select
          v-model="query.isSpecial"
          placeholder="特价服务"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="特价" :value="true" />
          <el-option label="非特价" :value="false" />
        </el-select>
        
        <el-select
          v-model="query.isFeatured"
          placeholder="精选服务"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="精选" :value="true" />
          <el-option label="非精选" :value="false" />
        </el-select>
        
        <el-select
          v-model="query.isRecommended"
          placeholder="推荐服务"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="推荐" :value="true" />
          <el-option label="非推荐" :value="false" />
        </el-select>
        
        <!-- 套餐服务筛选 -->
        <el-select
          v-model="query.isPackage"
          placeholder="套餐服务"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="套餐" :value="true" />
          <el-option label="普通" :value="false" />
        </el-select>
        
        <el-button @click="resetFilters">重置筛选</el-button>
        <el-button type="primary" @click="openCreate">新增服务</el-button>
      </div>
      <div class="toolbar-right">
        <el-button @click="fetchServices" :loading="loading">刷新</el-button>
      </div>
    </div>

    <!-- 服务列表 -->
    <div class="table-container">
      <el-table :data="services" v-loading="loading" stripe>
        <el-table-column prop="name" label="服务名称" min-width="200">
          <template #default="{ row }">
            <div class="service-name">
              <div 
                v-if="row.images && row.images.length > 0"
                class="service-image-wrapper"
                @click="openImagePreview(row.images, 0)"
              >
                <el-image
                  :src="row.images[0]"
                  fit="cover"
                  class="service-image"
                />
                <div class="image-overlay">
                  <el-icon class="preview-icon"><ZoomIn /></el-icon>
                  <span class="image-count">{{ row.images.length }}张</span>
                </div>
              </div>
              <div v-else class="no-image">
                <el-icon><Picture /></el-icon>
              </div>
              <div class="service-info">
                <div class="name">{{ row.name }}</div>
                <div class="tags">
                  <el-tag
                    v-for="tag in row.tags?.slice(0, 2)"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="价格" width="120" align="center">
          <template #default="{ row }">
            <div class="price">
              <span class="amount">¥{{ row.price }}</span>
              <span class="unit">/{{ row.unit }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="categoryName" label="分类" width="120" align="center" />

        <el-table-column prop="rating" label="评分" width="100" align="center">
          <template #default="{ row }">
            <div class="rating-display">
              <el-rate
                v-model="row.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
                size="small"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sales" label="销量" width="100" align="center">
          <template #default="{ row }">
            <span class="sales-count">{{ row.sales || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="providerCount" label="服务人数" width="100" align="center">
          <template #default="{ row }">
            <span class="provider-count">{{ row.providerCount || 0 }}人</span>
          </template>
        </el-table-column>

        <el-table-column label="营销标识" width="150" align="center">
          <template #default="{ row }">
            <div class="marketing-badges">
              <el-tag v-if="row.isSpecial" type="danger" size="small">特价</el-tag>
              <el-tag v-if="row.isFeatured" type="warning" size="small">特色</el-tag>
              <el-tag v-if="row.isRecommended" type="success" size="small">推荐</el-tag>
              <el-tag v-if="row.badge" type="primary" size="small">{{ row.badge }}</el-tag>
              <span v-if="!row.isSpecial && !row.isFeatured && !row.isRecommended && !row.badge" class="text-muted">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="location" label="服务区域" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.location || '未设置' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="updateServiceStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <div class="description-cell">
              {{ row.description || '暂无描述' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editService(row)">
              编辑
            </el-button>
            <el-button link type="success" size="small" @click="viewService(row)">
              详情
            </el-button>
            <el-button link type="danger" size="small" @click="deleteService(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 服务编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- 🚀 表单仅在 dialog.visible === true 时渲染 -->
      <template v-if="dialog.visible">
        <el-form label-width="100px">
          <!-- 基础信息 -->
          <div class="form-group">
            <div class="group-header">
              <div class="group-title">
                <el-icon class="title-icon"><InfoFilled /></el-icon>
                <span>基础信息</span>
              </div>
              <div class="group-divider"></div>
            </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="服务名称" required>
                <el-input v-model="baseForm.name" placeholder="请输入服务名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属分类" required>
                <el-select 
                  v-model="selectedCategoryId" 
                  placeholder="选择分类" 
                  style="width: 100%"
                  filterable
                  clearable
                  :loading="!categoriesLoaded"
                >
                  <el-option
                    v-for="option in categoryOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                  <template v-if="!categoriesLoaded">
                    <el-option disabled value="loading">加载中...</el-option>
                  </template>
                  <template v-else-if="categoryOptions.length === 0">
                    <el-option disabled value="empty">暂无分类数据</el-option>
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="服务类型">
                <el-select v-model="selectedServiceType" placeholder="选择服务类型" style="width: 100%">
                  <el-option
                    v-for="option in serviceTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计价单位" required>
                <el-input v-model="baseForm.unit" placeholder="如：小时、次" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="价格" required>
                <el-input-number
                  v-model="baseForm.price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="原价">
                <el-input-number
                  v-model="baseForm.originalPrice"
                  :min="0"
                  :precision="2"
                  placeholder="用于折扣显示"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="服务描述">
            <el-input
              v-model="baseForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入服务描述"
            />
          </el-form-item>
        </div>

        <!-- 服务图片 -->
        <div class="form-group">
          <div class="group-header">
            <div class="group-title">
              <el-icon class="title-icon"><Picture /></el-icon>
              <span>服务图片</span>
            </div>
            <div class="group-divider"></div>
          </div>
          <el-form-item label="图片上传">
            <ImageUpload 
              v-model="formImages"
              upload-type="mobile/services"
              :multiple="true"
              :limit="5"
              tip="支持jpg、png、gif、webp格式，文件大小不超过5MB"
              upload-text="上传服务图片"
            />
          </el-form-item>
        </div>

        <!-- 营销设置 -->
        <div class="form-group">
          <div class="group-header">
            <div class="group-title">
              <el-icon class="title-icon"><Promotion /></el-icon>
              <span>营销设置</span>
            </div>
            <div class="group-divider"></div>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="特价服务">
                <el-switch v-model="isSpecial" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="特色服务">
                <el-switch v-model="isFeatured" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="推荐服务">
                <el-switch v-model="isRecommended" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序权重">
                <el-input-number
                  v-model="baseForm.priority"
                  :min="0"
                  placeholder="数字越大排序越靠前"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="服务徽章">
                <el-input v-model="baseForm.badge" placeholder="如：热门、推荐" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="服务标签">
                <el-select
                  v-model="formTags"
                  multiple
                  filterable
                  allow-create
                  placeholder="请输入或选择标签"
                  style="width: 100%"
                >
                  <el-option label="深度清洁" value="深度清洁" />
                  <el-option label="除螨" value="除螨" />
                  <el-option label="专业" value="专业" />
                  <el-option label="上门服务" value="上门服务" />
                  <el-option label="快速响应" value="快速响应" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 服务规则 -->
        <div class="form-group">
          <div class="group-header">
            <div class="group-title">
              <el-icon class="title-icon"><Setting /></el-icon>
              <span>服务规则</span>
            </div>
            <div class="group-divider"></div>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="服务人数" required>
                <el-input-number
                  v-model="baseForm.providerCount"
                  :min="0"
                  placeholder="可提供服务人数"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="服务时长">
                <template #label>
                  <span>服务时长</span>
                  <el-tooltip content="标准服务时长（分钟）" placement="top">
                    <el-icon class="label-tooltip"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input-number
                  v-model="baseForm.serviceDuration"
                  :min="0"
                  placeholder="标准服务时长"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="最少预约">
                <template #label>
                  <span>最少预约</span>
                  <el-tooltip content="最少提前预约时间（小时）" placement="top">
                    <el-icon class="label-tooltip"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input-number
                  v-model="baseForm.minBookingTime"
                  :min="0"
                  placeholder="最少提前预约时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最远预约">
                <template #label>
                  <span>最远预约</span>
                  <el-tooltip content="最远提前预约时间（小时）" placement="top">
                    <el-icon class="label-tooltip"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input-number
                  v-model="baseForm.maxBookingTime"
                  :min="0"
                  placeholder="最远提前预约时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="取消截止">
                <template #label>
                  <span>取消截止</span>
                  <el-tooltip content="免费取消截止时间（小时）" placement="top">
                    <el-icon class="label-tooltip"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input-number
                  v-model="baseForm.cancelDeadline"
                  :min="0"
                  placeholder="免费取消截止时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="服务区域">
                <template #label>
                  <span>服务区域</span>
                  <el-tooltip content="主要服务区域，如：朝阳区、海淀区" placement="top">
                    <el-icon class="label-tooltip"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-input v-model="baseForm.location" placeholder="如：朝阳区、海淀区" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="详细服务区域">
            <template #label>
              <span>详细服务区域</span>
              <el-tooltip content="可选择多个详细服务区域" placement="top">
                <el-icon class="label-tooltip"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <el-select
              v-model="formServiceArea"
              multiple
              filterable
              allow-create
              placeholder="请输入或选择详细服务区域"
              style="width: 100%"
            >
              <el-option label="朝阳区" value="朝阳区" />
              <el-option label="海淀区" value="海淀区" />
              <el-option label="东城区" value="东城区" />
              <el-option label="西城区" value="西城区" />
              <el-option label="丰台区" value="丰台区" />
              <el-option label="石景山区" value="石景山区" />
            </el-select>
          </el-form-item>
        </div>

        <!-- 服务保障 -->
        <div class="form-group">
          <div class="group-header">
            <div class="group-title">
              <el-icon class="title-icon"><Shield /></el-icon>
              <span>服务保障</span>
            </div>
            <div class="group-divider"></div>
          </div>
          <el-form-item label="保险保障">
            <el-input v-model="baseForm.insurance" placeholder="保险保障说明" />
          </el-form-item>
          <el-form-item label="服务保证">
            <el-tag
              v-for="guarantee in formGuarantee"
              :key="guarantee"
              closable
              @close="removeGuarantee(guarantee)"
              style="margin-right: 8px"
            >
              {{ guarantee }}
            </el-tag>
            <el-input
              v-if="guaranteeInputVisible"
              ref="guaranteeInputRef"
              v-model="guaranteeInputValue"
              size="small"
              style="width: 100px"
              @keyup.enter="addGuarantee"
              @blur="addGuarantee"
            />
            <el-button v-else size="small" @click="showGuaranteeInput">+ 添加保证</el-button>
          </el-form-item>
          <el-form-item label="售后服务">
            <el-input v-model="baseForm.afterSales" placeholder="售后服务说明" />
          </el-form-item>
        </div>

        <!-- 套餐设置 -->
        <div class="form-group">
          <div class="group-header">
            <div class="group-title">
              <el-icon class="title-icon"><Box /></el-icon>
              <span>套餐设置</span>
            </div>
            <div class="group-divider"></div>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="套餐服务">
                <el-radio-group v-model="isPackage" @change="handlePackageChange">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-show="showPackageFields">
              <el-form-item label="折扣率">
                <el-input-number
                  v-model="baseForm.discount"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  :precision="2"
                  placeholder="如：0.8表示8折"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item v-show="showPackageFields" label="套餐详情">
            <el-input 
              v-model="baseForm.packageItemsText" 
              type="textarea" 
              :rows="3"
              placeholder="JSON格式的套餐项目详情"
            />
          </el-form-item>
        </div>

        <!-- 服务状态 -->
        <div class="form-group">
          <div class="group-header">
            <div class="group-title">
              <el-icon class="title-icon"><Switch /></el-icon>
              <span>服务状态</span>
            </div>
            <div class="group-divider"></div>
          </div>
          <el-form-item label="服务状态">
            <el-radio-group v-model="selectedStatus">
              <el-radio value="active">上架</el-radio>
              <el-radio value="inactive">下架</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitService">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 服务详情对话框 -->
    <el-dialog v-model="detailVisible" title="服务详情" width="900px">
      <div v-if="currentService" class="service-detail">
        <!-- 基础信息 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <h4>基础信息</h4>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="服务名称">{{ currentService.name }}</el-descriptions-item>
            <el-descriptions-item label="价格">
              <span class="price-info">
                <span class="amount">¥{{ currentService.price }}</span>
                <span class="unit">/{{ currentService.unit }}</span>
                <span v-if="currentService.originalPrice" class="original-price">原价: ¥{{ currentService.originalPrice }}</span>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="分类">{{ getCategoryName(currentService.categoryId) }}</el-descriptions-item>
            <el-descriptions-item label="服务类型">{{ getServiceTypeText(currentService.type) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentService.status === 'active' ? 'success' : 'danger'">
                {{ currentService.status === 'active' ? '已上架' : '已下架' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentService.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="服务描述" span="2">{{ currentService.description || '暂无描述' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 评价统计 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <h4>评价统计</h4>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="评分">
              <el-rate
                v-model="currentService.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </el-descriptions-item>
            <el-descriptions-item label="销量">{{ currentService.sales || 0 }}</el-descriptions-item>
            <el-descriptions-item label="服务人数">{{ currentService.providerCount || 0 }}人</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 营销标识 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <h4>营销标识</h4>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="特价服务">
              <el-tag :type="currentService.isSpecial ? 'danger' : 'info'">
                {{ currentService.isSpecial ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="特色服务">
              <el-tag :type="currentService.isFeatured ? 'warning' : 'info'">
                {{ currentService.isFeatured ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="推荐服务">
              <el-tag :type="currentService.isRecommended ? 'success' : 'info'">
                {{ currentService.isRecommended ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务徽章">
              <el-tag v-if="currentService.badge" type="primary">{{ currentService.badge }}</el-tag>
              <span v-else>无</span>
            </el-descriptions-item>
            <el-descriptions-item label="排序权重">{{ currentService.priority || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="服务标签" span="2">
              <el-tag
                v-for="tag in currentService.tags"
                :key="tag"
                size="small"
                style="margin-right: 8px"
              >
                {{ tag }}
              </el-tag>
              <span v-if="!currentService.tags || currentService.tags.length === 0">未设置</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 服务规则 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <h4>服务规则</h4>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="主要服务区域">{{ currentService.location || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="服务时长">{{ currentService.serviceDuration ? `${currentService.serviceDuration}分钟` : '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="最少预约时间">{{ currentService.minBookingTime ? `${currentService.minBookingTime}小时` : '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="最远预约时间">{{ currentService.maxBookingTime ? `${currentService.maxBookingTime}小时` : '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="取消截止时间">{{ currentService.cancelDeadline ? `${currentService.cancelDeadline}小时` : '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="详细服务区域" span="2">
              <el-tag
                v-for="area in currentService.serviceArea"
                :key="area"
                size="small"
                type="info"
                style="margin-right: 8px"
              >
                {{ area }}
              </el-tag>
              <span v-if="!currentService.serviceArea || currentService.serviceArea.length === 0">未设置</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 服务保障 -->
        <el-card class="detail-section" shadow="never">
          <template #header>
            <h4>服务保障</h4>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="保险保障">{{ currentService.insurance || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="售后服务">{{ currentService.afterSales || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="服务保证">
              <el-tag
                v-for="guarantee in currentService.guarantee"
                :key="guarantee"
                size="small"
                type="success"
                style="margin-right: 8px"
              >
                {{ guarantee }}
              </el-tag>
              <span v-if="!currentService.guarantee || currentService.guarantee.length === 0">未设置</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 套餐信息 -->
        <el-card v-if="currentService.isPackage" class="detail-section" shadow="never">
          <template #header>
            <h4>套餐信息</h4>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="套餐服务">
              <el-tag type="success">是</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="折扣率">{{ currentService.discount ? `${(currentService.discount * 10).toFixed(1)}折` : '未设置' }}</el-descriptions-item>
            <el-descriptions-item v-if="currentService.packageItems" label="套餐详情" span="2">
              <pre class="package-details">{{ JSON.stringify(currentService.packageItems, null, 2) }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 服务详情 -->
        <el-card v-if="hasServiceDetails(currentService)" class="detail-section" shadow="never">
          <template #header>
            <h4>服务详情</h4>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-if="currentService.promises && currentService.promises.length > 0" label="服务承诺" span="2">
              <ul class="detail-list">
                <li v-for="promise in currentService.promises" :key="promise">{{ promise }}</li>
              </ul>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentService.process && currentService.process.length > 0" label="服务流程" span="2">
              <div class="process-steps">
                <div v-for="(step, index) in currentService.process" :key="index" class="process-step">
                  <h5>{{ step.title }}</h5>
                  <p>{{ step.desc }}</p>
                </div>
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentService.details && currentService.details.length > 0" label="详细说明" span="2">
              <ul class="detail-list">
                <li v-for="detail in currentService.details" :key="detail">{{ detail }}</li>
              </ul>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentService.specifications && currentService.specifications.length > 0" label="服务规格" span="2">
              <el-table :data="currentService.specifications" size="small">
                <el-table-column prop="name" label="规格名称" />
                <el-table-column prop="value" label="规格值" />
                <el-table-column prop="unit" label="单位" />
              </el-table>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 服务图片 -->
        <el-card v-if="currentService.images && currentService.images.length > 0" class="detail-section" shadow="never">
          <template #header>
            <h4>服务图片</h4>
          </template>
          <div class="image-grid">
            <div 
              v-for="(image, index) in currentService.images" 
              :key="index"
              class="image-item"
              @click="openImagePreview(currentService.images, index)"
            >
              <el-image
                :src="image"
                fit="cover"
                class="detail-image"
              />
              <div class="image-overlay">
                <el-icon class="preview-icon"><ZoomIn /></el-icon>
                <span class="image-index">{{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- 图片预览组件 -->
    <ImagePreview 
      v-model:visible="imagePreviewVisible"
      :images="previewImages"
      :initial-index="previewIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, shallowRef, InstanceType, watch, computed } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import { ZoomIn, Picture } from '@element-plus/icons-vue'
import ImageUpload from '@/components/ImageUpload.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getServices, createService, updateService, updateServiceStatus, deleteService as deleteServiceApi } from '@/api/modules/service'
import { getCategories, getCategoryTree } from '@/api/modules/category'
import type { Service, Category } from '@/types/api'
import { ServiceType } from '@/types/api'

// 导入适配器
import { adaptCategoryToSelectOptions, adaptCategoryToGroupedSelectOptions, flattenCategoryTree } from '@/adapters/category.adapter'
import { adaptServiceTypeToSelectOptions } from '@/adapters/service.adapter'
import type { SelectOption, GroupedSelectOption } from '@/adapters/index'

const loading = ref(false)
const services = ref<Service[]>([])
const rawCategories = ref<Category[]>([]) // 接口返回的原始数据
const currentService = ref<Service | null>(null)
const detailVisible = ref(false)

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 🚀 使用 shallowRef 避免深度响应式，提升性能
const categoryOptions = shallowRef<SelectOption[]>([])
const serviceTypeOptions = shallowRef<SelectOption[]>([])
const searchCategoryOptions = shallowRef<SelectOption[]>([])

// 分类数据加载状态
const categoriesLoaded = ref(false)

const query = reactive({
  keyword: '',
  categoryId: '',
  status: '',
  // 营销设置筛选
  isSpecial: undefined,
  isFeatured: undefined,
  isRecommended: undefined,
  // 套餐服务筛选
  isPackage: undefined,
  // 其他筛选条件
  type: '',
  minPrice: undefined,
  maxPrice: undefined,
  location: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialog = reactive({
  visible: false,
  loading: false,
  title: '',
  editingServiceId: ''
})

// 🚀 拆分响应式数据：el-select / el-switch 使用独立 ref
const selectedCategoryId = ref('')
const selectedSubCategoryId = ref('')
const selectedServiceType = ref<ServiceType | undefined>(undefined)
const selectedStatus = ref<'active' | 'inactive'>('active')

// 🚀 普通输入字段放入 baseForm (reactive)
const baseForm = reactive({
  name: '',
  price: 0,
  originalPrice: undefined,
  unit: '',
  description: '',
  rating: 0,
  sales: 0,
  providerCount: 0,
  badge: '',
  priority: undefined as number | undefined,
  location: '',
  minBookingTime: undefined as number | undefined,
  maxBookingTime: undefined as number | undefined,
  serviceDuration: undefined as number | undefined,
  cancelDeadline: undefined as number | undefined,
  insurance: '',
  afterSales: '',
  discount: undefined as number | undefined,
  packageItemsText: ''
})

// 🚀 数组 / 图片 / 复杂对象单独 ref
const formImages = ref<string[]>([])
const formTags = ref<string[]>([])
const formPromises = ref<string[]>([])
const formProcess = ref<{ title: string; desc: string }[]>([])
const formDetails = ref<string[]>([])
const formSpecifications = ref<any[]>([])
const formServiceArea = ref<string[]>([])
const formGuarantee = ref<string[]>([])

// 🚀 switch 相关使用独立 ref
const isSpecial = ref(false)
const isFeatured = ref(false)
const isRecommended = ref(false)
const isPackage = ref(false)

const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<InstanceType<typeof ElInput>>()

const guaranteeInputVisible = ref(false)
const guaranteeInputValue = ref('')
const guaranteeInputRef = ref<InstanceType<typeof ElInput>>()

// 🚀 表单重置函数
const resetForm = () => {
  // 重置独立 ref
  selectedCategoryId.value = ''
  selectedSubCategoryId.value = ''
  selectedServiceType.value = undefined
  selectedStatus.value = 'active'
  
  // 重置查询参数
  query.keyword = ''
  query.categoryId = ''
  query.status = ''
  query.isSpecial = undefined
  query.isFeatured = undefined
  query.isRecommended = undefined
  query.isPackage = undefined
  query.type = ''
  query.minPrice = undefined
  query.maxPrice = undefined
  query.location = ''
  
  // 重置 baseForm
  Object.assign(baseForm, {
    name: '',
    price: 0,
    originalPrice: undefined,
    unit: '',
    description: '',
    rating: 0,
    sales: 0,
    providerCount: 0,
    badge: '',
    priority: undefined,
    location: '',
    minBookingTime: undefined,
    maxBookingTime: undefined,
    serviceDuration: undefined,
    cancelDeadline: undefined,
    insurance: '',
    afterSales: '',
    discount: undefined,
    packageItemsText: ''
  })
  
  // 重置数组 ref
  formImages.value = []
  formTags.value = []
  formPromises.value = []
  formProcess.value = []
  formDetails.value = []
  formSpecifications.value = []
  formServiceArea.value = []
  formGuarantee.value = []
  
  // 重置输入状态
  tagInputVisible.value = false
  tagInputValue.value = ''
  guaranteeInputVisible.value = false
  guaranteeInputValue.value = ''
  
  // 重置 switch ref
  isSpecial.value = false
  isFeatured.value = false
  isRecommended.value = false
  isPackage.value = false
}

// 监听 isPackage 变化
watch(isPackage, (newValue, oldValue) => {
  console.log('isPackage 变化:', { oldValue, newValue })
  // 强制更新UI
  nextTick(() => {
    console.log('nextTick 中的 isPackage:', isPackage.value)
  })
})

// 手动触发套餐设置变化的方法
const handlePackageChange = (value: boolean) => {
  console.log('手动设置 isPackage:', value)
  isPackage.value = value
  
  // 强制更新UI
  nextTick(() => {
    // 触发响应式更新
    const forceUpdate = isPackage.value
    console.log('强制更新检查:', forceUpdate)
  })
}

// 计算属性来确保UI响应
const showPackageFields = computed(() => {
  const value = isPackage.value
  console.log('计算属性 showPackageFields:', value)
  return value
})

// 🚀 提交时合并所有字段生成 payload
const buildFormPayload = () => {
  return {
    // 基础信息
    name: baseForm.name,
    categoryId: selectedCategoryId.value,
    subCategoryId: selectedSubCategoryId.value,
    price: baseForm.price,
    originalPrice: baseForm.originalPrice,
    unit: baseForm.unit,
    description: baseForm.description,
    images: formImages.value,
    
    // 评价统计
    rating: baseForm.rating,
    sales: baseForm.sales,
    providerCount: baseForm.providerCount,
    
    // 标签分类
    tags: formTags.value,
    type: selectedServiceType.value,
    
    // 服务详情
    promises: formPromises.value,
    process: formProcess.value,
    details: formDetails.value,
    specifications: formSpecifications.value,
    
    // 营销标识
    isSpecial: isSpecial.value,
    isFeatured: isFeatured.value,
    isRecommended: isRecommended.value,
    badge: baseForm.badge,
    priority: baseForm.priority,
    
    // 服务规则
    location: baseForm.location,
    serviceArea: formServiceArea.value,
    minBookingTime: baseForm.minBookingTime,
    maxBookingTime: baseForm.maxBookingTime,
    serviceDuration: baseForm.serviceDuration,
    cancelDeadline: baseForm.cancelDeadline,
    
    // 服务保障
    insurance: baseForm.insurance,
    guarantee: formGuarantee.value,
    afterSales: baseForm.afterSales,
    
    // 套餐相关
    isPackage: isPackage.value,
    discount: baseForm.discount,
    packageItems: undefined,
    packageItemsText: baseForm.packageItemsText,
    
    // 状态管理
    status: selectedStatus.value
  }
}

const fetchServices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: query.keyword || undefined,
      categoryId: query.categoryId || undefined,
      status: query.status || undefined,
      // 营销设置筛选
      isSpecial: query.isSpecial,
      isFeatured: query.isFeatured,
      isRecommended: query.isRecommended,
      // 套餐服务筛选
      isPackage: query.isPackage,
      // 其他筛选条件
      type: query.type || undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      location: query.location || undefined
    }
    
    const data = await getServices(params)
    console.log('服务API返回原始数据:', JSON.stringify(data, null, 2))
    
    // 处理不同的数据结构
    let serviceList = []
    if (data && data.data && Array.isArray(data.data)) {
      // API返回格式: { data: [] }
      serviceList = data.data
    } else if (data && data.list && Array.isArray(data.list)) {
      // 标准分页格式: { list: [] }
      serviceList = data.list
    } else if (Array.isArray(data)) {
      // 直接返回数组
      serviceList = data
    } else {
      console.error('服务数据结构异常:', data)
      ElMessage.error('服务数据格式不正确')
      serviceList = []
    }
    
    services.value = serviceList.map((service, index) => {
      // 详细记录每个服务的数据，特别是关键字段
      console.log(`服务 ${index + 1} 原始数据:`, {
        id: service.id,
        name: service.name,
        type: service.type,
        isSpecial: service.isSpecial,
        isFeatured: service.isFeatured,
        isRecommended: service.isRecommended,
        isPackage: service.isPackage,
        discount: service.discount,
        packageItems: service.packageItems,
        priority: service.priority
      })
      
      return {
        ...service,
        categoryName: getCategoryName(service.categoryId),
        createTime: service.createdAt || new Date().toLocaleString()
      }
    })
    
    console.log('处理后的服务数据:', services.value)
    
    // 设置分页总数
    pagination.total = data.total || serviceList.length
    
  } catch (error) {
    console.error('获取服务列表失败:', error)
    ElMessage.error('获取服务列表失败')
    services.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    // 获取分类树数据
    const data = await getCategoryTree()
    
    // 处理数据结构
    let categoryList = []
    if (Array.isArray(data)) {
      categoryList = data
    } else if (data && data.data && Array.isArray(data.data)) {
      categoryList = data.data
    } else if (data && data.list && Array.isArray(data.list)) {
      categoryList = data.list
    }
    
    // 扁平化树形数据
    if (categoryList.length > 0 && (categoryList[0].children || categoryList[0].parentId === undefined)) {
      rawCategories.value = flattenCategoryTree(categoryList)
    } else {
      rawCategories.value = categoryList
    }
    
    // 🚀 关键：只在接口返回后执行一次适配器
    categoryOptions.value = adaptCategoryToSelectOptions(rawCategories.value)
    searchCategoryOptions.value = categoryOptions.value
    
    // 初始化服务类型选项
    serviceTypeOptions.value = adaptServiceTypeToSelectOptions()
    
    // 标记加载完成
    categoriesLoaded.value = true
    
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    
    // Mock 数据
    const mockCategories = [
      { id: 'cleaning', name: '保洁清洗', parentId: null },
      { id: 'daily_clean', name: '日常保洁', parentId: 'cleaning' },
      { id: 'deep_clean', name: '深度保洁', parentId: 'cleaning' },
      { id: 'nanny', name: '母婴护理', parentId: null },
      { id: 'gold_matron', name: '金牌月嫂', parentId: 'nanny' }
    ]
    
    rawCategories.value = mockCategories
    categoryOptions.value = adaptCategoryToSelectOptions(mockCategories)
    searchCategoryOptions.value = categoryOptions.value
    serviceTypeOptions.value = adaptServiceTypeToSelectOptions()
    categoriesLoaded.value = true
  }
}

const getCategoryName = (categoryId: string): string => {
  if (!categoryId) return '未分类'
  
  // 使用适配器后的轻量数据查找分类名称
  const option = categoryOptions.value.find(opt => opt.value === categoryId)
  return option?.label || '未知分类'
}

// 重置筛选条件
const resetFilters = () => {
  query.keyword = ''
  query.categoryId = ''
  query.status = ''
  query.isSpecial = undefined
  query.isFeatured = undefined
  query.isRecommended = undefined
  query.isPackage = undefined
  query.type = ''
  query.minPrice = undefined
  query.maxPrice = undefined
  query.location = ''
  
  // 重置分页并刷新
  pagination.page = 1
  fetchServices()
}

const handleSearch = () => {
  pagination.page = 1
  fetchServices()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchServices()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchServices()
}

const openCreate = () => {
  dialog.title = '新增服务'
  // 🚀 使用新的重置函数
  resetForm()
  dialog.editingServiceId = ''
  dialog.visible = true
}

const editService = (service: Service) => {
  console.log('编辑服务 - 原始数据:', service)
  console.log('服务类型:', service.type)
  console.log('套餐设置 - 原始值:', service.isPackage)
  
  dialog.title = '编辑服务'
  dialog.editingServiceId = service.id
  
  // 设置拆分的响应式数据
  selectedCategoryId.value = service.categoryId || ''
  selectedSubCategoryId.value = service.subCategoryId || ''
  
  // 确保服务类型有效值，如果无效则设为 undefined
  if (service.type && Object.values(ServiceType).includes(service.type)) {
    selectedServiceType.value = service.type
  } else {
    selectedServiceType.value = undefined
    console.warn('无效的服务类型值:', service.type)
  }
  
  selectedStatus.value = service.status || 'active'
  
  // 设置 baseForm
  Object.assign(baseForm, {
    name: service.name,
    price: service.price,
    originalPrice: service.originalPrice,
    unit: service.unit,
    description: service.description || '',
    rating: service.rating || 0,
    sales: service.sales || 0,
    providerCount: service.providerCount || 0,
    badge: service.badge || '',
    priority: typeof service.priority === 'number' ? service.priority : undefined,
    location: service.location || '',
    minBookingTime: service.minBookingTime,
    maxBookingTime: service.maxBookingTime,
    serviceDuration: service.serviceDuration,
    cancelDeadline: service.cancelDeadline,
    insurance: service.insurance || '',
    afterSales: service.afterSales || '',
    discount: service.discount,
    packageItemsText: service.packageItems ? JSON.stringify(service.packageItems) : ''
  })
  
  console.log('权重设置完成 - 原始值:', service.priority, '设置后:', baseForm.priority)
  
  // 设置数组 ref
  formImages.value = service.images || []
  formTags.value = service.tags || []
  formPromises.value = service.promises || []
  formProcess.value = service.process || []
  formDetails.value = service.details || []
  formSpecifications.value = service.specifications || []
  formServiceArea.value = service.serviceArea || []
  formGuarantee.value = service.guarantee || []
  
  // 设置 switch ref - 确保布尔值正确转换
  console.log('设置营销开关前的原始值:', {
    isSpecial: service.isSpecial,
    isFeatured: service.isFeatured,
    isRecommended: service.isRecommended,
    isPackage: service.isPackage
  })
  
  isSpecial.value = Boolean(service.isSpecial)
  isFeatured.value = Boolean(service.isFeatured)
  isRecommended.value = Boolean(service.isRecommended)
  
  // 延迟设置 isPackage 确保正确性
  nextTick(() => {
    isPackage.value = Boolean(service.isPackage)
    console.log('延迟设置 isPackage:', isPackage.value)
  })
  
  console.log('设置营销开关后的值:', {
    isSpecial: isSpecial.value,
    isFeatured: isFeatured.value,
    isRecommended: isRecommended.value,
    isPackage: isPackage.value
  })
  
  dialog.visible = true
}

const viewService = (service: Service) => {
  currentService.value = service
  detailVisible.value = true
}

const submitService = async () => {
  // 🚀 表单验证 - 使用拆分的响应式数据
  if (!baseForm.name || !selectedCategoryId.value || !baseForm.unit || !baseForm.providerCount) {
    ElMessage.warning('请填写完整的基础信息（服务名称、分类、计价单位、服务人数）')
    return
  }

  // 套餐字段验证
  if (isPackage.value && !baseForm.discount) {
    ElMessage.warning('套餐服务必须设置折扣率')
    return
  }

  // JSON格式验证
  if (baseForm.packageItemsText) {
    try {
      // 这里可以添加 JSON 验证逻辑
    } catch (error) {
      ElMessage.warning('套餐项目详情格式不正确，请输入有效的JSON格式')
      return
    }
  }

  dialog.loading = true
  try {
    // 🚀 使用新的 payload 构建函数
    const formData = buildFormPayload()
    
    // 添加提交前的数据验证和日志
    console.log('提交表单数据:', {
      serviceType: formData.type,
      marketingFlags: {
        isSpecial: formData.isSpecial,
        isFeatured: formData.isFeatured,
        isRecommended: formData.isRecommended,
        isPackage: formData.isPackage
      },
      packageSettings: {
        isPackage: formData.isPackage,
        discount: formData.discount,
        packageItems: formData.packageItems,
        packageItemsText: formData.packageItemsText
      },
      priority: formData.priority
    })
    
    // 验证服务类型
    if (formData.type && !Object.values(ServiceType).includes(formData.type)) {
      console.warn('提交时发现无效的服务类型:', formData.type)
      delete formData.type
    }
    
    // 处理套餐项目
    if (formData.packageItemsText) {
      try {
        formData.packageItems = JSON.parse(formData.packageItemsText)
      } catch (error) {
        ElMessage.warning('套餐项目详情格式不正确，请输入有效的JSON格式')
        return
      }
    }
    delete formData.packageItemsText
    
    if (dialog.title === '新增服务') {
      await createService(formData)
      ElMessage.success('创建成功')
    } else {
      const serviceId = dialog.editingServiceId
      if (!serviceId) {
        ElMessage.error('服务ID不能为空')
        return
      }
      await updateService(serviceId, formData)
      ElMessage.success('更新成功')
      console.log('更新服务完成，提交的数据:', formData)
    }
    
    dialog.visible = false
    console.log('开始刷新服务列表...')
    await fetchServices()
    console.log('服务列表刷新完成')
  } catch (error) {
    console.error('服务操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const updateServiceStatus = async (service: Service) => {
  try {
    await updateServiceStatus(service.id, service.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const deleteService = async (service: Service) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务 "${service.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await deleteServiceApi(service.id)
    ElMessage.success('删除成功')
    fetchServices()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !formTags.value.includes(tag)) {
    formTags.value.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = formTags.value.indexOf(tag)
  if (index > -1) {
    formTags.value.splice(index, 1)
  }
}

const showGuaranteeInput = () => {
  guaranteeInputVisible.value = true
  nextTick(() => {
    guaranteeInputRef.value?.focus()
  })
}

const addGuarantee = () => {
  const guarantee = guaranteeInputValue.value.trim()
  if (guarantee && !formGuarantee.value.includes(guarantee)) {
    formGuarantee.value.push(guarantee)
  }
  guaranteeInputVisible.value = false
  guaranteeInputValue.value = ''
}

const removeGuarantee = (guarantee: string) => {
  const index = formGuarantee.value.indexOf(guarantee)
  if (index > -1) {
    formGuarantee.value.splice(index, 1)
  }
}

// 日期格式化函数
const formatDateTime = (dateTime: string | number | undefined) => {
  if (!dateTime) return '-'
  
  try {
    // 如果是数字（时间戳），需要转换为毫秒
    const timestamp = typeof dateTime === 'number' ? dateTime * 1000 : dateTime
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return dateTime
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateTime
  }
}

// 检查是否有服务详情（避免使用 computed）
const hasServiceDetails = (service?: Service | null): boolean => {
  if (!service) return false
  return (
    (service.promises && service.promises.length > 0) ||
    (service.process && service.process.length > 0) ||
    (service.details && service.details.length > 0) ||
    (service.specifications && service.specifications.length > 0)
  )
}

// 获取服务类型文本
const getServiceTypeText = (type?: ServiceType): string => {
  const typeMap: Record<ServiceType, string> = {
    [ServiceType.CLEANING]: '保洁清洗',
    [ServiceType.NANNY]: '母婴护理',
    [ServiceType.REPAIR]: '维修安装',
    [ServiceType.MOVING]: '搬家运输',
    [ServiceType.OTHER]: '其他服务'
  }
  return typeMap[type || ServiceType.OTHER] || '未设置'
}

// 图片预览相关方法
const openImagePreview = (images: string[], index: number = 0) => {
  if (!images || images.length === 0) return
  
  previewImages.value = images
  previewIndex.value = index
  imagePreviewVisible.value = true
}

onMounted(async () => {
  // 先获取分类数据，再获取服务数据
  await fetchCategories()
  await fetchServices()
})
</script>

<style scoped>
.service-page {
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: #fff;
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

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.service-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.service-info {
  flex: 1;
}

.service-info .name {
  font-weight: 500;
  margin-bottom: 4px;
}

.service-info .tags {
  display: flex;
  gap: 4px;
}

.description-cell {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price {
  text-align: center;
}

.price .amount {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.price .unit {
  font-size: 12px;
  color: #909399;
}

.provider-count {
  font-weight: 500;
  color: #409eff;
}

.text-muted {
  color: #909399;
}

/* 标签提示图标样式 */
.label-tooltip {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
  cursor: help;
  vertical-align: middle;
}

.label-tooltip:hover {
  color: #409eff;
}

/* 表单分组样式 */
.form-group {
  margin-bottom: 32px;
}

.group-header {
  margin-bottom: 20px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 18px;
  color: #409eff;
}

.group-title span {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.group-divider {
  height: 1px;
  background: linear-gradient(to right, #e4e7ed 0%, #e4e7ed 50%, transparent 50%);
  background-size: 8px 1px;
  background-repeat: repeat-x;
}

/* 详情页面样式 */
.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-info .amount {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.price-info .unit {
  font-size: 12px;
  color: #909399;
}

.price-info .original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

/* 营销标识样式 */
.marketing-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sales-count {
  font-weight: 500;
  color: #67c23a;
}

/* 详情列表样式 */
.detail-list {
  margin: 0;
  padding-left: 20px;
}

.detail-list li {
  margin-bottom: 4px;
  line-height: 1.5;
}

/* 流程步骤样式 */
.process-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.process-step {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.process-step h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.process-step p {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

/* 套餐详情样式 */
.package-details {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
  max-height: 200px;
  overflow-y: auto;
}

/* 评分显示样式 */
.rating-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表单对话框滚动 - 隐藏滚动栏 */
:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

:deep(.el-dialog__body)::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 详情对话框滚动 - 隐藏滚动栏 */
:deep(.service-detail) {
  max-height: 70vh;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

:deep(.service-detail)::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 响应式优化 */
@media (max-width: 768px) {
  .form-group {
    margin-bottom: 24px;
  }
  
  .detail-section {
    margin-bottom: 12px;
  }
  
  .marketing-badges {
    justify-content: center;
  }
  
  .price-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  /* 移动端表单字段调整为单列 */
  .el-col {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
  
  .group-title {
    font-size: 15px;
  }
  
  .title-icon {
    font-size: 16px;
  }
}

@media (max-width: 1200px) and (min-width: 769px) {
  /* 平板端保持两列布局 */
  .el-col[span="12"] {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.service-detail {
  padding: 16px 0;
}

/* 图片预览样式 */
.service-image-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.service-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.preview-icon {
  font-size: 24px;
  color: #fff;
  margin-bottom: 8px;
}

.image-count {
  font-size: 12px;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
}

.no-image {
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-item:hover {
  transform: scale(1.05);
}

.detail-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.image-index {
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table__row) {
  position: relative;
  z-index: 1;
}

:deep(.el-table__row.striped) {
  z-index: 1;
}

:deep(.el-image) {
  position: relative;
  z-index: 1000 !important;
}

:deep(.el-image__inner) {
  position: relative;
  z-index: 1001 !important;
}

:deep(.el-image-viewer__wrapper) {
  z-index: 2000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

:deep(.el-image-viewer__canvas) {
  z-index: 2001 !important;
}

:deep(.el-image-viewer__mask) {
  z-index: 1999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
</style>

<style>
/* 全局样式，确保图片预览在最上层 */
.el-table__row {
  position: relative !important;
  z-index: 1 !important;
}

.el-table__row.striped {
  z-index: 1 !important;
}

.el-image {
  position: relative !important;
  z-index: 1000 !important;
}

.el-image__inner {
  position: relative !important;
  z-index: 1001 !important;
}

.el-image-viewer__wrapper {
  z-index: 2000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.el-image-viewer__canvas {
  z-index: 2001 !important;
}

.el-image-viewer__mask {
  z-index: 1999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.el-table {
  font-size: 13px;
}
</style>
