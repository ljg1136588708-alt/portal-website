<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const { locale } = useI18n()

const mode = ref<'login' | 'register' | 'forgot' | 'reset'>('login')
const loading = ref(false)
const googleLoading = ref(false)
const showPassword = ref(false)
const showNewPassword = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | string>('')

const form = reactive({
  email: '',
  password: '',
  newPassword: '',
  username: '',
})

let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

onMounted(() => {
  const hash = window.location.hash
  if (hash.includes('type=recovery')) {
    mode.value = 'reset'
  }
  authListener = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      mode.value = 'reset'
      message.value = ''
    }
  })
})

onUnmounted(() => {
  authListener?.data.subscription.unsubscribe()
})

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}

function validatePassword(pwd: string) {
  if (pwd.length < 8 || pwd.length > 20) {
    return locale.value === 'zh' ? '密码需要8-20位字符。' : 'Password must be 8-20 characters.'
  }
  if (!/[a-zA-Z]/.test(pwd)) {
    return locale.value === 'zh' ? '密码必须包含至少一个字母。' : 'Password must contain at least one letter.'
  }
  if (!/[0-9]/.test(pwd)) {
    return locale.value === 'zh' ? '密码必须包含至少一个数字。' : 'Password must contain at least one number.'
  }
  return ''
}

async function handleSubmit() {
  if (!form.email || !form.password) return
  if (mode.value === 'register' && !form.username.trim()) {
    message.value = locale.value === 'zh' ? '请输入用户名。' : 'Please enter a username.'
    messageType.value = 'error'
    return
  }

  const pwdError = validatePassword(form.password)
  if (pwdError) {
    message.value = pwdError
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''

  const errorMap: Record<string, { en: string; zh: string }> = {
    'Invalid login credentials': {
      en: 'Incorrect email or password.',
      zh: '邮箱或密码错误，请重试。',
    },
    'Email not confirmed': {
      en: 'Please verify your email before signing in.',
      zh: '请先验证邮箱后再登录。',
    },
    'User already registered': {
      en: 'This email is already registered.',
      zh: '该邮箱已注册，请直接登录。',
    },
    'Password should be at least 6 characters': {
      en: 'Password must be 8-20 characters.',
      zh: '密码需要8-20位字符。',
    },
    'Unable to validate email address: invalid format': {
      en: 'Please enter a valid email address.',
      zh: '请输入有效的邮箱地址。',
    },
  }

  function getErrorMsg(msg: string) {
    for (const key in errorMap) {
      if (msg.includes(key)) {
        return locale.value === 'zh' ? errorMap[key].zh : errorMap[key].en
      }
    }
    return locale.value === 'zh' ? '发生错误，请稍后再试。' : 'Something went wrong, please try again.'
  }

  try {
    if (mode.value === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error
      router.push('/')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { username: form.username.trim() }
        }
      })
      if (error) throw error
      // 已注册邮箱 Supabase 会返回 identities 为空数组
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        message.value = locale.value === 'zh'
          ? '该邮箱已注册，请直接登录。'
          : 'This email is already registered. Please sign in.'
        messageType.value = 'error'
        return
      }
      message.value = locale.value === 'zh'
        ? '注册成功！请查收邮件并点击验证链接。'
        : 'Registered! Please check your email to verify your account.'
      messageType.value = 'success'
    }
  } catch (err: any) {
    message.value = getErrorMsg(err.message || '')
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

async function handleForgot() {
  if (!form.email) {
    message.value = locale.value === 'zh' ? '请输入邮箱地址。' : 'Please enter your email address.'
    messageType.value = 'error'
    return
  }
  loading.value = true
  message.value = ''
  const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
    redirectTo: `${window.location.origin}/login`,
  })
  loading.value = false
  if (error) {
    const msg = error.message || ''
    if (msg.includes('rate limit')) {
      message.value = locale.value === 'zh' ? '发送过于频繁，请稍后再试。' : 'Too many requests, please try again later.'
    } else if (msg.includes('invalid') || msg.includes('format')) {
      message.value = locale.value === 'zh' ? '邮箱格式不正确。' : 'Invalid email address.'
    } else {
      message.value = locale.value === 'zh' ? '发送失败，请稍后再试。' : 'Failed to send, please try again.'
    }
    messageType.value = 'error'
  } else {
    message.value = locale.value === 'zh' ? '重置邮件已发送，请查收邮箱。' : 'Reset email sent, please check your inbox.'
    messageType.value = 'success'
  }
}

async function handleReset() {
  const pwdError = validatePassword(form.newPassword)
  if (pwdError) {
    message.value = pwdError
    messageType.value = 'error'
    return
  }
  loading.value = true
  message.value = ''
  const { error } = await supabase.auth.updateUser({ password: form.newPassword })
  loading.value = false
  if (error) {
    console.error('updateUser error:', error)
    const msg = error.message || ''
    if (msg.includes('expired') || msg.includes('invalid')) {
      message.value = locale.value === 'zh' ? '链接已过期，请重新发送重置邮件。' : 'Link expired, please request a new reset email.'
    } else {
      message.value = locale.value === 'zh' ? `设置失败：${error.message}` : `Failed: ${error.message}`
    }
    messageType.value = 'error'
  } else {
    message.value = locale.value === 'zh' ? '密码已更新，正在跳转登录...' : 'Password updated! Redirecting...'
    messageType.value = 'success'
    setTimeout(() => {
      supabase.auth.signOut()
      mode.value = 'login'
      message.value = ''
      form.newPassword = ''
    }, 2000)
  }
}

async function handleGoogle() {
  googleLoading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  })
  if (error) {
    message.value = error.message
    messageType.value = 'error'
    googleLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Background -->
    <div class="bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid"></div>
    </div>

    <!-- Nav -->
    <nav class="nav">
      <a class="logo" href="/">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#nav-lg)"/>
          <path d="M20 3 L8 18 L15 18 L12 29 L24 14 L17 14Z" fill="white"/>
          <defs>
            <linearGradient id="nav-lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stop-color="#4f46e5"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
        </svg>
        Tom Liu
      </a>
      <button class="lang-btn" @click="toggleLang">
        {{ locale === 'en' ? 'ZH' : 'EN' }}
      </button>
    </nav>

    <!-- Card -->
    <div class="card">
      <!-- Header -->
      <div class="card-header">
        <div class="card-icon">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#ali)"/>
            <path d="M20 3 L8 18 L15 18 L12 29 L24 14 L17 14Z" fill="white"/>
            <defs>
              <linearGradient id="ali" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4f46e5"/>
                <stop offset="1" stop-color="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>{{ mode === 'login' ? (locale === 'zh' ? '欢迎回来' : 'Welcome back') : mode === 'register' ? (locale === 'zh' ? '创建账号' : 'Create account') : (locale === 'zh' ? '重置密码' : 'Reset Password') }}</h1>
        <p>{{ mode === 'login' ? (locale === 'zh' ? '登录你的账号继续使用' : 'Sign in to your account to continue') : mode === 'register' ? (locale === 'zh' ? '注册开始使用我们的服务' : 'Sign up to get started') : (locale === 'zh' ? '输入邮箱，我们将发送重置链接' : 'Enter your email to receive a reset link') }}</p>
      </div>

      <!-- 重置密码模式 -->
      <template v-if="mode === 'reset'">
        <div class="field">
          <label>{{ locale === 'zh' ? '设置新密码' : 'New Password' }}</label>
          <div class="input-wrap">
            <input
              v-model="form.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              :placeholder="locale === 'zh' ? '请输入新密码' : 'Enter new password'"
              minlength="8"
              maxlength="20"
            />
            <button type="button" class="eye-btn" @click="showNewPassword = !showNewPassword">
              <svg v-if="!showNewPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <div class="field-hint">{{ locale === 'zh' ? '8-20位，需包含字母和数字' : '8-20 characters, letters and numbers required' }}</div>
        </div>
        <div v-if="message" class="message" :class="messageType">{{ message }}</div>
        <button class="btn-primary" :disabled="loading" @click="handleReset">
          {{ loading ? '...' : (locale === 'zh' ? '确认设置新密码' : 'Set New Password') }}
        </button>
      </template>

      <!-- 忘记密码模式 -->
      <template v-if="mode === 'forgot'">
        <div class="field">
          <label>{{ locale === 'zh' ? '邮箱地址' : 'Email address' }}</label>
          <input v-model="form.email" type="email" :placeholder="locale === 'zh' ? '请输入邮箱' : 'Enter your email'" required />
        </div>
        <div v-if="message" class="message" :class="messageType">{{ message }}</div>
        <button class="btn-primary" :disabled="loading" @click="handleForgot">
          {{ loading ? '...' : (locale === 'zh' ? '发送重置链接' : 'Send Reset Link') }}
        </button>
        <div class="toggle">
          <button @click="mode = 'login'; message = ''">← {{ locale === 'zh' ? '返回登录' : 'Back to Sign In' }}</button>
        </div>
      </template>

      <!-- 登录/注册模式 -->
      <template v-if="mode === 'login' || mode === 'register'">
        <!-- Google Button -->
        <button class="btn-google" :disabled="googleLoading" @click="handleGoogle">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {{ googleLoading ? '...' : (locale === 'zh' ? '使用 Google 登录' : 'Continue with Google') }}
        </button>

        <div class="divider">
          <span>{{ locale === 'zh' ? '或使用邮箱' : 'or continue with email' }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'" class="field">
            <label>{{ locale === 'zh' ? '用户名' : 'Username' }}</label>
            <input
              v-model="form.username"
              type="text"
              :placeholder="locale === 'zh' ? '请输入用户名' : 'Enter your username'"
              autocomplete="username"
              maxlength="20"
              required
            />
          </div>
          <div class="field">
            <label>{{ locale === 'zh' ? '邮箱地址' : 'Email address' }}</label>
            <input
              v-model="form.email"
              type="email"
              :placeholder="locale === 'zh' ? '请输入邮箱' : 'Enter your email'"
              autocomplete="email"
              required
            />
          </div>
          <div class="field">
            <div class="password-label">
              <label>{{ locale === 'zh' ? '密码' : 'Password' }}</label>
              <button v-if="mode === 'login'" type="button" class="forgot-link" @click="mode = 'forgot'; message = ''">
                {{ locale === 'zh' ? '忘记密码？' : 'Forgot password?' }}
              </button>
            </div>
            <div class="input-wrap">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="locale === 'zh' ? '请输入密码' : 'Enter your password'"
                autocomplete="current-password"
                minlength="8"
                maxlength="20"
                required
              />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <div v-if="mode === 'register'" class="field-hint">{{ locale === 'zh' ? '8-20位，需包含字母和数字' : '8-20 characters, letters and numbers required' }}</div>
          </div>

          <!-- Message -->
          <div v-if="message" class="message" :class="messageType">{{ message }}</div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '...' : (mode === 'login' ? (locale === 'zh' ? '登录' : 'Sign In') : (locale === 'zh' ? '注册' : 'Sign Up')) }}
          </button>
        </form>

        <!-- Toggle -->
        <div class="toggle">
          {{ mode === 'login' ? (locale === 'zh' ? '还没有账号？' : "Don't have an account?") : (locale === 'zh' ? '已有账号？' : 'Already have an account?') }}
          <button @click="mode = mode === 'login' ? 'register' : 'login'; message = ''">
            {{ mode === 'login' ? (locale === 'zh' ? '立即注册' : 'Sign up') : (locale === 'zh' ? '立即登录' : 'Sign in') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.auth-page {
  min-height: 100vh;
  background: #080a0f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  position: relative;
  padding: 80px 24px 40px;
}

/* Background */
.bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 8s ease-in-out infinite;
}
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent); top: -150px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #8b5cf6, transparent); bottom: -100px; right: -80px; animation-delay: 3s; }
.orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #06b6d4, transparent); top: 50%; left: 50%; animation-delay: 6s; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

/* Nav */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 40px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(8,10,15,0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 1.1rem; font-weight: 700; color: #fff;
  text-decoration: none;
}
.lang-btn {
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc; border-radius: 6px;
  padding: 4px 12px; font-size: 0.8rem; cursor: pointer;
  transition: background 0.2s;
}
.lang-btn:hover { background: rgba(99,102,241,0.25); }

/* Card */
.card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px 36px;
  backdrop-filter: blur(20px);
  box-shadow: 0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1);
}

.card-header { text-align: center; margin-bottom: 32px; }
.card-icon {
  margin-bottom: 16px;
  display: flex; justify-content: center;
}
.card-header h1 {
  font-size: 1.6rem; font-weight: 800;
  color: #fff; letter-spacing: -0.03em;
  margin: 0 0 8px;
}
.card-header p {
  font-size: 0.88rem; color: rgba(255,255,255,0.4);
  margin: 0;
}

/* Google Button */
.btn-google {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff; font-size: 0.9rem; font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  margin-bottom: 20px;
}
.btn-google:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

/* Divider */
.divider {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.divider::before, .divider::after {
  content: ''; flex: 1;
  height: 1px; background: rgba(255,255,255,0.08);
}
.divider span { font-size: 0.78rem; color: rgba(255,255,255,0.3); white-space: nowrap; }

/* Form */
.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: 0.82rem; font-weight: 500;
  color: rgba(255,255,255,0.6); margin-bottom: 8px;
}
.field input {
  width: 100%; padding: 12px 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff; font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.field input::placeholder { color: rgba(255,255,255,0.25); }
.field input:focus {
  border-color: rgba(99,102,241,0.5);
  background: rgba(99,102,241,0.06);
}
.input-wrap input {
  padding-right: 44px !important;
}
.field-hint {
  margin-top: 6px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.25);
}
.password-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.password-label label { margin-bottom: 0; }
.forgot-link {
  background: none; border: none;
  color: #a5b4fc; font-size: 0.78rem;
  cursor: pointer; padding: 0;
  transition: color 0.2s;
}
.forgot-link:hover { color: #fff; }
.input-wrap {
  position: relative;
}
.input-wrap input {
  width: 100%;
  padding-right: 44px;
}
.eye-btn {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  color: #6366f1;
  cursor: pointer; padding: 0;
  display: flex; align-items: center;
  transition: color 0.2s;
}
.eye-btn:hover { color: #a5b4fc; }

/* Message */
.message {
  font-size: 0.82rem; padding: 10px 14px;
  border-radius: 8px; margin-bottom: 16px;
}
.message.success { background: rgba(52,211,153,0.1); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
.message.error { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

/* Primary Button */
.btn-primary {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; border-radius: 10px;
  color: #fff; font-size: 0.95rem; font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 0 24px rgba(99,102,241,0.3);
  margin-top: 4px;
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Toggle */
.toggle {
  text-align: center; margin-top: 24px;
  font-size: 0.85rem; color: rgba(255,255,255,0.35);
}
.toggle button {
  background: none; border: none;
  color: #a5b4fc; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; padding: 0; margin-left: 4px;
  transition: color 0.2s;
}
.toggle button:hover { color: #fff; }
</style>
