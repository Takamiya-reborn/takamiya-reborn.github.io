<script setup lang="ts">
import { site } from '~/config/site'
import type { Project } from '~/config/types'

const props = defineProps<{ projects: Project[] }>()

// 构建时注入的仓库数据里取最活跃的前 10 个，数据缺失时回退到静态配置
const { projects } = useGitHubProjects(
  site.profile.githubUser,
  props.projects,
  10,
)

// 卡带架滚动状态：两端可用性、当前卡带、是否溢出
const rail = ref<HTMLElement | null>(null)
const canPrev = ref(false)
const canNext = ref(false)
const scrollable = ref(false)
const dragging = ref(false)
const gliding = ref(false)

// 液态进度指示：液滴连续追踪滚动中心在点列上的映射位置，快移时拉长带尾
const dotsEl = ref<HTMLElement | null>(null)
const drop = ref<HTMLElement | null>(null)
const dropTail = ref<HTMLElement | null>(null)
let dropX = 0
let tailX = 0
let dropReady = false
let dropRaf = 0
// -1 起步，保证首帧就把白边挂到第一张上
let nearIdx = -1

// 拖拽位移超阈值视为滚屏，拦下随后的 click 防止误点卡片链接
let moved = false
let downX = 0
let downLeft = 0

// 惯性滑行：松手后按释放速度衰减滚动，新交互介入时终止
let glideId = 0
let velX = 0
let lastX = 0
let lastT = 0

function stopGlide() {
  cancelAnimationFrame(glideId)
  glideId = 0
  gliding.value = false
}

function startGlide(v: number) {
  const el = rail.value
  if (!el) return
  stopGlide()
  if (Math.abs(v) < 0.2) {
    settle()
    return
  }
  gliding.value = true
  let prev = performance.now()
  const step = (now: number) => {
    const dt = now - prev
    prev = now
    el.scrollLeft += v * dt
    v *= Math.pow(0.93, dt / 16.7)
    const max = el.scrollWidth - el.clientWidth
    if (Math.abs(v) < 0.05 || el.scrollLeft <= 0 || el.scrollLeft >= max) {
      glideId = 0
      // 速度耗尽不直接交还 snap（re-snap 是瞬跳），接力平滑吸附
      settle()
      return
    }
    glideId = requestAnimationFrame(step)
  }
  glideId = requestAnimationFrame(step)
}

// 平滑吸附：rAF 滚到最近卡带的居中位置，到位后再交还 snap，消除闪现
function settle() {
  const el = rail.value
  if (!el) return
  const cards = [...el.children] as HTMLElement[]
  const center = el.scrollLeft + el.clientWidth / 2
  let best: HTMLElement | undefined
  let bestDist = Infinity
  for (const c of cards) {
    const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  if (!best) return
  const target = best.offsetLeft - (el.clientWidth - best.offsetWidth) / 2
  if (Math.abs(target - el.scrollLeft) < 2) {
    gliding.value = false
    return
  }
  gliding.value = true
  const step = () => {
    const diff = target - el.scrollLeft
    if (Math.abs(diff) < 1) {
      el.scrollLeft = target
      glideId = 0
      gliding.value = false
      return
    }
    el.scrollLeft += diff * 0.25
    glideId = requestAnimationFrame(step)
  }
  glideId = requestAnimationFrame(step)
}

function measure() {
  const el = rail.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  scrollable.value = max > 4
  canPrev.value = el.scrollLeft > 4
  canNext.value = el.scrollLeft < max - 4
  if (scrollable.value) startDrop()
}

// 液滴主循环：头部快速追踪目标，尾巴慢半拍，速度映射成拉伸
function startDrop() {
  if (!dropRaf) dropRaf = requestAnimationFrame(dropStep)
}

function dropStep() {
  const head = drop.value
  const tail = dropTail.value
  const railEl = rail.value
  const pts = dotsEl.value?.querySelectorAll<HTMLElement>('.dot')
  if (!head || !tail || !railEl || !pts?.length) {
    dropRaf = 0
    return
  }
  const xs = [...pts].map((p) => p.offsetLeft + p.offsetWidth / 2)
  const cards = [...railEl.children] as HTMLElement[]
  const mids = cards.map((c) => c.offsetLeft + c.offsetWidth / 2)
  const center = railEl.scrollLeft + railEl.clientWidth / 2

  // 中间卡带连续放大 + 最近者挂白边（Switch 主屏风）
  const cardW = cards[0]?.offsetWidth || 1
  let near = 0
  let nd = Infinity
  cards.forEach((c, i) => {
    const d = Math.abs(mids[i]! - center)
    if (d < nd) {
      nd = d
      near = i
    }
    const f = Math.max(0, 1 - d / (cardW * 1.5))
    // 峰值 5%：半边超出 0.4rem，小于卡带间隙一半（0.5rem），不会挤到邻卡
    c.style.setProperty('--cart-s', (1 + f * 0.05).toFixed(4))
  })
  if (near !== nearIdx) {
    cards[nearIdx]?.classList.remove('cart--near')
    cards[near]?.classList.add('cart--near')
    nearIdx = near
  }
  // 视口中心在相邻卡带中点之间的连续插值，映射到点列坐标
  let tx = xs[0]!
  if (center >= mids[mids.length - 1]!) {
    tx = xs[xs.length - 1]!
  } else if (center > mids[0]!) {
    let i = 0
    while (i < mids.length - 2 && mids[i + 1]! < center) i++
    const f = (center - mids[i]!) / (mids[i + 1]! - mids[i]!)
    tx = xs[i]! + (xs[i + 1]! - xs[i]!) * f
  }
  if (!dropReady) {
    dropX = tx
    tailX = tx
    dropReady = true
    head.style.opacity = '1'
    tail.style.opacity = '0.45'
  }
  const v = (tx - dropX) * 0.22
  dropX += v
  tailX += (dropX - tailX) * 0.14
  const stretch = Math.min(Math.abs(v) / 10, 1)
  head.style.transform = `translate(${dropX - 5}px, -50%) scale(${1 + stretch}, ${1 - stretch * 0.35})`
  tail.style.transform = `translate(${tailX - 4}px, -50%)`
  // 收敛即停表省帧：滚动/拖拽必经 scroll → measure → startDrop 重新点火
  if (Math.abs(tx - dropX) < 0.1 && Math.abs(dropX - tailX) < 0.1) {
    dropRaf = 0
    return
  }
  dropRaf = requestAnimationFrame(dropStep)
}

function scrollToCard(i: number) {
  const el = rail.value
  if (!el) return
  stopGlide()
  const card = el.children[Math.max(0, Math.min(i, el.children.length - 1))] as
    | HTMLElement
    | undefined
  // 滚到卡带居中的位置，而非左对齐
  if (card) {
    el.scrollTo({
      left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }
}

// 点击卡带把它滚到中间；点在链接上的不拦，保留跳转
function onCartClick(i: number, e: MouseEvent) {
  if ((e.target as HTMLElement).closest('a')) return
  scrollToCard(i)
}

// 触摸/笔走原生滚动，只接管鼠标拖拽；惯性滑行无论输入类型都要先掐断
function onPointerDown(e: PointerEvent) {
  stopGlide()
  if (e.pointerType !== 'mouse' || !rail.value) return
  moved = false
  velX = 0
  downX = e.clientX
  lastX = e.clientX
  lastT = performance.now()
  downLeft = rail.value.scrollLeft
  dragging.value = true
}

// 拖拽监听挂 window 而非 setPointerCapture：捕获会把 click 重定向到 rail，卡带点击和链接跳转全废
function onWindowPointerMove(e: PointerEvent) {
  if (!dragging.value || !rail.value) return
  const dx = e.clientX - downX
  if (Math.abs(dx) > 4) moved = true
  rail.value.scrollLeft = downLeft - dx
  // 释放速度采样：屏幕位移换算成滚动方向，指数平滑去抖
  const now = performance.now()
  const dt = now - lastT
  if (dt > 0) {
    velX = velX * 0.8 + ((lastX - e.clientX) / dt) * 0.2
    lastX = e.clientX
    lastT = now
  }
}

function onWindowPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  startGlide(velX)
  // 松手在 rail 外时 click 不派发，moved 没机会被消费，定时清掉防吞下一次正常点击
  setTimeout(() => {
    moved = false
  }, 0)
}

// 系统打断的拖拽不会派发 click，moved 得手动清，否则吞掉下次正常点击
function onWindowPointerCancel() {
  if (!dragging.value) return
  moved = false
  dragging.value = false
}

function onClickCapture(e: MouseEvent) {
  if (moved) {
    e.preventDefault()
    e.stopPropagation()
    moved = false
  }
}

onMounted(() => {
  measure()
  startDrop()
  window.addEventListener('resize', measure)
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerCancel)
})

onUnmounted(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointercancel', onWindowPointerCancel)
  stopGlide()
  cancelAnimationFrame(dropRaf)
})

// pushed_at → 上次游玩文案；无数据（回退配置）或解析失败时返回 null 不渲染
function saveLabel(iso?: string) {
  if (!iso) return null
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000)
  if (Number.isNaN(days)) return null
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  if (days < 365) return `${Math.floor(days / 30)} 个月前`
  return `${Math.floor(days / 365)} 年前`
}

const saves = computed(() => projects.map((p) => saveLabel(p.pushedAt)))
</script>

<template>
  <div class="shelf">
    <div
      ref="rail"
      class="rail"
      :class="{
        'rail--dragging': dragging,
        'rail--gliding': gliding,
        'rail--fade-left': canPrev,
        'rail--fade-right': canNext,
      }"
      @pointerdown="onPointerDown"
      @scroll.passive="measure"
      @click.capture="onClickCapture"
      @dragstart.prevent
    >
      <article
        v-for="(project, i) in projects"
        :key="project.title"
        v-reveal="{ delay: i * 80 }"
        class="cart"
        @click="onCartClick(i, $event)"
      >
        <span class="groove" aria-hidden="true" />
        <header class="label">
          <span class="cart-icon">
            <Icon :name="project.icon" size="24" />
          </span>
          <h3 class="title">{{ project.title }}</h3>
        </header>

        <div class="body">
          <p v-if="project.description" class="desc">{{ project.description }}</p>
          <ul class="tags">
            <li v-for="tag in project.tags" :key="tag">
              <TagPill :label="tag" />
            </li>
          </ul>
        </div>

        <footer class="foot">
          <span v-if="saves[i]" class="save">
            <Icon name="lucide:save" size="13" />
            上次游玩 {{ saves[i] }}
          </span>
          <span v-else />
          <span class="links">
            <a v-if="project.repo" :href="project.repo" target="_blank" rel="noopener" aria-label="仓库" class="link">
              <Icon name="lucide:github" size="16" />
            </a>
            <a v-if="project.link" :href="project.link" target="_blank" rel="noopener" aria-label="演示" class="link">
              <Icon name="lucide:external-link" size="16" />
            </a>
          </span>
        </footer>
      </article>
    </div>

    <div v-if="scrollable" ref="dotsEl" class="dots">
      <button
        v-for="(project, i) in projects"
        :key="project.title"
        class="dot"
        :aria-label="`跳到第 ${i + 1} 张卡带`"
        @click="scrollToCard(i)"
      />
      <span ref="dropTail" class="drop-tail" aria-hidden="true" />
      <span ref="drop" class="drop" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.shelf {
  position: relative;
}

/* 纵向余量留给悬浮上抽和光晕，负 margin 找回占位 */
.rail {
  --fade: 28px;
  /* 卡带统一宽度，两端留白取 (视口 - 卡带) 的一半，首尾张也能滚到正中 */
  --cart-w: min(16rem, 78vw);
  /* 卡带 offsetLeft 的定位基准，滚动定位用它换算 */
  position: relative;
  display: flex;
  gap: 1rem;
  padding: 0.9rem calc((100% - var(--cart-w)) / 2) 2.4rem;
  margin: -0.9rem 0 -2.4rem;
  overflow-x: auto;
  overflow-y: hidden;
  /* 滚动条藏掉，浏览靠拖拽/滚轮/箭头/进度点 */
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  cursor: grab;
  --fade-l: 0px;
  --fade-r: 0px;
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 var(--fade-l),
    #000 calc(100% - var(--fade-r)),
    transparent 100%
  );
}

.rail--fade-left {
  --fade-l: var(--fade);
}

.rail--fade-right {
  --fade-r: var(--fade);
}

.rail--dragging {
  scroll-snap-type: none;
  cursor: grabbing;
  user-select: none;
}

/* 滑行期间同样关 snap，避免中途被吸到卡点上 */
.rail--gliding {
  scroll-snap-type: none;
}

/* WebKit 内核同样隐藏滚动条 */
.rail::-webkit-scrollbar {
  display: none;
}

.cart {
  position: relative;
  flex: 0 0 var(--cart-w);
  display: flex;
  flex-direction: column;
  min-height: 21rem;
  padding: 1.1rem 1.2rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  scroll-snap-align: center;
  /* 缩放由 rAF 逐帧写 --cart-s，hover 抬升走 --lift，合成一处避免互覆 */
  transform: translateY(var(--lift, 0px)) scale(var(--cart-s, 1));
  transition: border-color 0.25s;
}

/* 玻璃背景独立到 ::before：backdrop-filter 与悬浮位移同元素时文字会糊 */
.cart::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--surface);
  backdrop-filter: blur(12px);
  transition: background 0.25s;
}

/* 悬浮 = 抽卡带：只上抽 */
.cart:hover {
  --lift: -6px;
}

/* 最贴近视口中心的卡带：NS 式白边 */
.cart--near {
  border-color: color-mix(in srgb, var(--text) 80%, transparent);
}

.cart:hover::before {
  background: var(--surface-hover);
}

/* 卡带顶部的握持凹槽 */
.groove {
  width: 55%;
  height: 0.5rem;
  margin: 0 auto 0.9rem;
  background: repeating-linear-gradient(90deg, var(--border) 0 2px, transparent 2px 7px);
  border-radius: 999px;
}

.label {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
}

.cart-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  color: var(--accent);
  background: linear-gradient(135deg, var(--accent-soft), color-mix(in srgb, var(--accent-2) 10%, transparent));
  border: 1px solid var(--accent-border-faint);
  border-radius: var(--radius-sm);
  transition: transform 0.35s var(--ease-bouncy);
}

.cart:hover .cart-icon {
  transform: scale(1.1) rotate(-8deg);
}

.body {
  flex-grow: 1;
  min-width: 0;
}

.title {
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.desc {
  margin-top: 0.4rem;
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--muted);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.7rem;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);
}

.save {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
}

.links {
  display: flex;
  gap: 0.35rem;
}

.link {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.45rem;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s,
    transform 0.3s var(--ease-bouncy);
}

.link:hover {
  color: var(--accent-2);
  background: var(--accent-soft);
  border-color: var(--accent-border-2);
  transform: translateY(-2px);
}

/* 进度点列：点本身保持中性，液滴作为高亮在其上滑动 */
.dots {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin-top: 0.9rem;
}

.dot {
  position: relative;
  width: 1.2rem;
  height: 1.2rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.dot::before {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--border-strong);
  transition:
    transform 0.3s var(--ease-bouncy),
    background 0.2s;
}

.dot:hover::before {
  background: var(--accent-border);
  transform: scale(1.4);
}

/* 液滴头 + 拖尾：位置与拉伸由 rAF 直写，快速移动时被拉长 */
.drop,
.drop-tail {
  position: absolute;
  top: 50%;
  left: 0;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent);
  opacity: 0;
  pointer-events: none;
  will-change: transform;
}

.drop-tail {
  width: 8px;
  height: 8px;
}
</style>
