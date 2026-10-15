<script setup lang="ts">
import { sections } from '~/config/site'

// 右侧目录：仿 md 文档站的 scroll-spy，滚动时高亮当前章节
const activeId = ref(sections[0]?.id ?? '')

function update() {
  // 视口上 1/3 处落在哪个 section 内，就高亮谁；最后一个兜底
  const line = window.innerHeight * 0.35
  let current = sections[0]?.id ?? ''
  for (const s of sections) {
    const el = document.getElementById(s.id)
    if (el && el.getBoundingClientRect().top <= line) current = s.id
  }
  activeId.value = current
}

let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    update()
    ticking = false
  })
}

// 滑动指示条：跟随当前高亮项的位置与高度
const navEl = ref<HTMLElement | null>(null)
const indicator = ref({ top: 0, height: 0, ready: false })

function syncIndicator() {
  const nav = navEl.value
  if (!nav) return
  const el = nav.querySelector<HTMLElement>('.toc-item.active')
  if (!el) {
    indicator.value = { ...indicator.value, ready: false }
    return
  }
  indicator.value = {
    top: el.offsetTop,
    height: el.offsetHeight,
    ready: true,
  }
}

watch(activeId, () => nextTick(syncIndicator))

let ro: ResizeObserver | null = null
onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  nextTick(syncIndicator)
  // 条目换行/字体加载导致高度变化时同步指示条
  ro = new ResizeObserver(syncIndicator)
  if (navEl.value) ro.observe(navEl.value)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  ro?.disconnect()
})
</script>

<template>
  <nav ref="navEl" class="toc" aria-label="页面目录">
    <a v-for="s in sections" :key="s.id" :href="`#${s.id}`" class="toc-item" :class="{ active: s.id === activeId }">
      <span v-if="s.num" class="toc-num">{{ s.num }}</span>
      <span class="toc-text">{{ s.title }}</span>
    </a>
    <!-- 滑动指示条：绝对定位覆盖在条目左边线上，切换时平滑移动 -->
    <span
      v-show="indicator.ready"
      class="toc-indicator"
      :style="{ transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px` }"
    />
  </nav>
</template>

<style scoped>
.toc {
  position: fixed;
  top: 50%;
  right: clamp(1rem, 2vw, 2.5rem);
  transform: translateY(-50%);
  z-index: 40;
  flex-direction: column;
  width: 8.5rem;
  /* 窄屏下放不进右侧留白，整个隐藏 */
  display: none;
}

.toc-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0 0.4rem 0.9rem;
  border-left: 2px solid var(--border);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}

.toc-item:hover {
  color: var(--text);
}

/* 当前章节：编号提亮；左边的亮线交给滑动指示条 */
.toc-item.active {
  color: var(--text);
}

.toc-item.active .toc-num {
  color: var(--accent);
}

.toc-indicator {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  background: var(--accent);
  transition:
    transform 0.25s ease,
    height 0.25s ease;
}

.toc-num {
  color: var(--muted);
  transition: color 0.2s;
}

.toc-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主容器 76rem，右侧留白装得下目录才显示 */
@media (min-width: 92rem) {
  .toc {
    display: flex;
  }
}
</style>
