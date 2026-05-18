<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const { locale } = useI18n()

const userEmail = ref('')
const userName = ref('')
const avatarUrl = ref('')
const userId = ref('')

const isOAuthUser = ref(false)
const editingName = ref(false)
const newName = ref('')

const changingPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPwd = ref(false)
const showConfirmPwd = ref(false)

const avatarLoading = ref(false)
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) { router.push('/login'); return }
  userId.value = data.user.id
  userEmail.value = data.user.email || ''
  userName.value = data.user.user_metadata?.username || ''
  avatarUrl.value = data.user.user_metadata?.avatar_url || ''
  newName.value = userName.value
  // 检测是否为 OAuth 用户（Google 等），OAuth 用户无法修改密码
  const provider = data.user.app_metadata?.provider
  isOAuthUser.value = provider === 'google' || provider === 'github'
})

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}

function showMsg(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

// 上传头像
async function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showMsg(locale.value === 'zh' ? '请选择图片文件。' : 'Please select an image file.', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showMsg(locale.value === 'zh' ? '图片不能超过 5 MB。' : 'Image must be under 5 MB.', 'error')
    return
  }
  avatarLoading.value = true
  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId.value}/avatar.${ext}`

  // 先删除旧文件，再上传（避免 upsert 权限问题）
  await supabase.storage.from('avatars').remove([path])

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, cacheControl: '0' })
  if (uploadError) {
    console.error('Upload error:', uploadError.message, uploadError)
    showMsg(uploadError.message || (locale.value === 'zh' ? '上传失败，请重试。' : 'Upload failed.'), 'error')
    avatarLoading.value = false
    return
  }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = urlData.publicUrl + '?t=' + Date.now()
  await supabase.auth.updateUser({ data: { avatar_url: url } })
  avatarUrl.value = url
  avatarLoading.value = false
  showMsg(locale.value === 'zh' ? '头像已更新。' : 'Avatar updated.', 'success')
}

// 修改用户名
async function saveName() {
  if (!newName.value.trim()) return
  loading.value = true
  const { error } = await supabase.auth.updateUser({ data: { username: newName.value.trim() } })
  loading.value = false
  if (error) {
    showMsg(locale.value === 'zh' ? '保存失败，请重试。' : 'Save failed.', 'error')
  } else {
    userName.value = newName.value.trim()
    editingName.value = false
    showMsg(locale.value === 'zh' ? '用户名已更新。' : 'Username updated.', 'success')
  }
}

// 修改密码
function validatePassword(pwd: string) {
  if (pwd.length < 8 || pwd.length > 20) return locale.value === 'zh' ? '密码需要8-20位字符。' : 'Password must be 8-20 characters.'
  if (!/[a-zA-Z]/.test(pwd)) return locale.value === 'zh' ? '密码必须包含至少一个字母。' : 'Must contain a letter.'
  if (!/[0-9]/.test(pwd)) return locale.value === 'zh' ? '密码必须包含至少一个数字。' : 'Must contain a number.'
  return ''
}

async function savePassword() {
  const err = validatePassword(newPassword.value)
  if (err) { showMsg(err, 'error'); return }
  if (newPassword.value !== confirmPassword.value) {
    showMsg(locale.value === 'zh' ? '两次密码不一致。' : 'Passwords do not match.', 'error')
    return
  }
  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  loading.value = false
  if (error) {
    showMsg(locale.value === 'zh' ? '修改失败，请重试。' : 'Failed to update password.', 'error')
  } else {
    changingPassword.value = false
    newPassword.value = ''
    confirmPassword.value = ''
    showMsg(locale.value === 'zh' ? '密码已更新。' : 'Password updated.', 'success')
  }
}

async function signOut() {
  await supabase.auth.signOut()
  router.push('/')
}
</script>

<template>
  <div class="profile-page">
    <div class="bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="grid"></div>
    </div>

    <nav class="nav">
      <a class="logo" href="/">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#lg2)"/>
          <path d="M20 3 L8 18 L15 18 L12 29 L24 14 L17 14Z" fill="white"/>
          <defs>
            <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stop-color="#4f46e5"/>
              <stop offset="1" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
        </svg>
        <span>Tom Liu</span>
      </a>
      <div class="nav-right">
        <button class="lang-btn" @click="toggleLang">{{ locale === 'en' ? 'ZH' : 'EN' }}</button>
        <button class="btn-signout" @click="signOut">{{ locale === 'zh' ? '退出登录' : 'Sign Out' }}</button>
      </div>
    </nav>

    <div class="content">
      <!-- Header -->
      <div class="profile-header">
        <!-- 头像 -->
        <div class="avatar-wrap" @click="($refs.avatarInput as HTMLInputElement).click()">
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="avatar" />
          <div v-else class="avatar-default">{{ (userName || userEmail)?.[0]?.toUpperCase() || '?' }}</div>
          <div class="avatar-overlay">
            <span v-if="avatarLoading">...</span>
            <span v-else>{{ locale === 'zh' ? '换头像' : 'Change' }}</span>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
        </div>
        <div class="profile-info">
          <h1>{{ userName || (locale === 'zh' ? '未设置用户名' : 'No username') }}</h1>
          <p class="avatar-hint">{{ locale === 'zh' ? '点击头像更换 · 最大 5 MB' : 'Click avatar to change · Max 5 MB' }}</p>
        </div>
      </div>

      <!-- Message -->
      <div v-if="message" class="message" :class="messageType">{{ message }}</div>

      <!-- 个人信息 -->
      <div class="profile-card">
        <h2>{{ locale === 'zh' ? '个人信息' : 'Profile' }}</h2>

        <!-- 用户名 -->
        <div class="info-row">
          <div class="info-label">{{ locale === 'zh' ? '用户名' : 'Username' }}</div>
          <div class="info-value">
            <template v-if="!editingName">
              <span>{{ userName || '—' }}</span>
              <button class="edit-btn" @click="editingName = true; newName = userName">
                {{ locale === 'zh' ? '修改' : 'Edit' }}
              </button>
            </template>
            <template v-else>
              <input v-model="newName" class="edit-input" maxlength="20" :placeholder="locale === 'zh' ? '输入用户名' : 'Username'" />
              <div class="edit-actions">
                <button class="save-btn" :disabled="loading" @click="saveName">{{ loading ? '...' : (locale === 'zh' ? '保存' : 'Save') }}</button>
                <button class="cancel-btn" @click="editingName = false">{{ locale === 'zh' ? '取消' : 'Cancel' }}</button>
              </div>
            </template>
          </div>
        </div>

        <!-- 邮箱 -->
        <div class="info-row">
          <div class="info-label">{{ locale === 'zh' ? '邮箱' : 'Email' }}</div>
          <div class="info-value"><span>{{ userEmail }}</span></div>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="profile-card" v-if="!isOAuthUser">
        <div class="card-title-row">
          <h2>{{ locale === 'zh' ? '账号安全' : 'Security' }}</h2>
          <button v-if="!changingPassword" class="edit-btn" @click="changingPassword = true">
            {{ locale === 'zh' ? '修改密码' : 'Change Password' }}
          </button>
        </div>

        <template v-if="!changingPassword">
          <div class="info-row" style="border:none">
            <div class="info-label">{{ locale === 'zh' ? '密码' : 'Password' }}</div>
            <div class="info-value"><span>••••••••</span></div>
          </div>
        </template>

        <template v-else>
          <div class="pwd-field">
            <label>{{ locale === 'zh' ? '新密码' : 'New Password' }}</label>
            <div class="input-wrap">
              <input v-model="newPassword" :type="showNewPwd ? 'text' : 'password'" class="edit-input" maxlength="20" :placeholder="locale === 'zh' ? '8-20位，含字母和数字' : '8-20 chars, letters & numbers'" />
              <button type="button" class="eye-btn" @click="showNewPwd = !showNewPwd">
                <svg v-if="!showNewPwd" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>
          <div class="pwd-field">
            <label>{{ locale === 'zh' ? '确认新密码' : 'Confirm Password' }}</label>
            <div class="input-wrap">
              <input v-model="confirmPassword" :type="showConfirmPwd ? 'text' : 'password'" class="edit-input" maxlength="20" :placeholder="locale === 'zh' ? '再次输入新密码' : 'Repeat new password'" />
              <button type="button" class="eye-btn" @click="showConfirmPwd = !showConfirmPwd">
                <svg v-if="!showConfirmPwd" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>
          <div class="edit-actions" style="margin-top:12px">
            <button class="save-btn" :disabled="loading" @click="savePassword">{{ loading ? '...' : (locale === 'zh' ? '确认修改' : 'Save') }}</button>
            <button class="cancel-btn" @click="changingPassword = false; newPassword = ''; confirmPassword = ''">{{ locale === 'zh' ? '取消' : 'Cancel' }}</button>
          </div>
        </template>
      </div>

      <!-- OAuth 用户提示 -->
      <div class="profile-card oauth-tip" v-if="isOAuthUser">
        <h2>{{ locale === 'zh' ? '账号安全' : 'Security' }}</h2>
        <p class="oauth-msg">
          {{ locale === 'zh'
            ? '你通过 Google 登录，密码由 Google 管理，无法在此修改。'
            : 'You signed in with Google. Your password is managed by Google.' }}
        </p>
      </div>

      <a href="/" class="back-link">← {{ locale === 'zh' ? '返回首页' : 'Back to Home' }}</a>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.profile-page {
  min-height: 100vh;
  background: #080a0f;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  color: #e8eaf0;
}

.bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.2; animation: float 8s ease-in-out infinite; }
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent); top: -100px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #8b5cf6, transparent); bottom: -100px; right: -100px; animation-delay: 3s; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
.grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 40px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(8,10,15,0.7); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.logo { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none; }
.logo span { color: #fff; }
.nav-right { display: flex; align-items: center; gap: 12px; }
.lang-btn { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; border-radius: 6px; padding: 4px 12px; font-size: 0.8rem; cursor: pointer; }
.btn-signout { padding: 7px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); cursor: pointer; transition: background 0.2s; }
.btn-signout:hover { background: rgba(255,255,255,0.12); color: #fff; }

.content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 100px 24px 60px; }

.profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }

.avatar-wrap {
  position: relative; width: 80px; height: 80px;
  border-radius: 50%; cursor: pointer; flex-shrink: 0;
  overflow: hidden;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.avatar-default {
  width: 100%; height: 100%; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 700; color: #fff;
}
.avatar-overlay {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 600; color: #fff;
  opacity: 0; transition: opacity 0.2s;
}
.avatar-wrap:hover .avatar-overlay { opacity: 1; }

.profile-info h1 { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.03em; }
.profile-info p { font-size: 0.88rem; color: rgba(255,255,255,0.4); margin: 0; }
.avatar-hint { font-size: 0.78rem; color: rgba(255,255,255,0.25); margin-top: 6px !important; }

.message { font-size: 0.82rem; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
.message.success { background: rgba(52,211,153,0.1); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
.message.error { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

.profile-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px 32px; margin-bottom: 20px; }
.profile-card h2 { font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 20px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.card-title-row h2 { margin: 0; }

.info-row { display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); gap: 16px; }
.info-row:last-of-type { border-bottom: none; padding-bottom: 0; }
.info-label { font-size: 0.85rem; color: rgba(255,255,255,0.4); width: 80px; flex-shrink: 0; padding-top: 2px; }
.info-value { flex: 1; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.info-value span { font-size: 0.95rem; color: #fff; }

.edit-btn { background: none; border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; font-size: 0.78rem; padding: 3px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.edit-btn:hover { background: rgba(99,102,241,0.15); }

.edit-input { flex: 1; min-width: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(99,102,241,0.4); border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.9rem; outline: none; width: 100%; }
.edit-actions { display: flex; gap: 8px; }
.save-btn { padding: 6px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 600; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; cursor: pointer; }
.save-btn:disabled { opacity: 0.5; }
.cancel-btn { padding: 6px 14px; border-radius: 7px; font-size: 0.82rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; }

.pwd-field { margin-bottom: 14px; }
.pwd-field label { display: block; font-size: 0.82rem; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
.input-wrap { position: relative; }
.input-wrap .edit-input { padding-right: 40px; }
.eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6366f1; cursor: pointer; padding: 0; display: flex; align-items: center; }
.eye-btn:hover { color: #a5b4fc; }

.oauth-tip { opacity: 0.7; }
.oauth-msg { font-size: 0.88rem; color: rgba(255,255,255,0.45); margin: 0; }

.back-link { display: inline-block; color: rgba(255,255,255,0.35); font-size: 0.85rem; text-decoration: none; transition: color 0.2s; }
.back-link:hover { color: #fff; }
</style>
