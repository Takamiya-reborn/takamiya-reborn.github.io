<script setup lang="ts">
import type { Quote } from '~/config/types'

// quote 抽取器：quote 卡片在左，抽取按钮和提示独立在右侧
const { quotes, draw } = useQuotes()

const current = ref<Quote>()
// 抽取次数：作为 Transition 的 key 驱动换句动画
const drawCount = ref(0)
// 短暂锁死按钮，等换句动画走完再允许下一次抽取
let rolling = false

function next() {
  if (rolling) return
  const quote = draw()
  if (!quote) return
  rolling = true
  current.value = quote
  drawCount.value++
  setTimeout(() => (rolling = false), 420)
}

onMounted(() => {
  current.value = draw()
  drawCount.value = 1
})

// 主句：有原文用原文，没有则译文顶上
const mainText = computed(() => current.value?.text || current.value?.translation || '')

// 署名行：原名为主，译名附在英文括号里；无原名时译名直接作为署名
const authorLine = computed(() => {
  const { author, authorTranslation } = current.value ?? {}
  if (author) return authorTranslation ? `${author}(${authorTranslation})` : author
  return authorTranslation ?? ''
})

// 把当前这句连同作者丢给搜索引擎，找原文出处
const searchUrl = computed(() => {
  const quote = current.value
  if (!quote) return undefined
  const query = authorLine.value ? `${mainText.value} ${authorLine.value}` : mainText.value
  return `https://www.bing.com/search?q=${encodeURIComponent(query)}`
})
</script>

<template>
  <div class="quote-layout">
    <!-- quote 卡片 -->
    <BaseCard class="quote-card" :hover="false">
      <Transition name="quote-swap" mode="out-in">
        <blockquote v-if="current" :key="drawCount" class="quote-body">
          <Icon name="lucide:quote" size="26" class="quote-mark" />
          <p class="quote-text">{{ mainText }}</p>
          <p v-if="current.text" class="quote-translation">{{ current.translation }}</p>
          <footer v-if="authorLine || current.source" class="quote-from">
            —— {{ authorLine }}<template v-if="current.source">·{{ current.source }}</template>
          </footer>
        </blockquote>
        <p v-else :key="'empty'" class="quote-empty">quotes.json 还没有收录 quote</p>
      </Transition>
    </BaseCard>

    <!-- 右侧抽取区：每个按钮下带一行小字提示 -->
    <div class="quote-rail">
      <div class="quote-actions">
        <div class="quote-action">
          <button class="quote-roll" type="button" title="抽一条" :disabled="quotes.length === 0" @click="next">
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

.quote-body {
  position: relative;
  margin: 0;
  padding-left: 2.4rem;
  /* 纵向撑满卡片，正文垂直居中，署名被推到右下角 */
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

/* 换句动画：旧句下沉淡出，新句从下浮入 */
.quote-swap-enter-active,
.quote-swap-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.quote-swap-enter-from {
  opacity: 0;
  transform: translateY(0.6rem);
}

.quote-swap-leave-to {
  opacity: 0;
  transform: translateY(-0.4rem);
}
</style>
