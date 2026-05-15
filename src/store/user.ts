import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  username: string
  avatar?: string
  roles: string[]
}

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    const isLoggedIn = computed(() => !!token.value)

    function setToken(val: string) {
      token.value = val
    }

    function setUserInfo(info: UserInfo) {
      userInfo.value = info
    }

    function logout() {
      token.value = ''
      userInfo.value = null
    }

    return { token, userInfo, isLoggedIn, setToken, setUserInfo, logout }
  },
  { persist: true },
)
