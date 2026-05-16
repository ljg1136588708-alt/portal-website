<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const router = useRouter()
const { locale } = useI18n()
const user = ref<User | null>(null)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    router.push('/login')
    return
  }
  user.value = data.user
})

async function signOut() {
  await supabase.auth.signOut()
  router.push('/')
}

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}
</script>

<template>
  <div class="dashboard">
    <div class="bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <nav class="nav">
      <a class="logo" href="/">Tom Liu</a>
      <div class="nav-right">
        <button class="lang-btn" @click="toggleLang">{{ locale === 'en' ? 'ZH' : 'EN' }}</button>
        <button class="btn-signout" @click="signOut">
          {{ locale === 'zh' ? '退出登录' : 'Sign Out' }}
        </button>
      </div>
    </nav>

    <div class="content">
      <div class="welcome-card">
        <div class="avatar">{{ user?.email?.[0]?.toUpperCase() || '?' }}</div>
        <div class="welcome-text">
          <h1>{{ locale === 'zh' ? '欢迎回来 👋' : 'Welcome back 👋' }}</h1>
          <p>{{ user?.email }}</p>
        </div>
      </div>

      <div class="cards">
        <div class="info-card">
          <div class="info-icon">🔇</div>
          <div>
            <h3>Silent Mode</h3>
            <p>{{ locale === 'zh' ? '一键静音所有标签页' : 'Mute all tabs instantly' }}</p>
          </div>
          <a href="https://chromewebstore.google.com" target="_blank" class="card-link">
            {{ locale === 'zh' ? '获取插件 →' : 'Get Extension →' }}
          </a>
        </div>
        <div class="info-card">
          <div class="info-icon">🪺</div>
          <div>
            <h3>TabNest</h3>
            <p>{{ locale === 'zh' ? '一键保存标签页' : 'Save tabs with one click' }}</p>
          </div>
          <a href="https://chromewebstore.google.com/detail/tabnest/ggibbibccmhcmkhohkcchcflcibgmkgi" target="_blank" class="card-link">
            {{ locale === 'zh' ? '获取插件 →' : 'Get Extension →' }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.dashboard {
  min-height: 100vh;
  background: #080a0f;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  color: #e8eaf0;
}

.bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.2; }
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent); top: -100px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #06b6d4, transparent); bottom: -100px; right: -100px; }

.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 40px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(8,10,15,0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.logo { font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none; }
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
  max-width: 900px; margin: 0 auto;
  padding: 100px 24px 60px;
}

.welcome-card {
  display: flex; align-items: center; gap: 20px;
  margin-bottom: 48px;
}
.avatar {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.welcome-text h1 {
  font-size: 1.8rem; font-weight: 800; color: #fff;
  letter-spacing: -0.03em; margin: 0 0 6px;
}
.welcome-text p { font-size: 0.9rem; color: rgba(255,255,255,0.4); margin: 0; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.info-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px; padding: 28px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color 0.2s, transform 0.2s;
}
.info-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); }
.info-icon { font-size: 2rem; }
.info-card h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
.info-card p { font-size: 0.85rem; color: rgba(255,255,255,0.4); margin: 0; }
.card-link {
  display: inline-block; color: #a5b4fc;
  font-size: 0.85rem; font-weight: 600;
  text-decoration: none; margin-top: 4px;
  transition: color 0.2s;
}
.card-link:hover { color: #fff; }
</style>
