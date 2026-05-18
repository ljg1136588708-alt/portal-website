<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const { locale } = useI18n()

const userEmail = ref('')
const userName = ref('')
const editingName = ref(false)
const newName = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | ''>('')

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) { router.push('/login'); return }
  userEmail.value = data.user.email || ''
  userName.value = data.user.user_metadata?.username || ''
  newName.value = userName.value
})

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}

async function saveName() {
  if (!newName.value.trim()) return
  loading.value = true
  const { error } = await supabase.auth.updateUser({
    data: { username: newName.value.trim() }
  })
  loading.value = false
  if (error) {
    message.value = locale.value === 'zh' ? '保存失败，请重试。' : 'Save failed, please try again.'
    messageType.value = 'error'
  } else {
    userName.value = newName.value.trim()
    editingName.value = false
    message.value = locale.value === 'zh' ? '用户名已更新。' : 'Username updated.'
    messageType.value = 'success'
    setTimeout(() => { message.value = '' }, 3000)
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
          <rect width="32" height="32" rx="9" fill="url(#lg2)"/>
          <path d="M16 4 C16.8 9.5 17.5 11.2 22.5 12 C17.5 12.8 16.8 14.5 16 20 C15.2 14.5 14.5 12.8 9.5 12 C14.5 11.2 15.2 9.5 16 4Z" fill="white"/>
          <path d="M16 20 C16.5 23.5 17 24.8 20 25.5 C17 26.2 16.5 27.5 16 31 C15.5 27.5 15 26.2 12 25.5 C15 24.8 15.5 23.5 16 20Z" fill="white" opacity="0.6"/>
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
        <button class="btn-signout" @click="signOut">
          {{ locale === 'zh' ? '退出登录' : 'Sign Out' }}
        </button>
      </div>
    </nav>

    <div class="content">
      <!-- Avatar & Name -->
      <div class="profile-header">
        <div class="avatar">{{ (userName || userEmail)?.[0]?.toUpperCase() || '?' }}</div>
        <div class="profile-info">
          <h1>{{ userName || (locale === 'zh' ? '未设置用户名' : 'No username') }}</h1>
          <p>{{ userEmail }}</p>
        </div>
      </div>

      <!-- Card -->
      <div class="profile-card">
        <h2>{{ locale === 'zh' ? '个人信息' : 'Profile' }}</h2>

        <!-- Username -->
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
              <input v-model="newName" class="edit-input" maxlength="20" :placeholder="locale === 'zh' ? '输入用户名' : 'Enter username'" />
              <div class="edit-actions">
                <button class="save-btn" :disabled="loading" @click="saveName">
                  {{ loading ? '...' : (locale === 'zh' ? '保存' : 'Save') }}
                </button>
                <button class="cancel-btn" @click="editingName = false">
                  {{ locale === 'zh' ? '取消' : 'Cancel' }}
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Email -->
        <div class="info-row">
          <div class="info-label">{{ locale === 'zh' ? '邮箱' : 'Email' }}</div>
          <div class="info-value">
            <span>{{ userEmail }}</span>
          </div>
        </div>

        <!-- Message -->
        <div v-if="message" class="message" :class="messageType">{{ message }}</div>
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
.lang-btn {
  background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc; border-radius: 6px; padding: 4px 12px; font-size: 0.8rem; cursor: pointer;
}
.btn-signout {
  padding: 7px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7); cursor: pointer; transition: background 0.2s;
}
.btn-signout:hover { background: rgba(255,255,255,0.12); color: #fff; }

.content {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 100px 24px 60px;
}

.profile-header {
  display: flex; align-items: center; gap: 20px;
  margin-bottom: 40px;
}
.avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.profile-info h1 { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.03em; }
.profile-info p { font-size: 0.88rem; color: rgba(255,255,255,0.4); margin: 0; }

.profile-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px; padding: 32px;
  margin-bottom: 24px;
}
.profile-card h2 {
  font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.5);
  letter-spacing: 0.08em; text-transform: uppercase;
  margin: 0 0 24px;
}

.info-row {
  display: flex; align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  gap: 16px;
}
.info-row:last-of-type { border-bottom: none; }
.info-label {
  font-size: 0.85rem; color: rgba(255,255,255,0.4);
  width: 80px; flex-shrink: 0; padding-top: 2px;
}
.info-value {
  flex: 1; display: flex; align-items: center;
  gap: 12px; flex-wrap: wrap;
}
.info-value span { font-size: 0.95rem; color: #fff; }

.edit-btn {
  background: none; border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc; font-size: 0.78rem; padding: 3px 10px;
  border-radius: 6px; cursor: pointer; transition: all 0.2s;
}
.edit-btn:hover { background: rgba(99,102,241,0.15); }
.edit-input {
  flex: 1; min-width: 0;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(99,102,241,0.4);
  border-radius: 8px; padding: 8px 12px;
  color: #fff; font-size: 0.9rem; outline: none;
}
.edit-actions { display: flex; gap: 8px; }
.save-btn {
  padding: 6px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; color: #fff; cursor: pointer;
}
.save-btn:disabled { opacity: 0.5; }
.cancel-btn {
  padding: 6px 14px; border-radius: 7px; font-size: 0.82rem;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6); cursor: pointer;
}

.message {
  font-size: 0.82rem; padding: 10px 14px;
  border-radius: 8px; margin-top: 16px;
}
.message.success { background: rgba(52,211,153,0.1); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
.message.error { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

.back-link {
  display: inline-block; color: rgba(255,255,255,0.35);
  font-size: 0.85rem; text-decoration: none; transition: color 0.2s;
}
.back-link:hover { color: #fff; }
</style>
