<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const BACKEND = import.meta.env.VITE_API_BASE_URL

const url = ref('')
const isParsing = ref(false)
const isDownloading = ref(false)
const progress = ref('')
const error = ref('')
const parsedToken = ref('')
const streamUrl = ref('')

function toggleLang() {
  locale.value = locale.value === 'en' ? 'zh' : 'en'
  localStorage.setItem('locale', locale.value)
}

function resetState() {
  error.value = ''
  parsedToken.value = ''
  streamUrl.value = ''
  progress.value = ''
}

async function handleParse() {
  if (!url.value.trim()) return
  resetState()
  isParsing.value = true
  progress.value = locale.value === 'zh' ? '正在解析链接，请稍候...' : 'Parsing link, please wait...'

  try {
    const res = await fetch(`${BACKEND}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value.trim() }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '解析失败')
    parsedToken.value = data.token
    streamUrl.value = `${BACKEND}/api/stream/${data.token}`
    progress.value = ''
  } catch (e: any) {
    error.value = e.message || '解析失败，请检查链接是否正确'
    progress.value = ''
  } finally {
    isParsing.value = false
  }
}

async function handleDownload() {
  if (!parsedToken.value) return
  isDownloading.value = true
  try {
    const res = await fetch(`${BACKEND}/api/download-file/${parsedToken.value}`)
    if (!res.ok) {
      const msg = res.status === 404 ? '链接已过期，请重新解析' : '下载失败'
      error.value = msg
      parsedToken.value = ''
      streamUrl.value = ''
      return
    }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `video_${Date.now()}.mp4`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 10000)
  } catch {
    error.value = '下载失败，请检查网络'
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="page">
    <nav class="nav">
      <div class="nav-inner">
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
        <div class="nav-tools">
          <a class="nav-tool-link active" href="/tools/watermark-remover">
            <span>✂️</span>
            {{ locale === 'en' ? 'Watermark Remover' : '去水印' }}
          </a>
        </div>
        <button class="lang-btn" @click="toggleLang">
          {{ locale === 'en' ? 'ZH' : 'EN' }}
        </button>
      </div>
    </nav>

    <main class="main">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>

      <div class="container">
        <div class="header">
          <div class="badge">✂️ {{ locale === 'en' ? 'Free Tool' : '免费工具' }}</div>
          <h1>{{ locale === 'en' ? 'Video Watermark Remover' : '视频去水印' }}</h1>
          <p>{{ locale === 'en'
            ? 'Download watermark-free videos from Douyin and Bilibili.'
            : '无水印下载抖音、B 站视频。'
          }}</p>
        </div>

        <div class="panel">
          <div class="panel-desc">
            {{ locale === 'en' ? 'Paste a share link from Douyin or Bilibili.' : '粘贴抖音或 B 站的视频分享链接。' }}
          </div>

          <div class="platforms">
            <span class="platform-tag">抖音</span>
            <span class="platform-tag">B站</span>
          </div>

          <textarea
            v-model="url"
            class="url-input"
            rows="3"
            :placeholder="locale === 'en' ? 'Paste video share link here...' : '粘贴视频分享链接…'"
            @keydown.enter.prevent="handleParse"
            @input="resetState"
          ></textarea>

          <div v-if="progress" class="result-box progress-box">
            <span class="spinner-sm"></span>{{ progress }}
          </div>
          <div v-if="error" class="result-box error-box">❌ {{ error }}</div>

          <div v-if="streamUrl" class="preview-box">
            <video :src="streamUrl" controls class="video-player" preload="metadata"></video>
            <div class="preview-success">✅ {{ locale === 'en' ? 'Parsed — ready to download' : '解析成功，可播放预览' }}</div>
          </div>

          <div class="action-row">
            <button class="btn-action btn-parse" @click="handleParse" :disabled="isParsing || !url.trim()">
              <span v-if="isParsing" class="spinner-sm"></span>
              <span v-else>🔍</span>
              {{ locale === 'en' ? 'Parse' : '解析' }}
            </button>
            <button class="btn-action btn-download" @click="handleDownload" :disabled="!parsedToken || isDownloading">
              <span v-if="isDownloading" class="spinner-sm"></span>
              <span v-else>⬇️</span>
              {{ locale === 'en' ? 'Download' : '下载' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.page { background: #080a0f; color: #e8eaf0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; }

.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 40px; height: 64px; display: flex; align-items: center; background: rgba(8,10,15,0.7); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
.nav-inner { width: 100%; display: flex; align-items: center; }
.logo { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none; flex-shrink: 0; }
.nav-tools { display: flex; align-items: center; gap: 4px; flex: 1; padding: 0 32px; }
.nav-tool-link { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 500; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s, background 0.2s; border: 1px solid transparent; }
.nav-tool-link.active { color: #a5b4fc; background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.25); }
.lang-btn { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; border-radius: 6px; padding: 4px 12px; font-size: 0.8rem; cursor: pointer; flex-shrink: 0; }

.main { padding-top: 64px; min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.25; }
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent); top: -50px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #06b6d4, transparent); bottom: -50px; right: -80px; }

.container { position: relative; z-index: 1; width: 100%; max-width: 720px; padding: 60px 24px; }

.header { text-align: center; margin-bottom: 40px; }
.badge { display: inline-block; padding: 6px 16px; border: 1px solid rgba(99,102,241,0.4); border-radius: 100px; font-size: 0.8rem; color: #a5b4fc; margin-bottom: 20px; background: rgba(99,102,241,0.08); }
.header h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 14px; }
.header p { font-size: 1rem; color: rgba(255,255,255,0.45); line-height: 1.7; }

.panel { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; }
.panel-desc { font-size: 0.9rem; color: rgba(255,255,255,0.45); margin-bottom: 20px; line-height: 1.6; }

.platforms { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.platform-tag { padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 500; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }

.url-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 0.95rem; outline: none; transition: border-color 0.2s; resize: none; line-height: 1.6; }
.url-input:focus { border-color: rgba(99,102,241,0.5); }
.url-input::placeholder { color: rgba(255,255,255,0.25); }

.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.btn-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 20px; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
.btn-action:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
.btn-action:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.btn-parse { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.4); color: #a5b4fc; }
.btn-download { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; }

.spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

.result-box { margin-top: 16px; padding: 12px 16px; border-radius: 10px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px; }
.progress-box { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; }
.error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }

.preview-box { margin-top: 16px; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.4); border: 1px solid rgba(99,102,241,0.3); }
.video-player { width: 100%; display: block; max-height: 360px; background: #000; }
.preview-success { padding: 10px 14px; font-size: 0.82rem; color: #6ee7b7; background: rgba(16,185,129,0.08); border-top: 1px solid rgba(16,185,129,0.2); }
</style>
