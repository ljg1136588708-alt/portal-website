<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const BACKEND = 'http://localhost:3001'

const activeTab = ref<'download' | 'remove'>('download')
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

// AI 去水印相关
const dragOver = ref(false)
const selectedFile = ref<File | null>(null)
const previewVideoUrl = ref('')
const isRemoving = ref(false)
const removeError = ref('')
const removeProgress = ref('')
const resultBlobUrl = ref('')
const resultFilename = ref('')

type Rect = { x: number; y: number; w: number; h: number }

// 画框选区（支持多个）
const canvasRef = ref<HTMLCanvasElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const selections = ref<Rect[]>([])
let drawing = false
let startX = 0, startY = 0
// 拖动已有选框
let dragMode: 'draw' | 'move' = 'draw'
let dragIdx = -1
let dragStartX = 0, dragStartY = 0
let selAtDragStart: Rect = { x: 0, y: 0, w: 0, h: 0 }

function hitTestIndex(pos: { x: number; y: number }): number {
  if (!videoRef.value || !canvasRef.value) return -1
  const { contentW, contentH, offsetX, offsetY } = getContentRect()
  const scaleX = contentW / videoRef.value.videoWidth
  const scaleY = contentH / videoRef.value.videoHeight
  for (let i = selections.value.length - 1; i >= 0; i--) {
    const s = selections.value[i]
    const rx = s.x * scaleX + offsetX, ry = s.y * scaleY + offsetY
    if (pos.x >= rx && pos.x <= rx + s.w * scaleX &&
        pos.y >= ry && pos.y <= ry + s.h * scaleY) return i
  }
  return -1
}

function removeSelection(i: number) {
  selections.value.splice(i, 1)
  redrawAll()
}

function onRightClick(e: MouseEvent) {
  e.preventDefault()
  const idx = hitTestIndex(getCanvasPos(e))
  if (idx >= 0) removeSelection(idx)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('video/')) loadVideoFile(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadVideoFile(file)
}

function saveResult() {
  if (!resultBlobUrl.value) return
  const a = document.createElement('a')
  a.href = resultBlobUrl.value
  a.download = resultFilename.value
  a.click()
}

function backToEdit() {
  URL.revokeObjectURL(resultBlobUrl.value)
  resultBlobUrl.value = ''
  resultFilename.value = ''
  removeProgress.value = ''
}

function loadVideoFile(file: File) {
  if (file.size > 500 * 1024 * 1024) {
    const mb = (file.size / 1024 / 1024).toFixed(0)
    removeError.value = locale.value === 'zh'
      ? `文件过大（${mb}MB），最大支持 500MB`
      : `File too large (${mb}MB), max 500MB`
    return
  }
  if (previewVideoUrl.value) URL.revokeObjectURL(previewVideoUrl.value)
  if (resultBlobUrl.value) URL.revokeObjectURL(resultBlobUrl.value)
  selectedFile.value = file
  previewVideoUrl.value = URL.createObjectURL(file)
  resultBlobUrl.value = ''
  resultFilename.value = ''
  selections.value = []
  removeError.value = ''
  removeProgress.value = ''
  isPlaying.value = false
}

function resetVideoFile() {
  if (previewVideoUrl.value) URL.revokeObjectURL(previewVideoUrl.value)
  if (resultBlobUrl.value) URL.revokeObjectURL(resultBlobUrl.value)
  selectedFile.value = null
  previewVideoUrl.value = ''
  resultBlobUrl.value = ''
  resultFilename.value = ''
  selections.value = []
  removeError.value = ''
  removeProgress.value = ''
  isPlaying.value = false
}

// 计算视频内容在 canvas 内的实际渲染区域（考虑黑边）
function getContentRect() {
  const video = videoRef.value!
  const canvas = canvasRef.value!
  const vw = video.videoWidth, vh = video.videoHeight
  const cw = canvas.width,     ch = canvas.height
  const videoAspect = vw / vh
  const containerAspect = cw / ch
  let contentW: number, contentH: number, offsetX: number, offsetY: number
  if (videoAspect < containerAspect) {
    // 竖屏：左右黑边
    contentH = ch
    contentW = ch * videoAspect
    offsetX = (cw - contentW) / 2
    offsetY = 0
  } else {
    // 横屏：上下黑边
    contentW = cw
    contentH = cw / videoAspect
    offsetX = 0
    offsetY = (ch - contentH) / 2
  }
  return { contentW, contentH, offsetX, offsetY }
}

function getCanvasPos(e: MouseEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function onMouseDown(e: MouseEvent) {
  const pos = getCanvasPos(e)
  const idx = hitTestIndex(pos)
  if (idx >= 0) {
    dragMode = 'move'; dragIdx = idx
    dragStartX = pos.x; dragStartY = pos.y
    selAtDragStart = { ...selections.value[idx] }
  } else {
    dragMode = 'draw'
    startX = pos.x; startY = pos.y
    drawing = true
  }
}

function onMouseMove(e: MouseEvent) {
  const pos = getCanvasPos(e)
  const canvas = canvasRef.value!

  if (dragMode === 'move' && dragIdx >= 0) {
    const video = videoRef.value!
    const { contentW, contentH } = getContentRect()
    const dx = Math.round((pos.x - dragStartX) / contentW * video.videoWidth)
    const dy = Math.round((pos.y - dragStartY) / contentH * video.videoHeight)
    selections.value[dragIdx] = {
      w: selAtDragStart.w, h: selAtDragStart.h,
      x: Math.max(0, Math.min(video.videoWidth  - selAtDragStart.w, selAtDragStart.x + dx)),
      y: Math.max(0, Math.min(video.videoHeight - selAtDragStart.h, selAtDragStart.y + dy)),
    }
    redrawAll()
    return
  }

  canvas.style.cursor = hitTestIndex(pos) >= 0 ? 'move' : 'crosshair'

  if (!drawing) return
  const ctx = canvas.getContext('2d')!
  redrawAll(ctx)
  const rx = Math.min(startX, pos.x), ry = Math.min(startY, pos.y)
  const rw = Math.abs(pos.x - startX), rh = Math.abs(pos.y - startY)
  drawRect(ctx, rx, ry, rw, rh, selections.value.length + 1)
}

function onMouseLeave() {
  if (dragMode === 'move') { dragMode = 'draw'; dragIdx = -1; return }
  if (!drawing) return
  drawing = false
  redrawAll()
}

function onMouseUp(e: MouseEvent) {
  if (dragMode === 'move') { dragMode = 'draw'; dragIdx = -1; return }
  if (!drawing) return
  drawing = false
  const video = videoRef.value!
  const pos = getCanvasPos(e)
  const { contentW, contentH, offsetX, offsetY } = getContentRect()
  const toVX = (cx: number) => Math.round((cx - offsetX) / contentW * video.videoWidth)
  const toVY = (cy: number) => Math.round((cy - offsetY) / contentH * video.videoHeight)
  const vx = Math.max(0, toVX(Math.min(startX, pos.x)))
  const vy = Math.max(0, toVY(Math.min(startY, pos.y)))
  const vw = Math.min(video.videoWidth  - vx, toVX(Math.max(startX, pos.x)) - vx)
  const vh = Math.min(video.videoHeight - vy, toVY(Math.max(startY, pos.y)) - vy)
  if (vw > 5 && vh > 5) selections.value.push({ x: vx, y: vy, w: vw, h: vh })
  redrawAll()
}

let resizeObserver: ResizeObserver | null = null

async function syncCanvasSize() {
  await nextTick()
  const canvas = canvasRef.value
  const video = videoRef.value
  if (!canvas || !video || !video.videoWidth) return
  const w = video.clientWidth, h = video.clientHeight
  if (canvas.width === w && canvas.height === h) return
  canvas.width = w
  canvas.height = h
  redrawAll()
}

async function onVideoLoaded() {
  await syncCanvasSize()
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(syncCanvasSize)
  if (videoRef.value) resizeObserver.observe(videoRef.value)
}

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (resultBlobUrl.value) URL.revokeObjectURL(resultBlobUrl.value)
  if (previewVideoUrl.value) URL.revokeObjectURL(previewVideoUrl.value)
})

function drawRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, label: number) {
  ctx.strokeStyle = '#f43f5e'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.strokeRect(rx, ry, rw, rh)
  ctx.fillStyle = 'rgba(244,63,94,0.15)'
  ctx.fillRect(rx, ry, rw, rh)
  ctx.setLineDash([])
  ctx.fillStyle = '#f43f5e'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText(String(label), rx + 5, ry + 15)
}

function redrawAll(ctx?: CanvasRenderingContext2D) {
  const canvas = canvasRef.value
  const video = videoRef.value
  if (!canvas || !video) return
  const c = ctx ?? canvas.getContext('2d')!
  c.clearRect(0, 0, canvas.width, canvas.height)
  const { contentW, contentH, offsetX, offsetY } = getContentRect()
  const scaleX = contentW / video.videoWidth
  const scaleY = contentH / video.videoHeight
  selections.value.forEach((s, i) => {
    drawRect(c, s.x * scaleX + offsetX, s.y * scaleY + offsetY, s.w * scaleX, s.h * scaleY, i + 1)
  })
}

const isPlaying = ref(false)

function togglePlay() {
  const video = videoRef.value
  if (!video) return
  if (video.paused) { video.play(); isPlaying.value = true }
  else { video.pause(); isPlaying.value = false }
}
function onVideoEnded() { isPlaying.value = false }

async function handleRemove() {
  if (!selectedFile.value || !selections.value.length) return

  isRemoving.value = true
  removeError.value = ''
  removeProgress.value = locale.value === 'zh' ? '正在处理，请耐心等待...' : 'Processing, please wait...'
  if (resultBlobUrl.value) URL.revokeObjectURL(resultBlobUrl.value)
  resultBlobUrl.value = ''
  resultFilename.value = ''

  try {
    const form = new FormData()
    form.append('video', selectedFile.value)
    form.append('regions', JSON.stringify(selections.value))

    const res = await fetch(`${BACKEND}/api/remove-watermark`, { method: 'POST', body: form })
    if (!res.ok) {
      let msg = '处理失败'
      try { msg = (await res.json()).error || msg } catch {}
      throw new Error(msg)
    }

    const blob = await res.blob()
    resultFilename.value = `no_watermark_${Date.now()}.mp4`
    resultBlobUrl.value = URL.createObjectURL(blob)
    removeProgress.value = locale.value === 'zh' ? '✅ 处理完成，可预览后保存' : '✅ Done! Preview and save below.'
  } catch (e: any) {
    removeError.value = e.message || '处理失败'
    removeProgress.value = ''
  } finally {
    isRemoving.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- Nav -->
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

    <!-- Main -->
    <main class="main">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>

      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="badge">✂️ {{ locale === 'en' ? 'Free Tool' : '免费工具' }}</div>
          <h1>{{ locale === 'en' ? 'Video Watermark Remover' : '视频去水印' }}</h1>
          <p>{{ locale === 'en'
            ? 'Download watermark-free videos from Douyin, Kuaishou, Bilibili and more — or remove burned-in watermarks using AI.'
            : '无水印下载抖音、B站视频，或用 AI 抹除已烧入的水印。'
          }}</p>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'download' }"
            @click="activeTab = 'download'"
          >
            <span>⬇️</span>
            {{ locale === 'en' ? 'Download (No Watermark)' : '无水印下载' }}
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'remove' }"
            @click="activeTab = 'remove'"
          >
            <span>🪄</span>
            {{ locale === 'en' ? 'AI Remove Watermark' : 'AI 去除水印' }}
          </button>
        </div>

        <!-- Panel: Download -->
        <div v-if="activeTab === 'download'" class="panel">
          <div class="panel-desc">
            {{ locale === 'en'
              ? 'Paste a share link from Douyin or Bilibili.'
              : '粘贴抖音或 B 站的视频分享链接。'
            }}
          </div>

          <div class="platforms">
            <span class="platform-tag">抖音</span>
            <span class="platform-tag">B站</span>
          </div>

          <div class="input-row">
            <textarea
              v-model="url"
              class="url-input"
              rows="3"
              :placeholder="locale === 'en' ? 'Paste video share link here...' : '粘贴视频分享链接…'"
              @keydown.enter.prevent="handleParse"
              @input="resetState"
            ></textarea>
          </div>

          <!-- 解析中进度 -->
          <div v-if="progress" class="result-box progress-box">
            <span class="spinner-sm"></span>
            {{ progress }}
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="result-box error-box">
            ❌ {{ error }}
          </div>

          <!-- 解析成功：视频预览 -->
          <div v-if="streamUrl" class="preview-box">
            <video
              :src="streamUrl"
              controls
              class="video-player"
              preload="metadata"
            ></video>
            <div class="preview-success">✅ {{ locale === 'en' ? 'Parsed successfully — ready to download' : '解析成功，可播放预览' }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-row">
            <button
              class="btn-action btn-parse"
              @click="handleParse"
              :disabled="isParsing || !url.trim()"
            >
              <span v-if="isParsing" class="spinner-sm"></span>
              <span v-else>🔍</span>
              {{ locale === 'en' ? 'Parse' : '解析' }}
            </button>
            <button
              class="btn-action btn-download"
              @click="handleDownload"
              :disabled="!parsedToken || isDownloading"
            >
              <span v-if="isDownloading" class="spinner-sm"></span>
              <span v-else>⬇️</span>
              {{ locale === 'en' ? 'Download' : '下载' }}
            </button>
          </div>
        </div>

        <!-- Panel: AI Remove -->
        <div v-if="activeTab === 'remove'" class="panel">
          <div class="panel-desc">
            {{ locale === 'en'
              ? 'Upload a video, drag to select the watermark region, then click Remove.'
              : '上传视频后，在视频上拖拽框选水印区域，再点击去除。'
            }}
          </div>

          <!-- 未上传：拖拽区域 -->
          <div v-if="!selectedFile"
            class="dropzone"
            :class="{ 'drag-over': dragOver }"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            @click="($refs.fileInput as HTMLInputElement).click()"
          >
            <input ref="fileInput" type="file" accept="video/*" style="display:none" @change="onFileChange" />
            <div class="drop-icon">🎬</div>
            <div class="drop-text">{{ locale === 'en' ? 'Drag & drop video here, or click to select' : '拖放视频到这里，或点击选择文件' }}</div>
            <div class="drop-hint">MP4, MOV, AVI, MKV · 最大 500MB</div>
          </div>

          <!-- 已上传：视频预览 + 画框 -->
          <div v-if="selectedFile" class="video-editor">
            <!-- 框选提示和标签：结果状态下隐藏 -->
            <template v-if="!resultBlobUrl">
              <div class="video-editor-hint">
                {{ selections.length ? `✅ 已框选 ${selections.length} 处 — 右键点击选框可删除` : '👆 拖拽框选水印区域，可框选多处' }}
              </div>
              <div v-if="selections.length" class="sel-chips">
                <span v-for="(s, i) in selections" :key="i" class="sel-chip">
                  {{ locale === 'zh' ? '区域' : 'Region' }}{{ i + 1 }}
                  <button class="sel-chip-del" @click="removeSelection(i)">×</button>
                </span>
              </div>
            </template>

            <div class="video-canvas-wrap">
              <!-- 同一个播放器：原视频 / 处理结果 共用，有结果时展示结果 -->
              <video
                ref="videoRef"
                :src="resultBlobUrl || previewVideoUrl"
                class="editor-video"
                @loadedmetadata="onVideoLoaded"
                @ended="onVideoEnded"
              ></video>
              <button class="play-btn" @click="togglePlay">
                <span v-if="isPlaying">⏸</span>
                <span v-else>▶</span>
              </button>
              <!-- canvas 仅编辑时可见，v-show 保留 DOM 避免 ref 失效 -->
              <canvas
                v-show="!resultBlobUrl"
                ref="canvasRef"
                class="editor-canvas"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseup="onMouseUp"
                @mouseleave="onMouseLeave"
                @contextmenu.prevent="onRightClick"
              ></canvas>
            </div>

            <!-- 结果操作栏 -->
            <div v-if="resultBlobUrl" class="result-action-bar">
              <button class="btn-action btn-download" style="flex:1;padding:11px" @click="saveResult">
                ⬇️ {{ locale === 'zh' ? '保存视频' : 'Save Video' }}
              </button>
              <button class="reselect-btn" style="flex:1;text-align:center" @click="backToEdit">
                ✏️ {{ locale === 'zh' ? '重新编辑' : 'Re-edit' }}
              </button>
            </div>

            <button v-if="!resultBlobUrl" class="reselect-btn" @click="resetVideoFile">
              🔄 {{ locale === 'zh' ? '重新选择视频' : 'Choose another video' }}
            </button>
          </div>

          <!-- 进度 / 错误 -->
          <div v-if="removeProgress" class="result-box" :class="removeProgress.startsWith('✅') ? 'success-box' : 'progress-box'">
            <span v-if="isRemoving" class="spinner-sm"></span>
            {{ removeProgress }}
          </div>
          <div v-if="removeError" class="result-box error-box">❌ {{ removeError }}</div>

          <!-- 去除按钮（结果状态下隐藏） -->
          <button
            v-if="!resultBlobUrl"
            class="btn-action btn-download"
            style="width:100%;margin-top:16px;padding:14px;"
            @click="handleRemove"
            :disabled="isRemoving || !selectedFile || !selections.length"
          >
            <span v-if="isRemoving" class="spinner-sm"></span>
            <span v-else>🪄</span>
            {{ isRemoving ? (locale === 'zh' ? '处理中...' : 'Processing...') : (locale === 'zh' ? '去除水印' : 'Remove Watermark') }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.page {
  background: #080a0f;
  color: #e8eaf0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
}

/* Nav */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 40px; height: 64px;
  display: flex; align-items: center;
  background: rgba(8,10,15,0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.nav-inner { width: 100%; display: flex; align-items: center; gap: 0; }
.logo {
  display: flex; align-items: center; gap: 10px;
  font-size: 1.1rem; font-weight: 700; color: #fff;
  text-decoration: none; flex-shrink: 0;
}
.nav-tools { display: flex; align-items: center; gap: 4px; flex: 1; padding: 0 32px; }
.nav-tool-link {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 8px;
  font-size: 0.88rem; font-weight: 500;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
  border: 1px solid transparent;
}
.nav-tool-link.active {
  color: #a5b4fc;
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.25);
}
.lang-btn {
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc; border-radius: 6px;
  padding: 4px 12px; font-size: 0.8rem;
  cursor: pointer; flex-shrink: 0;
}

/* Main */
.main {
  padding-top: 64px; min-height: 100vh;
  display: flex; align-items: center;
  justify-content: center; position: relative;
  overflow: hidden;
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.25; }
.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, transparent); top: -50px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #06b6d4, transparent); bottom: -50px; right: -80px; }

.container {
  position: relative; z-index: 1;
  width: 100%; max-width: 720px;
  padding: 60px 24px;
}

/* Header */
.header { text-align: center; margin-bottom: 40px; }
.badge {
  display: inline-block; padding: 6px 16px;
  border: 1px solid rgba(99,102,241,0.4); border-radius: 100px;
  font-size: 0.8rem; color: #a5b4fc; margin-bottom: 20px;
  background: rgba(99,102,241,0.08);
}
.header h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800; color: #fff;
  letter-spacing: -0.03em; margin-bottom: 14px;
}
.header p { font-size: 1rem; color: rgba(255,255,255,0.45); line-height: 1.7; }

/* Tabs */
.tabs { display: flex; gap: 8px; margin-bottom: 24px; }
.tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 20px; border-radius: 10px;
  font-size: 0.9rem; font-weight: 500; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.45);
  transition: all 0.2s;
}
.tab:hover { color: #fff; border-color: rgba(255,255,255,0.15); }
.tab.active {
  background: rgba(99,102,241,0.12);
  border-color: rgba(99,102,241,0.4);
  color: #a5b4fc;
}

/* Panel */
.panel {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 32px;
}
.panel-desc { font-size: 0.9rem; color: rgba(255,255,255,0.45); margin-bottom: 20px; line-height: 1.6; }

/* Platforms */
.platforms { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.platform-tag {
  padding: 4px 12px; border-radius: 100px;
  font-size: 0.8rem; font-weight: 500;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
}

/* Input */
.input-row { display: flex; gap: 10px; }
.url-input {
  flex: 1; padding: 12px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; color: #fff;
  font-size: 0.95rem; outline: none;
  transition: border-color 0.2s;
}
.url-input:focus { border-color: rgba(99,102,241,0.5); }
.url-input::placeholder { color: rgba(255,255,255,0.25); }
textarea.url-input { resize: none; line-height: 1.6; }

/* Action buttons */
.action-row {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; margin-top: 16px;
}
.btn-action {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 20px; border: none; border-radius: 10px;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.btn-action:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
.btn-action:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.btn-parse {
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.4);
  color: #a5b4fc;
}
.btn-download {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
}

/* Primary button (AI tab) */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; border-radius: 10px;
  font-size: 0.95rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s;
  white-space: nowrap; min-width: 90px;
}
.btn-primary:hover:not(:disabled) { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary.full { width: 100%; margin-top: 20px; padding: 14px; }
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.spinner-sm {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Result boxes */
.result-box {
  margin-top: 16px; padding: 12px 16px;
  border-radius: 10px; font-size: 0.88rem;
  display: flex; align-items: center; gap: 8px;
}
.progress-box {
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.25);
  color: #a5b4fc;
}
.error-box {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #fca5a5;
}
.result-action-bar {
  display: flex; gap: 8px; margin-top: 10px;
}
.success-box {
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.25);
  color: #6ee7b7;
}

/* Video preview */
.preview-box {
  margin-top: 16px;
  border-radius: 12px; overflow: hidden;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(99,102,241,0.3);
}
.video-player {
  width: 100%; display: block;
  max-height: 360px; background: #000;
}
.preview-success {
  padding: 10px 14px;
  font-size: 0.82rem; color: #6ee7b7;
  background: rgba(16,185,129,0.08);
  border-top: 1px solid rgba(16,185,129,0.2);
}

/* Video editor */
.video-editor { margin-top: 4px; }
.video-editor-hint {
  font-size: 0.83rem; color: #a5b4fc;
  margin-bottom: 10px; text-align: center;
}
.video-canvas-wrap {
  position: relative; display: inline-block;
  width: 100%; border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(99,102,241,0.3);
  background: #000;
}
.editor-video {
  width: 100%; display: block;
  max-height: 340px; pointer-events: none;
}
.editor-canvas {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  cursor: crosshair;
}
.play-btn {
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.25);
  color: #fff; border-radius: 50%; width: 40px; height: 40px;
  font-size: 1rem; cursor: pointer; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.play-btn:hover { background: rgba(0,0,0,0.8); }
.sel-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.sel-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px 3px 10px; border-radius: 100px;
  background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.35);
  color: #fca5a5; font-size: 0.78rem;
}
.sel-chip-del {
  background: none; border: none; color: #fca5a5;
  cursor: pointer; font-size: 0.9rem; line-height: 1;
  padding: 0 2px; opacity: 0.7;
}
.sel-chip-del:hover { opacity: 1; }
.reselect-btn {
  margin-top: 10px; background: none;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.4); border-radius: 8px;
  padding: 6px 14px; font-size: 0.8rem; cursor: pointer;
}
.reselect-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

/* Dropzone */
.dropzone {
  border: 2px dashed rgba(255,255,255,0.12);
  border-radius: 12px; padding: 48px 24px;
  text-align: center; cursor: pointer;
  transition: all 0.2s; margin-bottom: 20px;
}
.dropzone:hover, .dropzone.drag-over {
  border-color: rgba(99,102,241,0.5);
  background: rgba(99,102,241,0.05);
}
.dropzone.has-file { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.06); }
.drop-icon { font-size: 2.5rem; margin-bottom: 12px; }
.drop-text { font-size: 0.95rem; color: rgba(255,255,255,0.6); margin-bottom: 6px; }
.drop-hint { font-size: 0.8rem; color: rgba(255,255,255,0.3); }

/* Info cards */
.info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 4px; }
.info-card {
  display: flex; align-items: center; gap: 10px;
  padding: 14px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
}
.info-icon { font-size: 1.3rem; flex-shrink: 0; }
.info-card div { display: flex; flex-direction: column; gap: 2px; }
.info-card strong { font-size: 0.8rem; color: #fff; font-weight: 600; }
.info-card span { font-size: 0.72rem; color: rgba(255,255,255,0.35); }

</style>
