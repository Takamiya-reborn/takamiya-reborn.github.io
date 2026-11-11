<script setup lang="ts">
import type { Site } from '~/config/site'

const props = defineProps<{
  profile: Site['profile']
}>()

// 头像加载失败（如定时任务尚未生成 avatar.png）时回退为首字母占位
const avatarFailed = ref(false)
const avatarSrc = computed(() =>
  avatarFailed.value ? '' : props.profile.avatar,
)

// 鼠标在头像上方或附近时，头像朝鼠标方向的 3D 视角跟随
const MAX_TILT = 32 // 最大倾斜角度（deg）
const RANGE_FACTOR = 3.4 // 生效半径 = 头像尺寸 × 该系数，超出即回正
const tiltX = ref(0)
const tiltY = ref(0)
const zoneEl = ref<HTMLElement | null>(null)
const prefersReducedMotion = ref(false)

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function onTiltMove(e: PointerEvent) {
  if (prefersReducedMotion.value) return
  const zone = zoneEl.value
  if (!zone) return
  const rect = zone.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const dist = Math.hypot(dx, dy)
  const range = rect.width * RANGE_FACTOR
  if (dist > range) {
    resetTilt()
    return
  }
  // 强度包络：头像中心为 0，头像边缘达到峰值，向外线性衰减到生效半径处归零
  const peak = rect.width / 2
  const env = dist <= peak ? dist / peak : 1 - (dist - peak) / (range - peak)
  tiltY.value = (dx / dist) * env * MAX_TILT
  tiltX.value = (-dy / dist) * env * MAX_TILT
}

function resetTilt() {
  tiltX.value = 0
  tiltY.value = 0
}

const tiltStyle = computed(() => ({
  '--tilt-x': `${tiltX.value}deg`,
  '--tilt-y': `${tiltY.value}deg`,
}))

// rm -rf 彩蛋共享状态：nuked=真删（index.vue 据此卸载页面元素，终端自行 Teleport 悬浮）
const { nuked } = useNuke()

// 向下提示点击跳转：scrollIntoView 平滑滚动且不改 URL（同 Terminal/SideToc 的方式）
function scrollToQuote() {
  document.getElementById('quote')?.scrollIntoView()
}
</script>

<template>
  <section class="hero" @pointermove="onTiltMove" @pointerleave="resetTilt">
    <div v-reveal class="hero-main">
      <!-- 大标题已撤下视觉位置，保留 h1 供屏幕阅读器/搜索引擎识别 -->
      <h1 class="sr-only">{{ profile.name }}</h1>

      <!-- 交互终端组件：输出可滚动、可敲命令；rm -rf 后自行 Teleport 到 body 悬浮 -->
      <Terminal :name="profile.name" :location="profile.location" />
    </div>

    <div v-if="!nuked" v-reveal="{ delay: 150 }" class="hero-art">
      <div ref="zoneEl" class="avatar-zone" :style="tiltStyle">
        <span class="avatar-glow" aria-hidden="true" />
        <div class="avatar-ring">
          <span class="ring-spin" aria-hidden="true" />
          <img v-if="avatarSrc" :src="avatarSrc" :alt="profile.name" class="avatar" @error="avatarFailed = true" />
          <span v-else class="avatar avatar--initial">
            {{ profile.name.charAt(0).toUpperCase() }}
          </span>
        </div>
        <!-- 漂浮的游戏徽章 -->
        <span class="orbit orbit-1" aria-hidden="true">
          <Icon name="lucide:gamepad-2" size="18" />
        </span>
        <span class="orbit orbit-2" aria-hidden="true">
          <Icon name="lucide:ghost" size="18" />
        </span>
        <span class="orbit orbit-3" aria-hidden="true">
          <Icon name="lucide:swords" size="18" />
        </span>
      </div>

      <p class="avatar-bio">{{ profile.bio }}</p>
    </div>

    <button type="button" class="scroll-cue" aria-label="向下查看内容" @click="scrollToQuote">
      <!-- 手绘 7x8 像素 ▼（Press Start 2P 无此符号），1 单位 = 1 像素格 -->
      <svg class="scroll-cue-arrow" viewBox="0 0 8 8" aria-hidden="true" shape-rendering="crispEdges">
        <path d="M0 2h7v1h-7z M1 3h5v1h-5z M2 4h3v1h-3z M3 5h1v1h-1z" />
      </svg>
      <span>PRESS TO CONTINUE</span>
    </button>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: grid;
  /* 首屏占满一整屏，intro 独占 100vh（dvh 兼容移动端地址栏） */
  min-height: 100dvh;
  /* 与 QuoteCard 的 .quote-layout 同参：7fr/3fr + 同款列间距，终端列与 quote 卡严格等宽 */
  grid-template-columns: minmax(0, 7fr) minmax(0, 3fr);
  align-items: center;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  padding-block: clamp(4rem, 10vh, 6.5rem) clamp(2.5rem, 7vh, 4.5rem);
}

/* 街机待机式向下提示：Press Start 2P 像素字 + 手绘像素 ▼，整行同步硬闪烁 */
.scroll-cue {
  position: absolute;
  right: 50%;
  bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 1.25rem;
  color: var(--muted);
  font-family: var(--font-pixel);
  /* Press Start 2P 按 8px 网格设计，取整数倍字号保证像素格锐利 */
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  /* 重置 button 默认样式，只保留像素文字本身 */
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  transform: translateX(50%);
  transition: color 0.2s ease;
  animation: scroll-cue-blink 1.2s steps(1) infinite;
}

/* 像素箭头与文字同高：8 格 × 3px，整数倍缩放保证边缘干净 */
.scroll-cue-arrow {
  width: auto;
  height: 1.5rem;
  fill: var(--accent);
}

.scroll-cue:hover,
.scroll-cue:focus-visible {
  color: var(--accent);
  animation: none;
}

/* 视觉隐藏（仅辅助技术可读）：承载被撤下的大标题 h1 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---- 右侧头像区 ---- */
.hero-art {
  display: grid;
  place-items: center;
}

/* 头像下方的个人简介（原 hero 左列文案，终端上位置后迁到此处） */
.avatar-bio {
  max-width: 17rem;
  margin-top: 4rem;
  font-size: 0.88rem;
  line-height: 1.85;
  text-align: center;
  color: var(--muted);
}

.avatar-zone {
  position: relative;
  width: fit-content;
  transform: perspective(700px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  transition: transform 0.25s ease-out;
  will-change: transform;
}

.avatar-glow {
  position: absolute;
  inset: -3rem;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 28%, transparent), transparent);
  filter: blur(30px);
  pointer-events: none;
}

/* 旋转渐变光环头像 */
.avatar-ring {
  position: relative;
  width: clamp(8rem, 14vw, 11rem);
  aspect-ratio: 1;
}

.ring-spin {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
      var(--accent),
      var(--accent-2),
      var(--accent-3),
      var(--accent));
  animation: spin-slow 7s linear infinite;
}

.avatar {
  position: absolute;
  inset: 0.28rem;
  width: calc(100% - 0.56rem);
  height: calc(100% - 0.56rem);
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg);
}

.avatar--initial {
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 3.2rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}

/* 环绕头像漂浮的游戏徽章 */
.orbit {
  position: absolute;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  color: var(--accent-2);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  backdrop-filter: blur(8px);
  animation: bob 5s ease-in-out infinite alternate;
}

.orbit-1 {
  top: -0.6rem;
  right: -1.6rem;
  color: var(--accent-4);
  animation-delay: -1s;
}

.orbit-2 {
  bottom: 1.4rem;
  right: -2.4rem;
  color: var(--accent-3);
  animation-delay: -2.6s;
  animation-duration: 6.2s;
}

.orbit-3 {
  bottom: -0.9rem;
  left: -1.2rem;
  color: var(--accent-5);
  animation-delay: -4s;
}

@media (max-width: 56rem) {
  .hero {
    grid-template-columns: 1fr;
  }

  /* 窄屏单列堆叠：头像居中，与整页中轴对齐（桌面端靠右列自然居右） */
  .hero-art {
    order: -1;
    justify-items: center;
  }

  .avatar-bio {
    margin-top: 1.5rem;
  }
}

/* ---- 本组件专属关键帧 ---- */
@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

/* steps(1)：硬切换的街机式闪烁，不做淡入淡出 */
@keyframes scroll-cue-blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.15;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-cue {
    animation: none;
  }
}

/* bob 关键帧在 main.css 全局声明 */
</style>
