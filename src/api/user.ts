import { get, post } from './request'
import type { UserInfo } from '@/store/user'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

export const loginApi = (data: LoginParams) => post<LoginResult>('/auth/login', data)

export const getUserInfoApi = () => get<UserInfo>('/auth/userinfo')

export const logoutApi = () => post('/auth/logout')
