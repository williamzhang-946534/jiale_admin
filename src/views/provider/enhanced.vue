<template>
  <div class="provider-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleRefresh">
          <RefreshRight />
          刷新
        </el-button>
        <el-button 
          v-if="selectedProviders.length > 0"
          type="success" 
          @click="handleBatchAudit('approve')"
          :disabled="!hasPendingInSelection"
        >
          批量通过 ({{ selectedPendingCount }})
        </el-button>
        <el-button 
          v-if="selectedProviders.length > 0"
          type="danger" 
          @click="handleBatchAudit('reject')"
          :disabled="!hasPendingInSelection"
        >
          批量拒绝 ({{ selectedPendingCount }})
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索姓名/手机号"
          style="width: 200px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <Search />
          </template>
        </el-input>
        <el-select
          v-model="queryParams.status"
          placeholder="选择状态"
          style="width: 120px"
          clearable
          @change="handleSearch"
        >
          <el-option
            v-for="status in statusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总服务者数</div>
        </div>
      </el-card>
      <el-card class="stat-card pending">
        <div class="stat-content">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </el-card>
      <el-card class="stat-card verified">
        <div class="stat-content">
          <div class="stat-number">{{ stats.verified }}</div>
          <div class="stat-label">已认证</div>
        </div>
      </el-card>
      <el-card class="stat-card banned">
        <div class="stat-content">
          <div class="stat-number">{{ stats.banned }}</div>
          <div class="stat-label">已封禁</div>
        </div>
      </el-card>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="providers"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="服务者信息" min-width="200">
          <template #default="{ row }">
            <div class="provider-info">
              <el-avatar :src="row.avatar" :size="50">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <div class="provider-details">
                <div class="provider-name">{{ row.name }}</div>
                <div class="provider-phone">{{ row.phone }}</div>
                <div class="provider-tags">
                  <el-tag v-if="row.isBanned" type="danger" size="small">已封禁</el-tag>
                  <el-tag v-if="row.isVerified" type="success" size="small">已认证</el-tag>
                  <el-tag v-if="row.rating >= 4.5" type="warning" size="small">金牌</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="rating" label="评分" width="120">
          <template #default="{ row }">
            <div class="rating-info">
              <el-rate
                v-model="row.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="serviceCount" label="服务次数" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="viewProviderOrders(row)">
              {{ row.serviceCount }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleAudit(row, 'approve')"
              v-permission="['provider:audit']"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleAudit(row, 'reject')"
              v-permission="['provider:audit']"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status === 'verified' || row.isBanned"
              :type="row.isBanned ? 'success' : 'warning'"
              size="small"
              @click="handleBan(row)"
              v-permission="['provider:ban']"
            >
              {{ row.isBanned ? '解封' : '封禁' }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pagination.pageSizes"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="auditDialog.visible"
      :title="`审核服务者 - ${auditDialog.provider?.name}`"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="audit-content">
        <!-- 服务者基本信息 -->
        <div class="provider-summary">
          <el-avatar :src="auditDialog.provider?.avatar" :size="60">
            {{ auditDialog.provider?.name?.charAt(0) }}
          </el-avatar>
          <div class="summary-info">
            <h3>{{ auditDialog.provider?.name }}</h3>
            <p>{{ auditDialog.provider?.phone }}</p>
            <p>注册时间: {{ formatDate(auditDialog.provider?.createTime) }}</p>
          </div>
        </div>

        <el-form :model="auditDialog.form" label-width="100px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="auditDialog.form.action">
              <el-radio label="approve">通过审核</el-radio>
              <el-radio label="reject">拒绝审核</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item
            v-if="auditDialog.form.action === 'reject'"
            label="拒绝原因"
            required
          >
            <el-select v-model="auditDialog.form.reasonType" placeholder="选择拒绝原因" style="width: 100%">
              <el-option label="身份证照片模糊" value="id_card_blur" />
              <el-option label="证书不真实" value="cert_fake" />
              <el-option label="信息不完整" value="info_incomplete" />
              <el-option label="其他原因" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item
            v-if="auditDialog.form.action === 'reject'"
            label="详细说明"
          >
            <el-input
              v-model="auditDialog.form.reason"
              type="textarea"
              placeholder="请输入详细说明"
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button 
            type="primary" 
            :loading="auditDialog.loading"
            @click="submitAudit"
          >
            确认审核
          </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="`服务者详情 - ${detailDialog.provider?.name}`"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.provider" class="provider-detail">
        <!-- 头部操作区 -->
        <div class="detail-header">
          <div class="provider-info">
            <div class="avatar-section">
              <el-avatar :src="detailDialog.provider.avatar" :size="80">
                {{ detailDialog.provider.name?.charAt(0) }}
              </el-avatar>
              <div class="status-badges">
                <el-tag :type="getStatusTagType(detailDialog.provider.status)" size="large">
                  {{ getStatusLabel(detailDialog.provider.status) }}
                </el-tag>
                <el-tag v-if="detailDialog.provider.isBanned" type="danger" size="large" style="margin-top: 8px">
                  已封禁
                </el-tag>
              </div>
            </div>
            <div class="info-section">
              <h3>{{ detailDialog.provider.name }}</h3>
              <div class="info-row">
                <el-icon><Phone /></el-icon>
                <span>{{ detailDialog.provider.phone }}</span>
              </div>
              <div class="info-row" v-if="detailDialog.provider.rating">
                <el-icon><Star /></el-icon>
                <el-rate
                  v-model="detailDialog.provider.rating"
                  disabled
                  show-score
                  text-color="#ff9900"
                  size="small"
                />
              </div>
              <div class="info-row">
                <el-icon><Calendar /></el-icon>
                <span>注册时间: {{ formatDate(detailDialog.provider.createdAt) }}</span>
              </div>
              <div class="info-row" v-if="detailDialog.provider.providerTypes?.length">
                <el-icon><Collection /></el-icon>
                <div class="tags-container">
                  <el-tag
                    v-for="type in detailDialog.provider.providerTypes.slice(0, 3)"
                    :key="type"
                    size="small"
                    style="margin-right: 4px"
                  >
                    {{ getProviderTypeLabel(type) }}
                  </el-tag>
                  <span v-if="detailDialog.provider.providerTypes.length > 3" class="more-tags">
                    +{{ detailDialog.provider.providerTypes.length - 3 }}
                  </span>
                </div>
              </div>
              <div class="info-row" v-if="detailDialog.provider.serviceArea">
                <el-icon><Location /></el-icon>
                <span>服务区域: {{ detailDialog.provider.serviceArea }}</span>
              </div>
            </div>
          </div>
          <div class="action-section">
            <el-button 
              type="primary" 
              size="large"
              @click="detailDialog.editMode = !detailDialog.editMode"
              :icon="detailDialog.editMode ? 'Close' : 'Edit'"
            >
              {{ detailDialog.editMode ? '取消编辑' : '编辑信息' }}
            </el-button>
          </div>
        </div>

        <!-- 标签页内容 -->
        <el-tabs v-model="detailDialog.activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form 
              :model="detailDialog.editForm" 
              :disabled="!detailDialog.editMode"
              label-width="120px"
              class="detail-form"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="姓名">
                    <el-input v-model="detailDialog.editForm.name" placeholder="请输入姓名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号">
                    <el-input v-model="detailDialog.editForm.phone" placeholder="请输入手机号" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="身份证号">
                    <el-input v-model="detailDialog.editForm.idCardNumber" placeholder="请输入身份证号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="状态">
                    <el-select v-model="detailDialog.editForm.status" placeholder="选择状态">
                      <el-option label="未认证" value="UNVERIFIED" />
                      <el-option label="待审核" value="PENDING" />
                      <el-option label="已认证" value="VERIFIED" />
                      <el-option label="已拒绝" value="REJECTED" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="年龄">
                    <el-input-number 
                      v-model="detailDialog.editForm.age" 
                      :min="16" 
                      :max="70"
                      placeholder="请输入年龄"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="工作经验">
                    <el-input-number 
                      v-model="detailDialog.editForm.experience" 
                      :min="0"
                      placeholder="请输入工作年限"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="星座">
                    <el-select v-model="detailDialog.editForm.zodiac" placeholder="选择星座" clearable>
                      <el-option label="白羊座" value="白羊座" />
                      <el-option label="金牛座" value="金牛座" />
                      <el-option label="双子座" value="双子座" />
                      <el-option label="巨蟹座" value="巨蟹座" />
                      <el-option label="狮子座" value="狮子座" />
                      <el-option label="处女座" value="处女座" />
                      <el-option label="天秤座" value="天秤座" />
                      <el-option label="天蝎座" value="天蝎座" />
                      <el-option label="射手座" value="射手座" />
                      <el-option label="摩羯座" value="摩羯座" />
                      <el-option label="水瓶座" value="水瓶座" />
                      <el-option label="双鱼座" value="双鱼座" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="属相">
                    <el-select v-model="detailDialog.editForm.chineseZodiac" placeholder="选择属相" clearable>
                      <el-option label="鼠" value="鼠" />
                      <el-option label="牛" value="牛" />
                      <el-option label="虎" value="虎" />
                      <el-option label="兔" value="兔" />
                      <el-option label="龙" value="龙" />
                      <el-option label="蛇" value="蛇" />
                      <el-option label="马" value="马" />
                      <el-option label="羊" value="羊" />
                      <el-option label="猴" value="猴" />
                      <el-option label="鸡" value="鸡" />
                      <el-option label="狗" value="狗" />
                      <el-option label="猪" value="猪" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="籍贯">
                <el-input v-model="detailDialog.editForm.hometown" placeholder="请输入籍贯" />
              </el-form-item>

              <el-form-item label="家庭住址">
                <el-input v-model="detailDialog.editForm.homeAddress" placeholder="请输入详细家庭住址" />
              </el-form-item>

              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="期望工资">
                    <el-input-number 
                      v-model="detailDialog.editForm.expectedSalary" 
                      :min="0"
                      :precision="2"
                      placeholder="请输入期望工资"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="实际工资">
                    <el-input-number 
                      v-model="detailDialog.editForm.actualSalary" 
                      :min="0"
                      :precision="2"
                      placeholder="请输入实际工资"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="服务区域">
                <el-input v-model="detailDialog.editForm.serviceArea" placeholder="请输入服务区域" />
              </el-form-item>

              <el-form-item label="个人简介">
                <el-input 
                  v-model="detailDialog.editForm.intro" 
                  type="textarea" 
                  :rows="4"
                  placeholder="请输入个人简介"
                />
              </el-form-item>

              <el-form-item label="服务类型">
                <el-select
                  v-model="detailDialog.editForm.providerTypes"
                  multiple
                  placeholder="选择服务类型"
                  style="width: 100%"
                >
                  <el-option label="月嫂" value="MATERNITY_NURSE" />
                  <el-option label="育儿嫂" value="CHILD_CARE_NURSE" />
                  <el-option label="住家保姆" value="LIVE_IN_NANNY" />
                  <el-option label="保洁" value="CLEANING" />
                  <el-option label="清洁" value="HOUSEKEEPING" />
                  <el-option label="钟点工" value="HOURLY_WORKER" />
                  <el-option label="洗护" value="LAUNDRY_CARE" />
                  <el-option label="医院看护" value="HOSPITAL_CARE" />
                  <el-option label="老人护理" value="ELDERLY_CARE" />
                  <el-option label="烹饪" value="COOKING" />
                  <el-option label="家教" value="TUTORING" />
                </el-select>
              </el-form-item>

              <el-row :gutter="24">
                <el-col :span="8">
                  <el-form-item label="在线状态">
                    <el-switch 
                      v-model="detailDialog.editForm.isOnline"
                      active-text="在线"
                      inactive-text="离线"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="推荐展示">
                    <el-switch 
                      v-model="detailDialog.editForm.isRecommended"
                      active-text="推荐"
                      inactive-text="不推荐"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="封禁状态">
                    <el-switch 
                      v-model="detailDialog.editForm.isBanned"
                      active-text="已封禁"
                      inactive-text="正常"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item v-if="detailDialog.editMode">
                <el-button type="primary" @click="saveProviderDetail" :loading="detailDialog.saveLoading">
                  保存基本信息
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 个人资料 -->
          <el-tab-pane label="个人资料" name="profile">
            <div v-if="detailDialog.provider.profile" class="profile-content">
              <el-form 
                :model="detailDialog.editProfileForm" 
                :disabled="!detailDialog.editMode"
                label-width="120px"
                class="detail-form"
              >
                <el-form-item label="个人介绍">
                  <el-input 
                    v-model="detailDialog.editProfileForm.intro" 
                    type="textarea" 
                    :rows="4"
                    placeholder="请输入个人介绍"
                  />
                </el-form-item>

                <el-form-item label="个人属性">
                  <div class="attributes-grid">
                    <div 
                      v-for="(value, key) in detailDialog.editProfileForm.attributes" 
                      :key="key"
                      class="attribute-item"
                    >
                      <el-input 
                        v-model="detailDialog.editProfileForm.attributes[key]"
                        :placeholder="key"
                        :disabled="!detailDialog.editMode"
                      />
                    </div>
                    <el-button 
                      v-if="detailDialog.editMode"
                      type="primary" 
                      plain 
                      @click="addAttribute"
                      style="margin-top: 8px"
                    >
                      添加属性
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item label="服务统计">
                  <div class="stats-grid">
                    <div 
                      v-for="(value, key) in detailDialog.editProfileForm.stats" 
                      :key="key"
                      class="stat-item"
                    >
                      <span class="stat-label">{{ key }}:</span>
                      <el-input-number 
                        v-model="detailDialog.editProfileForm.stats[key]"
                        :min="0"
                        :disabled="!detailDialog.editMode"
                        size="small"
                      />
                    </div>
                  </div>
                </el-form-item>

                <el-form-item label="资质证书">
                  <div class="certs-list">
                    <el-tag
                      v-for="(cert, index) in detailDialog.editProfileForm.certs"
                      :key="index"
                      closable
                      @close="removeCert(index)"
                      :disable-transitions="false"
                      style="margin: 4px"
                    >
                      {{ cert }}
                    </el-tag>
                    <el-input
                      v-if="detailDialog.certInputVisible"
                      ref="certInputRef"
                      v-model="detailDialog.certInputValue"
                      class="cert-input"
                      size="small"
                      @keyup.enter="handleCertInputConfirm"
                      @blur="handleCertInputConfirm"
                    />
                    <el-button v-else-if="detailDialog.editMode" size="small" @click="showCertInput">
                      + 添加证书
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item label="工作经历">
                  <div class="work-history">
                    <div 
                      v-for="(work, index) in detailDialog.editProfileForm.workHistory" 
                      :key="index"
                      class="work-item"
                    >
                      <el-card>
                        <template #header>
                          <div class="work-header">
                            <span>工作经历 {{ index + 1 }}</span>
                            <el-button 
                              v-if="detailDialog.editMode"
                              type="danger" 
                              size="small" 
                              @click="removeWorkHistory(index)"
                            >
                              删除
                            </el-button>
                          </div>
                        </template>
                        <el-form :model="work" label-width="80px">
                          <el-form-item label="公司">
                            <el-input v-model="work.company" :disabled="!detailDialog.editMode" />
                          </el-form-item>
                          <el-form-item label="职位">
                            <el-input v-model="work.position" :disabled="!detailDialog.editMode" />
                          </el-form-item>
                          <el-form-item label="时间段">
                            <el-date-picker
                              v-model="work.period"
                              type="daterange"
                              range-separator="至"
                              start-placeholder="开始日期"
                              end-placeholder="结束日期"
                              :disabled="!detailDialog.editMode"
                            />
                          </el-form-item>
                          <el-form-item label="描述">
                            <el-input 
                              v-model="work.description" 
                              type="textarea" 
                              :rows="2"
                              :disabled="!detailDialog.editMode"
                            />
                          </el-form-item>
                        </el-form>
                      </el-card>
                    </div>
                    <el-button 
                      v-if="detailDialog.editMode"
                      type="primary" 
                      plain 
                      @click="addWorkHistory"
                      style="margin-top: 16px"
                    >
                      添加工作经历
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item v-if="detailDialog.editMode">
                  <el-button type="primary" @click="saveProfile" :loading="detailDialog.saveLoading">
                    保存个人资料
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 统计信息 -->
          <el-tab-pane label="统计信息" name="stats">
            <div class="stats-content">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-card title="订单统计">
                    <template #header>
                      <div class="card-header">
                        <el-icon><DataAnalysis /></el-icon>
                        <span>订单统计</span>
                      </div>
                    </template>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="总订单数">
                        <span class="stat-number">{{ detailDialog.provider.totalOrders || 0 }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="总收入">
                        <span class="income">¥{{ Number(detailDialog.provider.totalRevenue || 0).toFixed(2) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="今日收入">
                        <span class="income">¥{{ Number(detailDialog.provider.todayEarnings || 0).toFixed(2) }}</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card title="钱包信息">
                    <template #header>
                      <div class="card-header">
                        <el-icon><Wallet /></el-icon>
                        <span>钱包信息</span>
                      </div>
                    </template>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="钱包余额">
                        <span class="balance">¥{{ Number(detailDialog.provider.walletBalance || 0).toFixed(2) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="可提现余额">
                        <span class="withdrawable">¥{{ Number(detailDialog.provider.withdrawableBalance || 0).toFixed(2) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="评分">
                        <el-rate
                          v-model="detailDialog.provider.rating"
                          disabled
                          show-score
                          text-color="#ff9900"
                          score-template="{value} 分"
                        />
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 证件图片 -->
          <el-tab-pane label="证件图片" name="documents">
            <div class="documents-section">
              <div class="document-group">
                <h4>身份证照片</h4>
                <div class="image-grid">
                  <div v-if="detailDialog.provider.idCardImageUrl" class="image-item">
                    <div 
                      class="document-image-wrapper"
                      @click="openImagePreview([detailDialog.provider.idCardImageUrl], 0)"
                    >
                      <el-image
                        :src="detailDialog.provider.idCardImageUrl"
                        fit="cover"
                        class="document-image"
                      />
                    </div>
                  </div>
                  <div v-else class="no-image">
                    <el-icon><Picture /></el-icon>
                    <span>暂无身份证照片</span>
                  </div>
                </div>
              </div>

              <div class="document-group">
                <h4>资质证书</h4>
                <div class="image-grid">
                  <div v-if="detailDialog.provider.certFiles && detailDialog.provider.certFiles.length > 0" class="image-item">
                    <div 
                      v-for="(cert, index) in detailDialog.provider.certFiles"
                      :key="index"
                      class="document-image-wrapper"
                      @click="openImagePreview(detailDialog.provider.certFiles, index)"
                    >
                      <el-image
                        :src="cert"
                        fit="cover"
                        class="document-image"
                      >
                        <template #error>
                          <div class="image-error">
                            <el-icon><Picture /></el-icon>
                            <span>图片加载失败</span>
                          </div>
                        </template>
                      </el-image>
                    </div>
                  </div>
                  <div v-else class="no-image">
                    <el-icon><Picture /></el-icon>
                    <span>暂无资质证书</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 钱包信息 -->
          <el-tab-pane label="钱包信息" name="wallet">
            <div v-if="detailDialog.provider.wallet" class="wallet-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="当前余额">
                  <span class="balance">¥{{ detailDialog.provider.wallet.balance }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="冻结金额">
                  <span class="frozen">¥{{ detailDialog.provider.wallet.frozen || 0 }}</span>
                </el-descriptions-item>
              </el-descriptions>

              <h4 style="margin-top: 24px">交易记录</h4>
              <el-table :data="detailDialog.provider.wallet.history" stripe>
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getTransactionType(row.type)">
                      {{ getTransactionText(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="120">
                  <template #default="{ row }">
                    <span :class="row.amount > 0 ? 'income' : 'expense'">
                      ¥{{ row.amount }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="createTime" label="时间" width="180" />
              </el-table>
            </div>
          </el-tab-pane>

          <!-- 银行信息 -->
          <el-tab-pane label="银行信息" name="bank">
            <div class="bank-content">
              <el-form 
                :model="detailDialog.editBankForm" 
                :disabled="!detailDialog.editMode"
                label-width="120px"
                class="detail-form"
              >
                <el-form-item label="银行名称">
                  <el-input v-model="detailDialog.editBankForm.bankName" placeholder="请输入银行名称" />
                </el-form-item>
                <el-form-item label="银行卡号">
                  <el-input v-model="detailDialog.editBankForm.cardNumber" placeholder="请输入银行卡号" />
                </el-form-item>
                <el-form-item label="开户行">
                  <el-input v-model="detailDialog.editBankForm.branchName" placeholder="请输入开户行" />
                </el-form-item>
                <el-form-item label="持卡人姓名">
                  <el-input v-model="detailDialog.editBankForm.accountName" placeholder="请输入持卡人姓名" />
                </el-form-item>

                <el-form-item v-if="detailDialog.editMode">
                  <el-button type="primary" @click="saveBankInfo" :loading="detailDialog.saveLoading">
                    保存银行信息
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button 
          v-if="detailDialog.provider?.status === 'pending'"
          type="success" 
          @click="handleAudit('approve')"
        >
          通过审核
        </el-button>
        <el-button 
          v-if="detailDialog.provider?.status === 'pending'"
          type="danger" 
          @click="handleAudit('reject')"
        >
          拒绝审核
        </el-button>
        <el-button 
          :type="detailDialog.provider?.isBanned ? 'success' : 'danger'"
          @click="toggleBan"
        >
          {{ detailDialog.provider?.isBanned ? '解封账号' : '封禁账号' }}
        </el-button>
      </template>
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight, Search, Edit, Close, Phone, Star, Calendar, Collection, DataAnalysis, Wallet, Location } from '@element-plus/icons-vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getProviders, auditProvider, banProvider, getProviderDetail, updateProvider } from '@/api/modules/provider'
import type { Provider, ProviderDetail, ProviderAuditParams } from '@/types/api'

// 查询参数
const queryParams = reactive({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 20
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

// 状态选项
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'verified' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已封禁', value: 'banned' },
]

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 响应式数据
const loading = ref(false)
const providers = ref<Provider[]>([])
const selectedProviders = ref<Provider[]>([])

// 统计数据
const stats = computed(() => {
  const total = providers.value.length
  const pending = providers.value.filter(p => p.status === 'pending').length
  const verified = providers.value.filter(p => p.status === 'verified').length
  const banned = providers.value.filter(p => p.isBanned).length
  
  return { total, pending, verified, banned }
})

// 选中项统计
const selectedPendingCount = computed(() => {
  return selectedProviders.value.filter(p => p.status === 'pending').length
})

const hasPendingInSelection = computed(() => {
  return selectedProviders.value.some(p => p.status === 'pending')
})

// 审核弹窗
const auditDialog = reactive({
  visible: false,
  provider: null as Provider | null,
  form: {
    action: 'approve' as 'approve' | 'reject',
    reasonType: '',
    reason: '',
  },
  loading: false,
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  provider: null as ProviderDetail | null,
  editMode: false,
  activeTab: 'basic',
  saveLoading: false,
  form: {
    action: 'approve' as 'approve' | 'reject',
    reasonType: '',
    reason: '',
  },
  loading: false,
  // 编辑表单
  editForm: {
    name: '',
    phone: '',
    idCardNumber: '',
    status: 'UNVERIFIED' as const,
    intro: '',
    age: null as number | null,
    experience: null as number | null,
    zodiac: '',
    chineseZodiac: '',
    hometown: '',
    homeAddress: '',
    expectedSalary: null as number | null,
    actualSalary: null as number | null,
    serviceArea: '',
    providerTypes: [] as string[],
    isOnline: false,
    isRecommended: false,
    isBanned: false
  },
  editProfileForm: {
    intro: '',
    attributes: {} as Record<string, string>,
    stats: {} as Record<string, number>,
    certs: [] as string[],
    workHistory: [] as any[],
    gallery: [] as string[]
  },
  editBankForm: {
    bankName: '',
    cardNumber: '',
    branchName: '',
    accountName: ''
  },
  // 证书输入
  certInputVisible: false,
  certInputValue: '',
  certInputRef: null as any
})

// 常用标签
const commonTags = [
  '金牌月嫂', '育儿嫂', '保姆', '钟点工', '保洁', '护工', '老人护理', '病人护理'
]

// 获取状态标签类型
const getStatusTagType = (status: Provider['status']) => {
  const typeMap = {
    unverified: 'info',
    pending: 'warning',
    verified: 'success',
    rejected: 'danger',
    banned: 'danger',
  }
  return typeMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    'UNVERIFIED': '未认证',
    'PENDING': '待审核',
    'VERIFIED': '已认证',
    'REJECTED': '已拒绝',
    'BANNED': '已封禁'
  }
  return labelMap[status] || status
}

// 获取服务类型标签文本
const getProviderTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    'MATERNITY_NURSE': '月嫂',
    'CHILD_CARE_NURSE': '育儿嫂',
    'LIVE_IN_NANNY': '住家保姆',
    'CLEANING': '保洁',
    'HOUSEKEEPING': '清洁',
    'HOURLY_WORKER': '钟点工',
    'LAUNDRY_CARE': '洗护',
    'HOSPITAL_CARE': '医院看护',
    'ELDERLY_CARE': '老人护理',
    'COOKING': '烹饪',
    'TUTORING': '家教'
  }
  return labelMap[type] || type
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const result = await getProviders(params)
    providers.value = result.list
    pagination.total = result.total
  } catch (error) {
    ElMessage.error('获取服务者列表失败')
    // Mock数据
    providers.value = [
      {
        id: '1',
        name: '张三',
        phone: '13800138001',
        status: 'pending',
        rating: 4.5,
        serviceCount: 25,
        createTime: '2024-01-15 10:30:00',
        isBanned: false,
        isVerified: false,
        avatar: '',
        description: '经验丰富的保洁阿姨'
      },
      {
        id: '2',
        name: '李四',
        phone: '13800138002',
        status: 'verified',
        rating: 4.8,
        serviceCount: 45,
        createTime: '2024-01-10 14:20:00',
        isBanned: false,
        isVerified: true,
        avatar: '',
        description: '金牌月嫂'
      },
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 选择变化
const handleSelectionChange = (selection: Provider[]) => {
  selectedProviders.value = selection
}

// 查看详情
const handleViewDetail = async (provider: Provider) => {
  try {
    const detail = await getProviderDetail(provider.id)
    detailDialog.provider = detail
    
    // 初始化编辑表单
    detailDialog.editForm.name = detail.name
    detailDialog.editForm.phone = detail.phone
    detailDialog.editForm.idCardNumber = detail.idCardNumber || ''
    detailDialog.editForm.status = detail.status
    detailDialog.editForm.intro = detail.intro || ''
    detailDialog.editForm.age = detail.age
    detailDialog.editForm.experience = detail.experience
    detailDialog.editForm.zodiac = detail.zodiac || ''
    detailDialog.editForm.chineseZodiac = detail.chineseZodiac || ''
    detailDialog.editForm.hometown = detail.hometown || ''
    detailDialog.editForm.homeAddress = detail.homeAddress || ''
    detailDialog.editForm.expectedSalary = detail.expectedSalary
    detailDialog.editForm.actualSalary = detail.actualSalary
    detailDialog.editForm.serviceArea = detail.serviceArea || ''
    detailDialog.editForm.providerTypes = detail.providerTypes || []
    detailDialog.editForm.isOnline = detail.isOnline || false
    detailDialog.editForm.isRecommended = detail.isRecommended || false
    detailDialog.editForm.isBanned = detail.isBanned || false

    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取详情失败')
    // Mock数据
    const mockDetail: ProviderDetail = {
      ...provider,
      idCardNumber: '110101199002022345',
      intro: '专业维修师傅，技术过硬，服务态度好',
      avatarUrl: 'https://example.com/avatar2.jpg',
      idCardImageUrl: '',
      certFiles: [
        '身份证.jpg?watermark=1',
        '电工证.jpg?watermark=1'
      ],
      rating: '4.9',
      totalOrders: 0,
      totalRevenue: '0',
      todayEarnings: '200',
      walletBalance: '1800',
      withdrawableBalance: '0',
      age: 35,
      experience: 8,
      zodiac: '天秤座',
      chineseZodiac: '兔',
      hometown: '河南郑州',
      homeAddress: '河南省郑州市金水区...',
      workExperience: null,
      expectedSalary: 8000.00,
      actualSalary: 7500.00,
      providerTypes: ['MATERNITY_NURSE', 'CHILD_CARE_NURSE'],
      serviceArea: '河南漯河',
      isOnline: false,
      isRecommended: false,
      createdAt: '2026-01-04T01:05:23.803Z',
      updatedAt: '2026-01-05T06:49:29.118Z'
    }
    
    detailDialog.provider = mockDetail
    detailDialog.editForm.name = mockDetail.name
    detailDialog.editForm.phone = mockDetail.phone
    detailDialog.editForm.idCardNumber = mockDetail.idCardNumber || ''
    detailDialog.editForm.status = mockDetail.status
    detailDialog.editForm.intro = mockDetail.intro || ''
    detailDialog.editForm.age = mockDetail.age
    detailDialog.editForm.experience = mockDetail.experience
    detailDialog.editForm.zodiac = mockDetail.zodiac || ''
    detailDialog.editForm.chineseZodiac = mockDetail.chineseZodiac || ''
    detailDialog.editForm.hometown = mockDetail.hometown || ''
    detailDialog.editForm.homeAddress = mockDetail.homeAddress || ''
    detailDialog.editForm.expectedSalary = mockDetail.expectedSalary
    detailDialog.editForm.actualSalary = mockDetail.actualSalary
    detailDialog.editForm.serviceArea = mockDetail.serviceArea || ''
    detailDialog.editForm.providerTypes = mockDetail.providerTypes || []
    detailDialog.editForm.isOnline = mockDetail.isOnline || false
    detailDialog.editForm.isRecommended = mockDetail.isRecommended || false
    detailDialog.editForm.isBanned = mockDetail.isBanned || false

    detailDialog.visible = true
  }
}

// 保存基本信息
const saveProviderDetail = async () => {
  if (!detailDialog.provider) return
  
  detailDialog.saveLoading = true
  try {
    await updateProvider(detailDialog.provider.id, {
      name: detailDialog.editForm.name,
      phone: detailDialog.editForm.phone,
      idCardNumber: detailDialog.editForm.idCardNumber,
      status: detailDialog.editForm.status,
      intro: detailDialog.editForm.intro,
      age: detailDialog.editForm.age,
      experience: detailDialog.editForm.experience,
      zodiac: detailDialog.editForm.zodiac,
      chineseZodiac: detailDialog.editForm.chineseZodiac,
      hometown: detailDialog.editForm.hometown,
      homeAddress: detailDialog.editForm.homeAddress,
      expectedSalary: detailDialog.editForm.expectedSalary,
      actualSalary: detailDialog.editForm.actualSalary,
      serviceArea: detailDialog.editForm.serviceArea,
      providerTypes: detailDialog.editForm.providerTypes,
      isOnline: detailDialog.editForm.isOnline,
      isRecommended: detailDialog.editForm.isRecommended,
      isBanned: detailDialog.editForm.isBanned
    })
    ElMessage.success('基本信息保存成功')
    detailDialog.editMode = false
    // 重新加载详情
    handleViewDetail(detailDialog.provider as any)
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    detailDialog.saveLoading = false
  }
}

// 保存个人资料
const saveProfile = async () => {
  if (!detailDialog.provider) return
  
  detailDialog.saveLoading = true
  try {
    await updateProvider(detailDialog.provider.id, {
      profile: detailDialog.editProfileForm
    })
    ElMessage.success('个人资料保存成功')
    detailDialog.editMode = false
    handleViewDetail(detailDialog.provider as any)
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    detailDialog.saveLoading = false
  }
}

// 保存银行信息
const saveBankInfo = async () => {
  if (!detailDialog.provider) return
  
  detailDialog.saveLoading = true
  try {
    const bankInfoStr = `${detailDialog.editBankForm.bankName}|${detailDialog.editBankForm.cardNumber}|${detailDialog.editBankForm.branchName}|${detailDialog.editBankForm.accountName}`
    await updateProvider(detailDialog.provider.id, {
      bankInfo: bankInfoStr
    })
    ElMessage.success('银行信息保存成功')
    detailDialog.editMode = false
    handleViewDetail(detailDialog.provider as any)
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    detailDialog.saveLoading = false
  }
}

// 添加属性
const addAttribute = () => {
  const key = prompt('请输入属性名称')
  if (key) {
    detailDialog.editProfileForm.attributes[key] = ''
  }
}

// 添加工作经历
const addWorkHistory = () => {
  detailDialog.editProfileForm.workHistory.push({
    company: '',
    position: '',
    period: [],
    description: ''
  })
}

// 删除工作经历
const removeWorkHistory = (index: number) => {
  detailDialog.editProfileForm.workHistory.splice(index, 1)
}

// 证书相关方法
const showCertInput = () => {
  detailDialog.certInputVisible = true
  nextTick(() => {
    detailDialog.certInputRef?.focus()
  })
}

const handleCertInputConfirm = () => {
  if (detailDialog.certInputValue) {
    detailDialog.editProfileForm.certs.push(detailDialog.certInputValue)
  }
  detailDialog.certInputVisible = false
  detailDialog.certInputValue = ''
}

const removeCert = (index: number) => {
  detailDialog.editProfileForm.certs.splice(index, 1)
}

// 工具方法
const getTransactionType = (type: string) => {
  const typeMap: Record<string, string> = {
    income: 'success',
    expense: 'danger',
    frozen: 'warning',
    unfrozen: 'info'
  }
  return typeMap[type] || 'info'
}

const getTransactionText = (type: string) => {
  const textMap: Record<string, string> = {
    income: '收入',
    expense: '支出',
    frozen: '冻结',
    unfrozen: '解冻'
  }
  return textMap[type] || type
}

// 单个审核
const handleAudit = (provider?: Provider, action?: 'approve' | 'reject') => {
  // 如果是从详情弹窗调用
  if (detailDialog.provider && action) {
    detailDialog.form.action = action
    detailDialog.form.reason = ''
    submitAuditFromDetail()
    return
  }
  
  // 原有的列表审核逻辑
  if (provider) {
    auditDialog.provider = provider
    auditDialog.form.action = action || 'approve'
    auditDialog.form.reasonType = ''
    auditDialog.form.reason = ''
    auditDialog.visible = true
  }
}

// 从详情弹窗提交审核
const submitAuditFromDetail = async () => {
  if (!detailDialog.provider) return
  
  if (detailDialog.form.action === 'reject' && !detailDialog.form.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  detailDialog.loading = true
  try {
    await auditProvider(detailDialog.provider.id, {
      action: detailDialog.form.action,
      rejectReason: detailDialog.form.reason
    })
    ElMessage.success('审核完成')
    // 更新详情中的状态
    if (detailDialog.provider) {
      detailDialog.provider.status = detailDialog.form.action === 'approve' ? 'verified' : 'rejected'
    }
    loadData() // 刷新列表
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    detailDialog.loading = false
  }
}

// 切换封禁状态
const toggleBan = async () => {
  if (!detailDialog.provider) return
  
  const isBanned = detailDialog.provider.isBanned
  const action = isBanned ? '解封' : '封禁'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}该服务者账号吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await banProvider(detailDialog.provider.id, !isBanned)
    ElMessage.success(`${action}成功`)
    // 更新详情中的状态
    detailDialog.provider.isBanned = !isBanned
    loadData() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 批量审核
const handleBatchAudit = async (action: 'approve' | 'reject') => {
  const pendingProviders = selectedProviders.value.filter(p => p.status === 'pending')
  
  if (pendingProviders.length === 0) {
    ElMessage.warning('请选择待审核的服务者')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要${action === 'approve' ? '通过' : '拒绝'}选中的 ${pendingProviders.length} 个服务者吗？`,
      '批量审核确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 执行批量审核
    const promises = pendingProviders.map(provider => 
      auditProvider(provider.id, { action, rejectReason: action === 'reject' ? '批量拒绝' : undefined })
    )
    
    await Promise.all(promises)
    ElMessage.success(`批量${action === 'approve' ? '通过' : '拒绝'}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量审核失败')
    }
  }
}

// 提交审核
const submitAudit = async () => {
  if (!auditDialog.provider) return

  if (auditDialog.form.action === 'reject' && !auditDialog.form.reasonType) {
    ElMessage.warning('请选择拒绝原因')
    return
  }

  auditDialog.loading = true
  try {
    const params: ProviderAuditParams = {
      action: auditDialog.form.action,
    }
    
    if (auditDialog.form.action === 'reject') {
      params.rejectReason = auditDialog.form.reason || auditDialog.form.reasonType
    }

    await auditProvider(auditDialog.provider.id, params)
    ElMessage.success('审核完成')
    auditDialog.visible = false
    loadData()
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    auditDialog.loading = false
  }
}

// 封禁/解封
const handleBan = async (provider: Provider) => {
  const action = provider.isBanned ? '解封' : '封禁'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}服务者 ${provider.name} 吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await banProvider(provider.id, !provider.isBanned)
    ElMessage.success(`${action}成功`)
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`)
    }
  }
}

// 查看服务者订单
const viewProviderOrders = (provider: Provider) => {
  ElMessage.info(`查看服务者 ${provider.name} 的订单记录`)
  // 这里可以跳转到订单页面并筛选该服务者的订单
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

// 图片预览相关方法
const openImagePreview = (images: string[], index: number = 0) => {
  if (!images || images.length === 0) return
  
  previewImages.value = images
  previewIndex.value = index
  imagePreviewVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.provider-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.pending {
  border-left: 4px solid #e6a23c;
}

.stat-card.verified {
  border-left: 4px solid #67c23a;
}

.stat-card.banned {
  border-left: 4px solid #f56c6c;
}

.stat-content {
  padding: 16px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-container {
  margin-top: 24px;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-details {
  flex: 1;
}

.provider-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.provider-meta {
  font-size: 12px;
  color: #909399;
}

.provider-tags {
  display: flex;
  gap: 4px;
}

.rating-info {
  align-items: center;
  gap: 12px;
  padding-left: 24px;
  border-left: 1px solid #e5e7eb;
}

/* 详情弹窗头部样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 0;
  margin-bottom: 32px;
  border-bottom: 2px solid #f0f2f5;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.provider-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex: 1;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.status-badges {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.info-section {
  flex: 1;
  padding-top: 8px;
}

.info-section h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 15px;
}

.info-row .el-icon {
  font-size: 18px;
  color: #9ca3af;
}

.tags-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.more-tags {
  color: #9ca3af;
  font-size: 12px;
  margin-left: 4px;
}

.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-left: 24px;
  border-left: 1px solid #e5e7eb;
}

/* 统计信息样式 */
.stats-content {
  padding: 20px 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.income {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.balance {
  color: #409eff;
  font-weight: 600;
  font-size: 16px;
}

.withdrawable {
  color: #e6a23c;
  font-weight: 600;
  font-size: 16px;
}

.summary-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.provider-detail {
  padding: 16px 0;
}

.cert-section {
  margin-top: 24px;
}

.cert-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.cert-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  margin-right: 12px;
  margin-bottom: 12px;
}

.document-image-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.document-image-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.document-image {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .detail-header {
    flex-direction: column;
    gap: 24px;
    padding: 20px;
  }

  .provider-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }

  .info-section {
    width: 100%;
  }

  .info-section h3 {
    font-size: 20px;
    text-align: center;
  }

  .info-row {
    justify-content: center;
    font-size: 14px;
  }

  .action-section {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #e5e7eb;
    padding-top: 20px;
    width: 100%;
  }

  .attributes-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
