<script setup lang="ts">
// 全站加载屏：进度条本体。真实就绪信号（window load + 字体就绪）放行走完，
// 走到 100% 后 emit('done')，由父层（app.vue）切到正文渲染——
// 加载期间正文不进 DOM，页面无可滚动内容，天然不需要滚动锁
const emit = defineEmits<{ done: [] }>()

const progress = ref(0)
// 真实就绪信号：window load（JS 包等声明资源下载完）+ 字体就绪
const done = ref(false)

// rAF 循环与兜底定时器句柄，卸载时统一清理
let raf = 0
let watchdogTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  const loadDone = new Promise<void>((resolve) => {
    if (document.readyState === 'complete') return resolve()
    window.addEventListener('load', () => resolve(), { once: true })
  })
  // 个别资源挂起时 load 可能迟迟不来：20s 强制放行，加载屏不无限扣人
  const watchdog = new Promise<void>((resolve) => {
    watchdogTimer = setTimeout(resolve, 20000)
  })
  Promise.race([Promise.all([loadDone, document.fonts?.ready ?? null]), watchdog]).then(
    () => (done.value = true),
  )
  raf = requestAnimationFrame(loop)
})

// 假进度：渐近逼近上限（未就绪 90%、就绪后 100%），起步快、越近越慢，
// 观感接近真实下载曲线；真实信号只决定何时放开 100%
function loop() {
  const cap = done.value ? 100 : 90
  progress.value = Math.min(cap, progress.value + (cap - progress.value) * (done.value ? 0.18 : 0.045))
  if (done.value && progress.value >= 99.5) {
    progress.value = 100
    emit('done')
    return
  }
  raf = requestAnimationFrame(loop)
}

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimeout(watchdogTimer)
})
</script>

<template>
  <div class="app-loader" aria-hidden="true">
    <div class="loader-box">
      <p class="loader-title">NOW LOADING</p>
      <div class="loader-bar">
        <span class="loader-fill" :style="{ width: `${progress}%` }" />
      </div>
      <p class="loader-percent">{{ Math.floor(progress) }}%</p>
    </div>
  </div>
</template>

<style scoped>
/* 盖在最上层：header、悬浮按钮、涟漪特效全压在下面 */
.app-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  background:
    radial-gradient(ellipse 60% 40% at 50% 38%, var(--accent-soft), transparent 70%),
    var(--bg);
  /* JS 失效兜底：45s 后自行淡出，不把游客锁死在加载屏 */
  animation: loader-fallback 0.6s ease 45s forwards;
}

@keyframes loader-fallback {
  to {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
}

.loader-box {
  display: grid;
  justify-items: center;
  gap: 1.8rem;
}

.loader-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.05rem;
  letter-spacing: 0.45em;
  /* 补回最后一个字母的右侧字距，视觉居中 */
  margin-right: -0.45em;
  color: var(--muted);
}

.loader-bar {
  width: min(70vw, 480px);
  height: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
}

/* 渐变进度：跟随 --gradient，带主题辉光 */
.loader-fill {
  position: relative;
  display: block;
  height: 100%;
  background: var(--gradient);
  box-shadow: var(--glow);
  border-radius: inherit;
  /* 宽度变化走过渡，水合前进度纹丝不动时靠 sheen 动画示意"正在干活" */
  transition: width 0.25s var(--ease-out);
  /* 水合前 JS 还没跑，扫光先替进度条动起来 */
  animation: loader-sheen 1.2s ease-in-out infinite;
}

/* 填充段纹理：流动的细斜纹（barber-pole），暗示进度在走 */
.loader-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(-45deg,
      rgba(255, 255, 255, 0.2) 25%,
      transparent 25% 50%,
      rgba(255, 255, 255, 0.2) 50% 75%,
      transparent 75%);
  /* 位移量必须等于 background-size 的边长，斜纹才能无缝循环 */
  background-size: 40px 40px;
  animation: loader-stripes 1.4s linear infinite;
}

@keyframes loader-stripes {
  to {
    background-position: 40px 0;
  }
}

@keyframes loader-sheen {

  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

.loader-percent {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1rem;
  letter-spacing: 0.2em;
  margin-right: -0.2em;
  color: var(--accent-2);
}

/* 系统开了"减少动态效果"：去掉扫光和条纹流动 */
@media (prefers-reduced-motion: reduce) {
  .loader-fill {
    animation: none;
  }

  .loader-fill::after {
    animation: none;
  }
}
</style>
