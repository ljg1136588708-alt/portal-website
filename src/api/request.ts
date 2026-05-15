import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/store/user'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 10000,
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    if (data.code !== 0 && data.code !== 200) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message))
    }
    return data
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
      message.error('登录已过期，请重新登录')
    } else if (status === 403) {
      message.error('无权限访问')
    } else if (status === 500) {
      message.error('服务器异常，请稍后重试')
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  },
)

export function get<T = unknown>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.get(url, { params, ...config })
}

export function post<T = unknown>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.post(url, data, config)
}

export function put<T = unknown>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return service.put(url, data, config)
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.delete(url, config)
}

export default service
