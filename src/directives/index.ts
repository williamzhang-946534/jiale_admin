import { App } from 'vue'
import { permission } from './permission'

export const setupDirectives = (app: App) => {
  app.directive('permission', permission)
}
