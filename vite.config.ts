import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // 保留 /api 前缀，直接转发到后端
        // 根据API文档，后端全局前缀是 /api，所以需要保留
        ws: true,
        // 添加错误处理和日志
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 发送到后端:', req.method, proxyReq.path)
            console.log('📤 完整后端URL:', `http://localhost:3000${proxyReq.path}`)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 后端响应:', req.method, req.url, '->', proxyRes.statusCode)
          })
          proxy.on('error', (err, req, _res) => {
            console.error('❌ 代理错误:', err.message)
          })
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 静默 Element Plus 的 Sass 弃用警告
        silenceDeprecations: ['legacy-js-api', 'import', 'if-function'],
        // 忽略 Sass 弃用警告
        quietDeps: true,
        // 使用现代编译器 API
        api: 'modern-compiler',
      },
    },
  },
})
