# 家乐家政后台管理系统

基于 Vue 3 + TypeScript + Element Plus 的现代化后台管理系统。

## 技术栈

- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **开发语言**: TypeScript
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **HTTP客户端**: Axios
- **代码规范**: ESLint + Prettier

## 功能特性

### 核心功能
- ✅ **用户管理**: 用户列表、详情、赠送优惠券
- ✅ **角色与权限**: RBAC 模型，支持多角色权限控制
- ✅ **动态菜单**: 登录后从后端获取菜单，自动生成导航
- ✅ **操作日志审计**: 记录关键操作的时间、操作人、IP
- ✅ **代码生成器**: 前端模拟代码生成引导页

### 业务模块
- **控制台**: 统计数据展示和图表
- **服务与分类管理**: 分类树 CRUD、服务商品上下架
- **服务者管理**: 列表展示、状态筛选、审核操作、封禁处理
- **订单中心**: 订单列表、状态筛选、指派服务者、强制退款
- **财务提现**: 提现申请审核
- **营销配置**: 轮播图管理、优惠券模板

### 权限控制
- **路由级权限**: 未授权路由跳转 403
- **按钮级权限**: 通过 `v-permission` 指令控制
- **菜单权限**: 动态生成用户菜单

## 项目结构

```
src/
├── api/                    # API 接口封装
│   └── modules/           # 按模块组织
├── assets/                # 静态资源
├── components/            # 公共组件
├── composables/           # 可组合函数
├── directives/            # 自定义指令
├── layouts/               # 布局组件
├── router/                # 路由配置
├── store/                 # Pinia 状态管理
├── styles/                # 全局样式
├── utils/                 # 工具函数
├── views/                 # 页面组件
│   ├── dashboard/        # 控制台
│   ├── provider/         # 服务者管理
│   ├── order/            # 订单管理
│   ├── finance/          # 财务管理
│   ├── marketing/        # 营销配置
│   ├── user/             # 用户管理
│   ├── role/             # 角色权限
│   ├── log/              # 操作日志
│   └── error/            # 错误页面
└── App.vue               # 根组件  
```

## 安装运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码格式化
npm run format

# 代码检查
npm run lint
```

## API 接口

项目对接 `/api/admin/v1` 接口，具体接口文档请参考 `jiale-back.md`。

## 开发说明

### 权限指令使用

```vue
<!-- 单个权限 -->
<el-button v-permission="'user:edit'">编辑</el-button>

<!-- 多个权限（满足其中任一） -->
<el-button v-permission="['user:edit', 'user:delete']">操作</el-button>
```

### API 调用示例

```typescript
import { getProviders } from '@/api/modules/provider'

// 获取服务者列表
const providers = await getProviders({
  page: 1,
  pageSize: 20,
  status: 'pending'
})
```

### 状态管理使用

```typescript
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

// 登录
await authStore.login({ username, password })

// 检查权限
const hasPermission = authStore.hasPermission('user:edit')
```

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT License
