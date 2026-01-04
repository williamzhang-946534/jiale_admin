<template>
  <el-button
    v-if="hasPermission"
    v-bind="$attrs"
    @click="handleClick"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'

interface Props {
  permissions?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  permissions: () => [],
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const authStore = useAuthStore()

const hasPermission = computed(() => {
  if (!props.permissions || (Array.isArray(props.permissions) && props.permissions.length === 0)) {
    return true
  }
  return authStore.hasPermission(props.permissions)
})

const handleClick = (event: Event) => {
  emit('click', event)
}
</script>
