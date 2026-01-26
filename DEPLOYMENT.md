# 生产环境部署说明

## 构建命令

```bash
# 安装依赖
npm install

# 生产环境构建
npm run build
```

## 环境变量配置

### 1. 修改 `.env.production` 文件
```
VITE_API_BASE_URL=https://your-production-api.com  # 替换为实际的生产环境 API 地址
VITE_APP_ENV=production
```

### 2. 确认部署路径
- 当前配置的部署路径：`/jiale_admin/`
- 如果需要修改，请编辑 `vite.config.ts` 中的 `base` 配置

## 构建产物

构建完成后，`dist` 目录包含所有静态文件，可直接部署到任何静态文件服务器。

## 部署建议

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /jiale_admin/ {
        alias /path/to/dist/;
        try_files $uri $uri/ /jiale_admin/index.html;
    }
    
    # API 代理（如果需要）
    location /api/ {
        proxy_pass https://your-production-api.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 注意事项

1. **API 地址**：确保 `.env.production` 中的 `VITE_API_BASE_URL` 指向正确的生产环境 API
2. **部署路径**：确认 `vite.config.ts` 中的 `base` 路径与实际部署路径一致
3. **HTTPS**：生产环境建议使用 HTTPS
4. **缓存策略**：建议为静态资源设置适当的缓存策略

## 验证部署

部署完成后，访问 `https://your-domain.com/jiale_admin/` 验证：
- 页面正常加载
- 登录功能正常
- API 请求正常响应
