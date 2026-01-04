import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { setupDirectives } from './directives'
import { useAuthStore } from './store/auth'
import '@/styles/index.scss'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)

// 在路由初始化之前恢复认证状态
const authStore = useAuthStore()
authStore.initAuth()

app.use(router)
app.use(ElementPlus)

// 注册自定义指令
setupDirectives(app)

app.mount('#app')
