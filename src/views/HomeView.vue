<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'

const { t, locale } = useI18n()
const userEmail = ref('')
const userName = ref('')
const avatarUrl = ref('')

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  userEmail.value = data.user?.email || ''
  userName.value = data.user?.user_metadata?.username || ''
  avatarUrl.value = data.user?.user_metadata?.avatar_url || ''
})

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}

async function signOut() {
  await supabase.auth.signOut()
  userEmail.value = ''
  userName.value = ''
  avatarUrl.value = ''
}
</script>

<template>
  <div class="home">
    <!-- Nav -->
    <nav class="nav">
      <div class="nav-inner">
        <a class="logo" href="/">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#lg)"/>
            <path d="M20 3 L8 18 L15 18 L12 29 L24 14 L17 14Z" fill="white"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4f46e5"/>
                <stop offset="1" stop-color="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
          <span>Tom Liu</span>
        </a>
        <div class="nav-links">
          <template v-if="userEmail">
            <a class="nav-user" href="/profile">
              <div class="nav-avatar">
                <img v-if="avatarUrl" :src="avatarUrl" class="nav-avatar-img" alt="avatar" />
                <span v-else>{{ (userName || userEmail)?.[0]?.toUpperCase() }}</span>
              </div>
              {{ userName || userEmail }}
            </a>
            <button class="nav-signout" @click="signOut">{{ locale === 'en' ? 'Sign Out' : '退出登录' }}</button>
          </template>
          <template v-else>
            <a class="nav-login" href="/login">{{ locale === 'en' ? 'Sign In' : '登录' }}</a>
          </template>
          <button class="lang-btn" @click="toggleLang">
            {{ locale === 'en' ? 'ZH' : 'EN' }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
      <div class="hero-content">
        <div class="badge">{{ t('hero.badge') }}</div>
        <h1 class="hero-title">
          {{ t('hero.title1') }}<br />
          <span class="gradient-text">{{ t('hero.title2') }}</span>
        </h1>
        <p class="hero-desc" style="white-space: pre-line">{{ t('hero.desc') }}</p>
        <div class="hero-actions">
          <a class="btn-primary" href="https://chromewebstore.google.com" target="_blank">
            {{ t('hero.btnExplore') }}
          </a>
        </div>
      </div>
      <div class="hero-grid"></div>
    </section>

    <!-- Stats -->
    <section class="stats">
      <div class="stats-inner">
        <div class="stat-item">
          <span class="stat-num">100%</span>
          <span class="stat-label">{{ t('stats.privacy') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">0</span>
          <span class="stat-label">{{ t('stats.data') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ t('stats.localNum') }}</span>
          <span class="stat-label">{{ t('stats.storage') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num">{{ t('stats.freeNum') }}</span>
          <span class="stat-label">{{ t('stats.free') }}</span>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="section-inner">
        <div class="section-label">{{ t('features.label') }}</div>
        <h2 class="section-title">{{ t('features.title') }}</h2>
        <div class="cards">
          <div class="card card-highlight">
            <div class="card-icon">🔒</div>
            <h3>{{ t('features.privacy.title') }}</h3>
            <p>{{ t('features.privacy.desc') }}</p>
            <div class="card-tag">{{ t('features.privacy.tag') }}</div>
          </div>
          <div class="card">
            <div class="card-icon">⚡</div>
            <h3>{{ t('features.lightweight.title') }}</h3>
            <p>{{ t('features.lightweight.desc') }}</p>
            <div class="card-tag">{{ t('features.lightweight.tag') }}</div>
          </div>
          <div class="card">
            <div class="card-icon">🎁</div>
            <h3>{{ t('features.free.title') }}</h3>
            <p>{{ t('features.free.desc') }}</p>
            <div class="card-tag">{{ t('features.free.tag') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Extensions -->
    <section class="extensions">
      <div class="section-inner">
        <div class="section-label">{{ t('extensions.label') }}</div>
        <h2 class="section-title">{{ t('extensions.title') }}</h2>
        <div class="ext-cards">
          <div class="ext-card">
            <div class="ext-card-top">
              <div class="ext-icon">🪺</div>
              <div class="ext-info">
                <h3>TabNest</h3>
                <div class="card-tag">{{ t('extensions.tabnest.tag') }}</div>
              </div>
            </div>
            <p>{{ t('extensions.tabnest.desc') }}</p>
            <a class="ext-link" href="https://chromewebstore.google.com/detail/tabnest/ggibbibccmhcmkhohkcchcflcibgmkgi" target="_blank">
              {{ t('extensions.getChrome') }}
            </a>
          </div>
          <div class="ext-card ext-card-featured">
            <div class="ext-card-top">
              <div class="ext-icon">🔇</div>
              <div class="ext-info">
                <h3>Silent Mode</h3>
                <div class="card-tag">{{ t('extensions.silentmode.tag') }}</div>
              </div>
            </div>
            <p>{{ t('extensions.silentmode.desc') }}</p>
            <a class="ext-link" href="https://chromewebstore.google.com" target="_blank">
              {{ t('extensions.getChrome') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="cta-inner">
        <div class="cta-glow"></div>
        <h2>{{ t('cta.title') }}</h2>
        <p>{{ t('cta.desc') }}</p>
        <a class="btn-primary" href="https://chromewebstore.google.com" target="_blank">
          {{ t('cta.btn') }}
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <span>{{ t('footer.rights', { year: new Date().getFullYear() }) }}</span>
        <div class="footer-links">
          <a href="/privacy">{{ t('footer.privacy') }}</a>
          <a href="mailto:ljg1136588708@gmail.com">{{ t('nav.contact') }}：ljg1136588708@gmail.com</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.home {
  background: #080a0f;
  color: #e8eaf0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  overflow-x: hidden;
}

/* Nav */
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 0 40px;
  height: 64px;
  display: flex;
  align-items: center;
  background: rgba(8, 10, 15, 0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.nav-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
}
.logo span { color: #fff; }
.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-links a {
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.nav-links a:hover { color: #fff; }
.lang-btn {
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}
.lang-btn:hover { background: rgba(99,102,241,0.25); }
.nav-login {
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-login:hover { color: #fff; }
.nav-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: #fff;
  flex-shrink: 0; overflow: hidden;
}
.nav-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.nav-user {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.2s;
}
.nav-user:hover { color: #fff; }
.nav-signout {
  background: none; border: none;
  color: rgba(255,255,255,0.5);
  font-size: 0.9rem; cursor: pointer;
  transition: color 0.2s; padding: 0;
}
.nav-signout:hover { color: #fff; }

/* Hero */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  overflow: hidden;
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  animation: float 8s ease-in-out infinite;
}
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent); top: -100px; left: -100px; animation-delay: 0s; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #8b5cf6, transparent); top: 50%; right: -80px; animation-delay: 3s; }
.orb-3 { width: 350px; height: 350px; background: radial-gradient(circle, #06b6d4, transparent); bottom: -50px; left: 30%; animation-delay: 6s; }
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
  pointer-events: none;
}
.hero-content { position: relative; z-index: 1; max-width: 760px; }
.badge {
  display: inline-block;
  padding: 6px 16px;
  border: 1px solid rgba(99,102,241,0.4);
  border-radius: 100px;
  font-size: 0.8rem;
  color: #a5b4fc;
  margin-bottom: 32px;
  letter-spacing: 0.05em;
  background: rgba(99,102,241,0.08);
}
.hero-title {
  font-size: clamp(2.8rem, 7vw, 5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #fff;
  margin-bottom: 24px;
}
.gradient-text {
  background: linear-gradient(135deg, #6366f1, #a78bfa, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc { font-size: 1.15rem; line-height: 1.75; color: rgba(255,255,255,0.5); margin-bottom: 40px; }
.hero-actions { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }

.btn-primary {
  display: inline-block;
  padding: 14px 28px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 0 30px rgba(99,102,241,0.3);
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-ghost { display: inline-block; padding: 14px 20px; color: rgba(255,255,255,0.6); font-size: 0.95rem; text-decoration: none; transition: color 0.2s; }
.btn-ghost:hover { color: #fff; }

/* Stats */
.stats { border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 48px 24px; }
.stats-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 32px; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.stat-num { font-size: 2rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.stat-label { font-size: 0.85rem; color: rgba(255,255,255,0.4); letter-spacing: 0.04em; }
.stat-divider { width: 1px; height: 48px; background: rgba(255,255,255,0.08); }

/* Shared section layout */
.section-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
.section-label { font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6366f1; margin-bottom: 16px; }
.section-title { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 60px; }

/* Extensions */
.extensions { padding: 80px 24px 100px; border-top: 1px solid rgba(255,255,255,0.06); }
.ext-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 24px;
  max-width: 860px;
  margin: 0 auto;
}
.ext-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 36px 32px;
  text-align: left;
  transition: border-color 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ext-card:hover { border-color: rgba(99,102,241,0.35); transform: translateY(-4px); }
.ext-card-featured { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.25); }
.ext-card-top { display: flex; align-items: center; gap: 16px; }
.ext-icon { font-size: 2.2rem; flex-shrink: 0; }
.ext-info { display: flex; flex-direction: column; gap: 8px; }
.ext-info h3 { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0; }
.ext-card > p { font-size: 0.9rem; line-height: 1.75; color: rgba(255,255,255,0.45); margin: 0; flex: 1; }
.ext-link {
  display: inline-block;
  color: #a5b4fc;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
  margin-top: 4px;
}
.ext-link:hover { color: #fff; }

/* Features */
.features { padding: 80px 24px 100px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 36px 32px; text-align: left; transition: border-color 0.2s, transform 0.2s; }
.card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-4px); }
.card-highlight { background: rgba(99,102,241,0.06); border-color: rgba(99,102,241,0.25); }
.card-icon { font-size: 2rem; margin-bottom: 20px; }
.card h3 { font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
.card p { font-size: 0.9rem; line-height: 1.7; color: rgba(255,255,255,0.45); margin-bottom: 20px; }
.card-tag { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; background: rgba(99,102,241,0.12); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2); }

/* CTA */
.cta { padding: 100px 24px; text-align: center; position: relative; }
.cta-inner { max-width: 600px; margin: 0 auto; position: relative; }
.cta-glow { position: absolute; width: 400px; height: 200px; background: radial-gradient(ellipse, rgba(99,102,241,0.2), transparent); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; filter: blur(40px); }
.cta h2 { font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 16px; }
.cta p { font-size: 1rem; color: rgba(255,255,255,0.45); margin-bottom: 36px; }

/* Footer */
.footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 32px 40px; }
.footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; color: rgba(255,255,255,0.3); }
.footer-links { display: flex; gap: 24px; }
.footer-links a { color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: rgba(255,255,255,0.7); }
</style>
