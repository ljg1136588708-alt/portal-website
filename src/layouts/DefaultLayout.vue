<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { logoutApi } from '@/api/user'
import { message } from 'ant-design-vue'

const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)

async function handleLogout() {
  await logoutApi().catch(() => {})
  userStore.logout()
  message.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">{{ collapsed ? 'P' : 'Portal' }}</div>
      <a-menu theme="dark" mode="inline" :selected-keys="[$route.name as string]">
        <a-menu-item key="Home">
          <template #icon><home-outlined /></template>
          <RouterLink to="/home">首页</RouterLink>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 16px; display: flex; align-items: center; justify-content: flex-end">
        <a-dropdown>
          <a-space style="cursor: pointer">
            <a-avatar>{{ userStore.userInfo?.username?.[0]?.toUpperCase() || 'U' }}</a-avatar>
            <span>{{ userStore.userInfo?.username || '用户' }}</span>
          </a-space>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="handleLogout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-layout-header>

      <a-layout-content style="margin: 16px">
        <div style="padding: 24px; background: #fff; min-height: 360px; border-radius: 8px">
          <RouterView />
        </div>
      </a-layout-content>

      <a-layout-footer style="text-align: center">Portal Website ©{{ new Date().getFullYear() }}</a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
