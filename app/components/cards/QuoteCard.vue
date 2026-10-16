<script setup lang="ts">
import type { Quote } from '~/config/types'

// quote 抽取器：quote 卡片在左，抽取按钮和提示独立在右侧
const { quotes, draw } = useQuotes()

const current = ref<Quote>()
// 抽取次数：作为 blockquote 的 key 驱动换句，key 变化重新挂载就会重放浮现动画
const drawCount = ref(0)
// 浮现期间锁死按钮，整句浮现完再允许下一次抽取
const rolling = ref(false)
// 复制反馈：图标切成对勾、提示换成已复制，1.5s 后复原
const copied = ref(false)

// 浮现总时长：行间错开 0.18s，每行 0.6s，与句子长短无关
const REVEAL_MS = 1000

// 隐藏量高容器：按真实样式渲染每条 quote，取最高的锁住卡片高度
const measureBox = ref<HTMLElement>()
// quote 舞台的最小高度，保证换句时卡片高度不抖
const stageMinHeight = ref<string>()

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

// 按真实排版量出所有 quote 的最大高度，锁住卡片高度
function measure() {
  if (!measureBox.value || quotes.length === 0) return
  const tallest = Math.max(...Array.from(measureBox.value.children, el => el.scrollHeight))
  stageMinHeight.value = `${tallest}px`
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
  current.value = draw()
  drawCount.value = 1
  measure()
  // 字体加载、窗口变宽窄都会改变换行，跟着重量一次
  document.fonts?.ready.then(measure)
  window.addEventListener('resize', measure, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <div class="quote-layout">
    <!-- quote 卡片 -->
    <BaseCard class="quote-card" :hover="false">
      <!-- 量高容器：与正文同宽渲染全部 quote，撑出最高一条的真实高度 -->
      <div ref="measureBox" class="quote-measure" aria-hidden="true">
        <blockquote v-for="(quote, i) in quotes" :key="i" class="quote-body">
          <p v-if="mainOf(quote)" class="quote-text">{{ mainOf(quote) }}</p>
          <p v-if="quote.text && quote.translation" class="quote-translation">{{ quote.translation }}</p>
          <footer v-if="fromOf(quote)" class="quote-from">{{ fromOf(quote) }}</footer>
        </blockquote>
      </div>

      <div class="quote-stage" :style="{ minHeight: stageMinHeight }">
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

    <!-- 右侧抽取区：每个按钮下带一行小字提示 -->
    <div class="quote-rail">
      <div class="quote-actions">
        <div class="quote-action">
          <button class="quote-roll" type="button" title="抽一条" :disabled="quotes.length === 0 || rolling" @click="next">
            <Icon name="lucide:dices" size="26" />
          </button>
          <span class="quote-hint">点骰子抽取</span>
        </div>
        <div v-if="searchUrl" class="quote-action">
          <a class="quote-roll" :href="searchUrl" target="_blank" rel="noopener" title="搜索这句话">
            <Icon name="lucide:search" size="24" />
          </a>
          <span class="quote-hint">没听说过？</span>
        </div>
        <div v-if="current" class="quote-action">
          <button class="quote-roll" type="button" title="复制这句话" @click="copy">
            <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" size="24" />
          </button>
          <span class="quote-hint">{{ copied ? '已复制' : '好句子，带走' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quote-layout {
  display: grid;
  /* quote 卡约 70%，右侧留给抽取区，间距收紧让两者靠近 */
  grid-template-columns: minmax(0, 7fr) minmax(0, 3fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: stretch;
}

.quote-card {
  display: flex;
  /* 占满自己所在的列，不留两侧空隙 */
  justify-self: stretch;
  width: 100%;
  padding: 3.5rem 3rem;
}

/* 量高容器：贴着卡片内容区绝对定位（inset 对齐 .quote-card 的 padding），
   不参与布局，visibility 隐藏但保留排版，供 measure() 读取真实高度 */
.quote-measure {
  position: absolute;
  inset: 3.5rem 3rem;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
}

/* quote 舞台：最小高度锁住换句时的高度，正文在其中垂直居中 */
.quote-stage {
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
  color: var(--accent);
  opacity: 0.7;
}

.quote-text {
  font-family: var(--font-display);
  font-size: 1.3rem;
  line-height: 1.75;
  color: var(--text);
  min-height: 1em;
}

/* 补充译文：跟在主句下面，弱化处理 */
.quote-translation {
  margin-top: 0.45rem;
  font-size: 0.88rem;
  line-height: 1.7;
  font-style: italic;
  color: var(--muted);
  opacity: 0.85;
}

.quote-from {
  margin-top: 2rem;
  align-self: flex-end;
  text-align: right;
  font-size: 0.85rem;
  color: var(--muted);
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
  color: var(--muted);
}

/* 右侧抽取区：内容贴列左侧，纵向居中，后续往里加东西直接顺着排 */
.quote-rail {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1.5rem;
  padding-block: 0.5rem;
}

.quote-roll {
  display: grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.25s,
    transform 0.2s;
}

.quote-roll:hover {
  color: var(--accent-2);
  border-color: var(--border-strong);
  background: var(--accent-soft);
  box-shadow: var(--glow);
}

.quote-roll:active {
  transform: scale(0.92);
}

.quote-roll:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 按钮竖着排，每个按钮右边跟一行提示 */
.quote-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.2rem;
}

.quote-action {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quote-hint {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--muted);
  opacity: 0.75;
}

/* 窄屏：抽取区收到卡片下方横排 */
@media (max-width: 40rem) {
  .quote-layout {
    grid-template-columns: 1fr;
  }

  .quote-rail {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-block: 0;
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
