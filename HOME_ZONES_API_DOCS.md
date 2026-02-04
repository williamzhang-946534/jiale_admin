# 首页专区接口文档

## 概述

本文档描述了四个首页专区（新人专区、闪购秒杀、企业定制、高端管家）的完整接口设计，包括移动端接口和后台管理接口。

### 技术规范

- **全局前缀**: `/api`
- **移动端路由**: `/api/v1/...`
- **后台管理路由**: `/api/admin/v1/...`
- **鉴权方式**: JWT Token（Bearer）
- **返回格式**: 统一 `ok(data)` 结构
- **数据库**: PostgreSQL + Prisma ORM

---

## 1. 新人专区

### 1.1 移动端接口

#### 1.1.1 获取新人专区数据
```http
GET /api/v1/newcomer/zone
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "coupons": [
      {
        "id": "coupon_123",
        "amount": 50,
        "minSpend": 200,
        "validityDays": 7,
        "totalLimit": 1000,
        "claimedCount": 256
      }
    ],
    "specialOffers": [
      {
        "id": "offer_456",
        "serviceId": "svc_789",
        "serviceName": "金牌月嫂服务",
        "originalPrice": 299,
        "newcomerPrice": 199,
        "stockLimit": 500,
        "claimedCount": 123,
        "image": "https://example.com/image.jpg"
      }
    ]
  }
}
```

#### 1.1.2 领取新人优惠券
```http
POST /api/v1/newcomer/claim-coupon
Authorization: Bearer {token}
Content-Type: application/json

{
  "couponId": "coupon_123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "领取成功",
    "couponId": "user_coupon_456"
  }
}
```

#### 1.1.3 新人专享服务购买
```http
POST /api/v1/newcomer/purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "offerId": "offer_456",
  "serviceId": "svc_789",
  "addressId": "addr_123",
  "serviceDate": "2024-02-15",
  "serviceTime": "14:00"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "订单创建成功",
    "orderId": "order_789"
  }
}
```

---

### 1.2 后台管理接口

#### 1.2.1 新人优惠券管理
复用现有营销管理接口：
```http
GET /api/admin/v1/marketing/coupons
POST /api/admin/v1/marketing/coupons
PUT /api/admin/v1/marketing/coupons/{id}
DELETE /api/admin/v1/marketing/coupons/{id}
```

**创建新人券示例**:
```json
{
  "name": "新人专享50元券",
  "amount": 50,
  "minSpend": 200,
  "totalQuantity": 1000,
  "validDays": 7,
  "scene": "newcomer",
  "userLimit": 1
}
```

#### 1.2.2 新人专享服务管理
```http
GET /api/admin/v1/newcomer/offers
POST /api/admin/v1/newcomer/offers
PUT /api/admin/v1/newcomer/offers/{id}
DELETE /api/admin/v1/newcomer/offers/{id}
```

**创建专享服务示例**:
```json
{
  "serviceId": "svc_789",
  "originalPrice": 299,
  "newcomerPrice": 199,
  "stockLimit": 500,
  "sortOrder": 1
}
```

---

## 2. 闪购秒杀

### 2.1 移动端接口

#### 2.1.1 获取闪购场次列表
```http
GET /api/v1/flash-sale/sessions
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "sessions": [
      {
        "id": "session_123",
        "startTime": "10:00",
        "endTime": "10:59",
        "status": "active",
        "products": [
          {
            "id": "product_456",
            "serviceId": "svc_789",
            "serviceName": "深度清洁服务",
            "originalPrice": 199,
            "flashPrice": 99,
            "stockTotal": 200,
            "stockSold": 67,
            "image": "https://example.com/image.jpg"
          }
        ]
      }
    ]
  }
}
```

#### 2.1.2 获取当前活跃场次
```http
GET /api/v1/flash-sale/active
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "sessionId": "session_123",
    "endTime": "2024-02-04T10:59:00.000Z",
    "products": [
      {
        "id": "product_456",
        "serviceId": "svc_789",
        "serviceName": "深度清洁服务",
        "originalPrice": 199,
        "flashPrice": 99,
        "stockTotal": 200,
        "stockSold": 67,
        "image": "https://example.com/image.jpg"
      }
    ]
  }
}
```

#### 2.1.3 参与闪购
```http
POST /api/v1/flash-sale/participate
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product_456",
  "addressId": "addr_123",
  "serviceDate": "2024-02-15",
  "serviceTime": "14:00"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "参与成功",
    "orderId": "order_789"
  }
}
```

---

### 2.2 后台管理接口

#### 2.2.1 闪购场次管理
```http
GET /api/admin/v1/flash-sale/sessions
POST /api/admin/v1/flash-sale/sessions
PUT /api/admin/v1/flash-sale/sessions/{id}
DELETE /api/admin/v1/flash-sale/sessions/{id}
```

**创建场次示例**:
```json
{
  "date": "2024-02-04",
  "startTime": "10:00",
  "endTime": "10:59",
  "sortOrder": 1
}
```

#### 2.2.2 闪购商品管理
```http
GET /api/admin/v1/flash-sale/products
POST /api/admin/v1/flash-sale/products
PUT /api/admin/v1/flash-sale/products/{id}
DELETE /api/admin/v1/flash-sale/products/{id}
```

**创建商品示例**:
```json
{
  "sessionId": "session_123",
  "serviceId": "svc_789",
  "flashPrice": 99,
  "stockTotal": 200,
  "sortOrder": 1
}
```

---

## 3. 企业定制

### 3.1 移动端接口

#### 3.1.1 获取企业定制服务列表
```http
GET /api/v1/enterprise/services
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "日常办公保洁",
        "description": "工位/地面/玻璃",
        "icon": "🏢",
        "services": [
          {
            "id": "svc_456",
            "name": "日常保洁套餐",
            "description": "包含工位清洁、地面清洁",
            "basePrice": 299
          }
        ]
      }
    ]
  }
}
```

#### 3.1.2 提交企业定制需求
```http
POST /api/v1/enterprise/inquiry
Authorization: Bearer {token}
Content-Type: application/json

{
  "companyName": "ABC科技有限公司",
  "contactName": "张经理",
  "contactPhone": "13800138000",
  "serviceIds": ["svc_456", "svc_789"],
  "area": 500,
  "address": "北京市朝阳区xxx大厦",
  "requirements": "需要每日清洁服务"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "inquiryId": "inquiry_123"
  }
}
```

---

### 3.2 后台管理接口

#### 3.2.1 企业服务分类管理
```http
GET /api/admin/v1/enterprise/categories
POST /api/admin/v1/enterprise/categories
PUT /api/admin/v1/enterprise/categories/{id}
DELETE /api/admin/v1/enterprise/categories/{id}
```

**创建分类示例**:
```json
{
  "name": "日常办公保洁",
  "description": "工位/地面/玻璃",
  "icon": "🏢",
  "sortOrder": 1
}
```

#### 3.2.2 企业询价管理
```http
GET /api/admin/v1/enterprise/inquiries
PATCH /api/admin/v1/enterprise/inquiries/{id}/status
```

**更新状态示例**:
```json
{
  "status": "assigned",
  "assignedSalesId": "sales_123"
}
```

---

## 4. 高端管家

### 4.1 移动端接口

#### 4.1.1 获取高端管家服务类型
```http
GET /api/v1/premium/services
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "私厨上门",
        "tag": "五星级",
        "description": "专业私厨上门服务",
        "image": "https://example.com/image.jpg",
        "requirements": {
          "minServiceHours": 4,
          "advanceBookingDays": 3,
          "depositAmount": 500
        }
      }
    ]
  }
}
```

#### 4.1.2 申请高端管家服务
```http
POST /api/v1/premium/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceId": "cat_123",
  "contactInfo": {
    "name": "王先生",
    "phone": "13800138000",
    "email": "wang@example.com"
  },
  "requirements": "需要周末服务",
  "budgetRange": "5000-8000"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "applicationId": "app_123"
  }
}
```

---

### 4.2 后台管理接口

#### 4.2.1 高端管家服务分类管理
```http
GET /api/admin/v1/premium/categories
POST /api/admin/v1/premium/categories
PUT /api/admin/v1/premium/categories/{id}
DELETE /api/admin/v1/premium/categories/{id}
```

**创建分类示例**:
```json
{
  "name": "私厨上门",
  "tag": "五星级",
  "description": "专业私厨上门服务",
  "image": "https://example.com/image.jpg",
  "minServiceHours": 4,
  "advanceBookingDays": 3,
  "depositAmount": 500
}
```

#### 4.2.2 管家申请审核
```http
GET /api/admin/v1/premium/applications
POST /api/admin/v1/premium/applications/{id}/approve
POST /api/admin/v1/premium/applications/{id}/reject?reason=不符合要求
```

---

## 5. 错误码说明

| 错误码 | 说明 | 示例 |
|--------|------|------|
| 400 | 请求参数错误 | 缺少必需参数 |
| 401 | 未授权 | Token无效或过期 |
| 403 | 权限不足 | 角色不符 |
| 404 | 资源不存在 | 优惠券不存在 |
| 409 | 资源冲突 | 优惠券已领完 |
| 500 | 服务器内部错误 | 数据库连接失败 |

---

## 6. 鉴权说明

### 6.1 移动端鉴权
- 使用 `JWT Token`，在请求头中携带：`Authorization: Bearer {token}`
- 用户角色：`CUSTOMER`

### 6.2 后台管理鉴权
- 使用 `JWT Token`，在请求头中携带：`Authorization: Bearer {token}`
- 管理员角色：`ADMIN`

---

## 7. 数据库模型说明

### 7.1 新人专区相关表
- `CouponTemplate`: 优惠券模板（scene='newcomer'）
- `UserCoupon`: 用户优惠券
- `NewcomerOffer`: 新人专享服务

### 7.2 闪购秒杀相关表
- `FlashSaleSession`: 闪购场次
- `FlashSaleProduct`: 闪购商品

### 7.3 企业定制相关表
- `EnterpriseServiceCategory`: 企业服务分类
- `EnterpriseInquiry`: 企业询价
- `Service`: 服务（关联企业分类）

### 7.4 高端管家相关表
- `PremiumServiceCategory`: 高端管家服务分类
- `PremiumApplication`: 管家申请

---

## 8. 接口测试示例

### 8.1 新人专区测试
```bash
# 获取新人专区数据
curl -X GET "http://localhost:3000/api/v1/newcomer/zone"

# 领取新人优惠券
curl -X POST "http://localhost:3000/api/v1/newcomer/claim-coupon" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"couponId": "coupon_123"}'
```

### 8.2 闪购秒杀测试
```bash
# 获取闪购场次
curl -X GET "http://localhost:3000/api/v1/flash-sale/sessions"

# 参与闪购
curl -X POST "http://localhost:3000/api/v1/flash-sale/participate" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"productId": "product_456", "addressId": "addr_123", "serviceDate": "2024-02-15", "serviceTime": "14:00"}'
```

---

## 9. 注意事项

1. **时间格式**: 所有时间字段使用 ISO 8601 格式
2. **金额格式**: 所有金额字段使用数字类型，单位为元
3. **分页参数**: `page`（页码，从1开始）、`pageSize`（每页数量）
4. **文件上传**: 图片上传使用统一上传接口，通过 `type` 参数区分
5. **库存管理**: 闪购和新人专享服务都有库存限制，需要实时校验
6. **订单创建**: 所有购买接口都会创建订单，复用现有订单流程

---

## 10. 联系方式

如有接口相关问题，请联系后端开发团队。
