# 📸 图片上传接口文档

## 🔧 当前上传模式

**当前采用：服务端上传模式**
- 文件先上传到NestJS服务器
- 服务器再上传到阿里云OSS
- 优点：安全性高，便于验证和控制
- 缺点：服务器带宽压力较大

## 🔑 阿里云配置需求

是的，你需要提供以下阿里云配置：

### 必需配置
```env
# 阿里云OSS配置
ALIYUN_ACCESS_KEY_ID="your-aliyun-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-aliyun-access-key-secret"
ALIYUN_OSS_BUCKET="zbhsc"
ALIYUN_OSS_REGION="oss-cn-beijing"
ALIYUN_OSS_DOMAIN="zbhsc.oss-cn-beijing.aliyuncs.com"
```

### 可选配置
```env
# STS配置 (用于前端直传)
ALIYUN_STS_ROLE_ARN="acs:ram::your-account-id:role/oss-sts-role"
```

## 🗂️ 文件路径规则

### 新路径格式 (年月)
```
{type}/{year}/{month}/{uuid}.{ext}
```

### 路径示例
- 用户头像: `mobile/avatars/2024/01/abc123-def456.jpg`
- 服务图片: `mobile/services/2024/01/xyz789-uvw012.png`
- 轮播图: `admin/banners/2024/01/def456-ghi789.webp`
- 限时特惠: `admin/banners/2024/01/jkl012-mno345.jpg`
- 反馈文件: `mobile/feedback/2024/01/pqr678-stu901.mp4`
- 认证材料: `temp/vwx234-yza567.pdf`

## 📋 接口列表

### 🔧 通用上传接口

#### 1. 单文件上传
```http
POST /upload/single
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: File (必需)
- type: UploadType (必需)
- originalName?: string (可选)

UploadType 枚举值:
- mobile/avatars (用户头像)
- mobile/services (服务图片)
- mobile/feedback (反馈文件)
- admin/banners (轮播图)
- admin/categories (分类图片)
- admin/configs (配置文件)
- common/icons (图标)
- common/static (静态文件)
- temp (临时文件)
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "key": "mobile/avatars/2024/01/abc123-def456.jpg",
    "url": "https://zbhsc.oss-cn-beijing.aliyuncs.com/mobile/avatars/2024/01/abc123-def456.jpg",
    "size": 102400,
    "contentType": "image/jpeg"
  }
}
```

#### 2. 多文件上传
```http
POST /upload/multiple
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- files: File[] (必需，最多10个)
- type: UploadType (必需)
- originalName?: string (可选)
- maxCount?: string (可选，最大文件数量)
```

#### 3. 获取STS临时凭证
```http
POST /upload/sts-credentials
Authorization: Bearer {token}

Body:
{
  "prefix": "mobile/avatars",
  "expire": "3600"
}
```

#### 4. 删除文件
```http
POST /upload/delete
Authorization: Bearer {token}

Body:
{
  "key": "mobile/avatars/2024/01/abc123-def456.jpg"
}
```

#### 5. 批量删除文件
```http
POST /upload/batch-delete
Authorization: Bearer {token}

Body:
{
  "keys": [
    "mobile/avatars/2024/01/abc123-def456.jpg",
    "mobile/services/2024/01/xyz789-uvw012.png"
  ]
}
```

### 🎠 轮播图管理

#### 上传轮播图
```http
POST /admin/v1/marketing/banners/upload
Content-Type: multipart/form-data
Authorization: Bearer {admin-token}

Body:
- file: File (必需，最大5MB，支持jpg/jpeg/png/gif/webp)
```

**响应示例:**
```json
{
  "code": 200,
  "message": "success", 
  "data": {
    "key": "admin/banners/2024/01/def456-ghi789.webp",
    "url": "https://zbhsc.oss-cn-beijing.aliyuncs.com/admin/banners/2024/01/def456-ghi789.webp",
    "size": 204800,
    "contentType": "image/webp"
  }
}
```

### 🛠️ 服务图片管理

#### 单张服务图片上传
```http
POST /admin/v1/services/upload
Content-Type: multipart/form-data
Authorization: Bearer {admin-token}

Body:
- file: File (必需，最大5MB，支持jpg/jpeg/png/gif/webp)
```

#### 批量服务图片上传
```http
POST /admin/v1/services/upload-multiple
Content-Type: multipart/form-data
Authorization: Bearer {admin-token}

Body:
- files: File[] (必需，最多10个)
```

### ⚡ 限时特惠管理

#### 上传特惠图片
```http
POST /admin/v1/marketing/special-offers/upload
Content-Type: multipart/form-data
Authorization: Bearer {admin-token}

Body:
- file: File (必需，最大5MB，支持jpg/jpeg/png/gif/webp)
```

### 👤 用户管理

#### 上传用户头像
```http
POST /customer/v1/avatar/upload
Content-Type: multipart/form-data
Authorization: Bearer {user-token}

Body:
- file: File (必需，最大2MB，支持jpg/jpeg/png/gif/webp)
```

#### 上传反馈文件
```http
POST /customer/v1/feedback/upload
Content-Type: multipart/form-data
Authorization: Bearer {user-token}

Body:
- file: File (必需，最大10MB，支持图片/视频/音频)
```

### 🧑‍💼 服务者管理

#### 上传服务者头像
```http
POST /v1/provider/avatar/upload
Content-Type: multipart/form-data
Authorization: Bearer {provider-token}

Body:
- file: File (必需，最大2MB，支持jpg/jpeg/png/gif/webp)
```

#### 上传认证材料
```http
POST /v1/provider/certification/upload
Content-Type: multipart/form-data
Authorization: Bearer {provider-token}

Body:
- file: File (必需，最大5MB，支持jpg/jpeg/png/gif/webp/pdf)
- type: "idCard" | "certificate" (必需)
```

## 📊 文件限制

| 类型 | 最大大小 | 支持格式 | 说明 |
|------|---------|---------|------|
| 头像 | 2MB | jpg/jpeg/png/gif/webp | 用户/服务者头像 |
| 服务图片 | 5MB | jpg/jpeg/png/gif/webp | 服务相关图片 |
| 轮播图/特惠图 | 5MB | jpg/jpeg/png/gif/webp | 营销图片 |
| 反馈文件 | 10MB | 图片/视频/音频 | 用户反馈 |
| 认证材料 | 5MB | 图片/PDF | 服务者认证 |

## 🔒 权限说明

- **管理员**: 可访问所有admin/目录下的上传接口
- **用户**: 可访问mobile/avatars和mobile/feedback目录
- **服务者**: 可访问mobile/avatars和temp目录
- **通用接口**: 需要相应角色权限

## 🚀 使用示例

### JavaScript/TypeScript 示例
```javascript
// 上传用户头像
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('type', 'mobile/avatars');

const response = await fetch('/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('上传成功:', result.data.url);
```

### cURL 示例
```bash
# 上传轮播图
curl -X POST \
  http://localhost:3000/admin/v1/marketing/banners/upload \
  -H 'Authorization: Bearer admin-token' \
  -F 'file=@banner.jpg'
```

## 📝 注意事项

1. **文件命名**: 系统自动生成UUID文件名，避免冲突
2. **路径管理**: 按年月归档，便于管理和查找
3. **安全验证**: 所有上传都会进行文件类型和大小验证
4. **权限控制**: 不同角色有不同的上传权限
5. **错误处理**: 统一的错误响应格式

## 🔮 后续扩展

- **STS直传**: 可配置前端直传，减轻服务器压力
- **图片处理**: 可添加压缩、水印等功能
- **CDN加速**: 可配置CDN提升访问速度
- **监控统计**: 可添加上传成功率等监控
