<script setup lang="ts">
import type { Quote } from '~/config/types'

// quote 抽取器：外壳在 Switch，这里只负责屏幕内容（quote）和真实按键
const { quotes, draw } = useQuotes()
// 屏幕背景轮换：Y 位键循环切换，列表末尾再切回默认黑屏
const { bgs: screenBgs, current: screenBg, next: nextScreenBg } = useScreenBgs()

// 初始句子：直接取第一条，SSG/SSR 阶段就渲染出真 quote，慢网络下
// 不会先闪"还没有收录"占位文案；随机性留给骰子，挂载时不再额外抽取
const current = ref<Quote | undefined>(quotes[0])
// 抽取次数：作为 blockquote 的 key 驱动换句，key 变化重新挂载就会重放浮现动画
const drawCount = ref(0)
// 浮现期间锁死按钮，整句浮现完再允许下一次抽取
const rolling = ref(false)
// 复制反馈：图标切成对勾、提示换成已复制，1.5s 后复原
const copied = ref(false)

// 浮现总时长：行间错开 0.18s，每行 0.6s，与句子长短无关
const REVEAL_MS = 1000

// 横向滑动容器：整机锁设计宽度，窄屏左右滑动查看（与技能板同款）
const viewport = ref<HTMLElement>()

// 主句：有原文用原文，没有则译文顶上
function mainOf(quote: Quote) {
  return quote.text || quote.translation || ''
}

// 署名作者：原名为主，译名附在英文括号里；无原名时译名直接作为署名
function authorOf(quote: Quote) {
  if (quote.author) {
    return quote.authorTranslation ? `${quote.author}(${quote.authorTranslation})` : quote.author
  }
  return quote.authorTranslation ?? ''
}

// 连同破折号和出处的完整署名
function fromOf(quote: Quote) {
  const author = authorOf(quote)
  if (!author && !quote.source) return ''
  return `—— ${author}${quote.source ? `·${quote.source}` : ''}`
}

const mainText = computed(() => (current.value ? mainOf(current.value) : ''))
const fromLine = computed(() => (current.value ? fromOf(current.value) : ''))

// 把当前这句连同作者丢给搜索引擎，找原文出处
const searchUrl = computed(() => {
  const quote = current.value
  if (!quote) return undefined
  const author = authorOf(quote)
  const query = author ? `${mainOf(quote)} ${author}` : mainOf(quote)
  return `https://www.bing.com/search?q=${encodeURIComponent(query)}`
})

// 连同译文和署名的完整文案，复制出去即可直接分享
const copyText = computed(() => {
  const quote = current.value
  if (!quote) return ''
  return [mainOf(quote), quote.text ? quote.translation : '', fromOf(quote)]
    .filter(Boolean)
    .join('\n')
})

async function copy() {
  if (!current.value || copied.value) return
  try {
    await navigator.clipboard.writeText(copyText.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // 剪贴板不可用（非安全上下文等）：静默失败，不给成功反馈
  }
}

function next() {
  if (rolling.value) return
  const quote = draw()
  if (!quote) return
  rolling.value = true
  current.value = quote
  drawCount.value++
  // 浮现由 CSS 动画驱动，这里只按总时长解锁按钮
  setTimeout(() => (rolling.value = false), REVEAL_MS)
}

onMounted(() => {
  // 窄屏下容器装不下整机：初始滚到屏幕居中（桌面端无滚动，是 no-op）
  const vp = viewport.value
  if (vp) vp.scrollLeft = (vp.scrollWidth - vp.clientWidth) / 2
})
</script>

<template>
  <div ref="viewport" class="switch-viewport">
    <!-- 游戏机：外壳架构在 Switch，这里注入屏幕内容和真实按键 -->
    <Switch>
      <template #screen>
        <!-- 屏幕：quote 卡片，16:9 锁定比例，高度随 48rem 设计宽自然定死 -->
        <BaseCard class="quote-card screen" :hover="false" :spotlight="false">
          <!-- 屏幕背景：登记在 screen-bgs.json 的图 + 压暗层，Y 位键切换；
            垫在内容之下（z -1 与液晶底色同层，靠 DOM 顺序盖住它） -->
          <div v-if="screenBg" class="screen-bg" aria-hidden="true"
            :style="{ backgroundImage: `url(${screenBg.src})`, '--bg-dim': screenBg.dim ?? 0.45 }" />
          <!-- 屏幕玻璃：斜向反光 + 扫描线，浮在文字上但不挡交互 -->
          <span class="screen-glass" aria-hidden="true" />

          <div class="quote-stage">
            <Transition name="quote-swap" mode="out-in">
              <blockquote v-if="current" :key="drawCount" class="quote-body">
                <Icon name="lucide:quote" size="26" class="quote-mark" />
                <p v-if="mainText" class="quote-text reveal" style="--i: 0">{{ mainText }}</p>
                <p v-if="current.text && current.translation" class="quote-translation reveal" style="--i: 1">
                  {{ current.translation }}</p>
                <footer v-if="fromLine" class="quote-from reveal" style="--i: 2">{{ fromLine }}</footer>
              </blockquote>
              <p v-else :key="'empty'" class="quote-empty">quotes.json 还没有收录 quote</p>
            </Transition>
          </div>
        </BaseCard>
      </template>

      <template #controls>
        <!-- 真实按键：照真机右 Joy-Con 的 YXAB 菱形排布（X 上 / Y 左 / A 右 / B 下），
          骰子=X、搜索=A、复制=B，Y 位留一枚空键撑住菱形；提示走原生 title -->
        <div class="quote-actions">
          <!-- Y 位：切换屏幕背景，循环含"默认黑屏" -->
          <button class="quote-roll quote-roll--ghost" type="button"
            :title="screenBg ? `背景 · ${screenBg.name}` : '切换屏幕背景'" :disabled="screenBgs.length === 0"
            @click="nextScreenBg">
            <Icon name="lucide:image" size="20" />
          </button>
          <div class="quote-action quote-action--x">
            <button class="quote-roll" type="button" title="点骰子抽取" :disabled="quotes.length === 0 || rolling"
              @click="next">
              <Icon name="lucide:dices" size="22" />
            </button>
          </div>
          <div v-if="searchUrl" class="quote-action quote-action--a">
            <a class="quote-roll" :href="searchUrl" target="_blank" rel="noopener" title="没听说过？">
              <Icon name="lucide:search" size="20" />
            </a>
          </div>
          <div v-if="current" class="quote-action quote-action--b">
            <button class="quote-roll" type="button" :title="copied ? '已复制' : '好句子，带走'" @click="copy">
              <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" size="20" />
            </button>
          </div>
        </div>
      </template>
    </Switch>
  </div>
  <!-- 与技能板同款滑动提示：只在容器装不下整机时出现 -->
  <p class="scroll-hint" aria-hidden="true">← 左右滑动查看整机 →</p>
</template>

<style scoped>
.quote-card {
  display: flex;
  /* 屏幕定宽居中，多余宽度全给两侧按键列，按键视觉上贴向屏幕 */
  flex: 0 1 48rem;
  min-width: 0;
  padding: 3.5rem 3rem;
}

/* 屏幕：凹进机身的液晶屏，换掉卡片外阴影，改用内阴影压出凹陷。
   配色引用 Switch 挂在 .console 上的固定色板，不随主题切换 */
.quote-card.screen {
  /* BaseCard 默认 height: 100% 会吞掉上下机身边，改回内容高；
     高度不量了：16:9 锁定比例，宽随 flex-basis 48rem、高按比例反推，
     长短句都在固定屏幕里垂直居中，溢出的极端长句按真机屏幕一样裁掉 */
  height: auto;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  align-self: center;
  border-color: rgba(255, 255, 255, 0.08);
  /* 真机屏幕是直角嵌进机身的 */
  border-radius: 0;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 0.9rem 2.2rem rgba(0, 0, 0, 0.38);
}

/* 屏幕背景层：图片盖住液晶底色，dim 压暗保文字可读；玻璃层仍在其上。
   z -1 与 .card-bg 同层，靠 DOM 顺序垫在内容之下 */
.screen-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-size: cover;
  background-position: center;
}

.screen-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #000;
  opacity: var(--bg-dim, 0.45);
}

/* 液晶底色：纯黑，顶部透一点霓虹蓝背光 */
.quote-card.screen :deep(.card-bg) {
  backdrop-filter: none;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(0, 194, 219, 0.08), transparent 60%),
    var(--jc-screen);
}

/* 屏幕玻璃：斜向反光 + 扫描线，浮在文字上但不挡交互 */
.screen-glass {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.05), transparent 45%),
    repeating-linear-gradient(0deg,
      rgba(255, 255, 255, 0.03) 0 1px,
      transparent 1px 4px);
}

/* quote 舞台：撑满屏幕，长短句都在屏幕里垂直居中 */
.quote-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quote-body {
  position: relative;
  margin: 0;
  padding-left: 2.4rem;
  /* 纵向撑满舞台，正文垂直居中，署名跟在正文之后右对齐 */
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quote-mark {
  position: absolute;
  left: 0;
  top: 0.2rem;
  color: var(--jc-blue);
  opacity: 0.7;
}

.quote-text {
  font-family: var(--font-display);
  font-size: 1.3rem;
  line-height: 1.75;
  color: var(--jc-text);
  min-height: 1em;
  /* 保留 quote 文案里的手动换行（如诗句按联断行），自然换行照旧由浏览器处理 */
  white-space: pre-line;
}

/* 补充译文：跟在主句下面，弱化处理 */
.quote-translation {
  margin-top: 0.45rem;
  font-size: 0.88rem;
  line-height: 1.7;
  font-style: italic;
  color: var(--jc-muted);
  opacity: 0.85;
}

.quote-from {
  margin-top: 2rem;
  align-self: flex-end;
  text-align: right;
  font-size: 0.85rem;
  color: var(--jc-muted);
}

/* 浮现：每行从左侧轻轻滑入并淡现，行与行按阅读顺序错开，时长与句子长短无关 */
.reveal {
  opacity: 0;
  animation: quote-reveal 0.6s ease-out forwards;
  animation-delay: calc(var(--i) * 0.18s);
}

@keyframes quote-reveal {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* 系统开了"减少动态效果"就直接显示 */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
    opacity: 1;
  }
}

.quote-empty {
  align-self: center;
  font-size: 0.9rem;
  color: var(--jc-muted);
}

.quote-roll {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  color: var(--jc-text);
  /* 实体按键：凸起的纯黑塑料圆钮，顶部高光 + 底部投影 */
  background: #0a0b0d;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -0.12rem 0.25rem rgba(0, 0, 0, 0.28);
  transition:
    color 0.2s,
    border-color 0.2s,
    box-shadow 0.25s,
    transform 0.15s;
}

.quote-roll:active {
  /* 按下：键帽沉下去，投影收拢 */
  transform: translateY(0.15rem);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0.15rem 0.4rem rgba(0, 0, 0, 0.4);
}

.quote-roll:disabled {
  /* 禁用只锁点击，外观不变（降透明度会让霓虹底色透上来） */
  cursor: not-allowed;
}

/* 按键菱形排布：三枚实体键 + Y 位空键，格位固定住，v-if 缺员也不塌 */
/* 按键菱形排布：三枚实体键 + Y 位空键，格位固定住，v-if 缺员也不塌。
   格子故意比按键小（2.5rem < 2.8rem），按键居中溢出格子——
   菱形里相邻键都是对角相邻，圆心距 = 格子 × √2，缩格子才能真正贴近 */
.quote-actions {
  display: grid;
  grid-template-columns: repeat(3, 2.1rem);
  grid-template-rows: repeat(3, 2.1rem);
  gap: 0;
}

/* 包裹层用 grid 居中：flex 会把超宽的按钮压缩成椭圆（flex-shrink），
   grid 只让按钮溢出格子、保持 2.8rem 正圆 */
.quote-action {
  display: grid;
  place-items: center;
}

.quote-action--x {
  grid-area: 1 / 2;
}

.quote-action--a {
  grid-area: 2 / 3;
}

.quote-action--b {
  grid-area: 3 / 2;
}

/* Y 位键：占位（之后接切换屏幕背景），样式与实体键一致 */
.quote-roll--ghost {
  grid-area: 2 / 1;
}

/* ---- 横向滑动容器：桌面端内容放得下、不产生滚动条，窄屏左右滑动看整机 ----
   纵轴显式锁死并让出投影空间：overflow-x 单轴 auto 会把另一轴的 visible
   强算成 auto，机壳的外投影会被裁掉，故用 padding 垫出阴影余量、
   负 margin 找回占位 */
.switch-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  /* 滑到尽头不再把手势链给页面（页面横移/浏览器后退滑动），只在自己体内回弹 */
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--muted) transparent;
  /* padding 全部用负 margin 抵消：既给机壳投影留出不被 overflow 裁掉的余量
     （机身撑满容器，投影左右贴着裁切边会被切成方形硬边），又不占布局间距。
     水平 1rem 与容器 padding-block 下限持平，窄屏也不会把页面推出横向滚动 */
  padding: 0.5rem 1rem 2.75rem;
  margin: -0.5rem -1rem -2.75rem;
}

.scroll-hint {
  display: none;
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: center;
}

/* 65rem 整机 + 页面两侧留白：视口 70rem 以下必出滚动，同步亮提示 */
@media (max-width: 70rem) {
  .scroll-hint {
    display: block;
  }
}

/* 换句动画：旧句快速淡出，新句按行浮现 */
.quote-swap-leave-active {
  transition: opacity 0.15s ease;
}

.quote-swap-leave-to {
  opacity: 0;
}
</style>
