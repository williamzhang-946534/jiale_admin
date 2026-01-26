import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: '/jiale_admin/',
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
    build: {
      // 生产环境构建优化
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 移除 console
          drop_debugger: true, // 移除 debugger
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // 将第三方库分离打包
            vendor: ['vue', 'vue-router', 'pinia'],
            element: ['element-plus', '@element-plus/icons-vue'],
          },
        },
      },
    },
  }
})
