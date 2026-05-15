<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user'
import { loginApi } from '@/api/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const formState = reactive({ username: '', password: '' })

async function handleLogin() {
  if (!formState.username || !formState.password) {
    message.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await loginApi(formState)
    userStore.setToken(res.token)
    userStore.setUserInfo(res.userInfo)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/home'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <a-card class="login-card" title="门户网站">
      <a-form :model="formState" layout="vertical" @finish="handleLogin">
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formState.username" placeholder="请输入用户名" size="large" />
        </a-form-item>
        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" size="large" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.login-card {
  width: 400px;
}
</style>
