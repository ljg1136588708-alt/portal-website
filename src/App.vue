<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { updateDocTitle } from '@/router'

const { locale } = useI18n()
const route = useRoute()

// 切换语言时同步更新浏览器标签标题
watch(locale, () => {
  updateDocTitle(route.meta)
})
</script>

<template>
  <RouterView />
</template>
