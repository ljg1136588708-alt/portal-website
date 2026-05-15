<script setup lang="ts">
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
</script>

<template>
  <div>
    <a-typography-title :level="3">欢迎回来，{{ userStore.userInfo?.username || '用户' }}</a-typography-title>
    <a-row :gutter="16" style="margin-top: 24px">
      <a-col :span="8">
        <a-card title="概览">
          <a-statistic title="今日访问" :value="1024" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="用户">
          <a-statistic title="注册用户" :value="512" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="消息">
          <a-statistic title="未读消息" :value="8" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>
