<script setup lang="ts">
import { useLeetCode } from '~/composables/useLeetCode'

// 难度 → 展示名与配色（取自 leetcode.cn 官方 sd 主题的 --sd-easy/medium/hard 变量）
const DIFFICULTIES = [
  { key: 'easy', label: '简单', color: '#1cbaba' },
  { key: 'medium', label: '中等', color: '#ffb700' },
  { key: 'hard', label: '困难', color: '#f63737' },
] as const

const { solved, total, attempting, solvedTotal, totalAll, streak, submittedToday, daily, userSlug } = useLeetCode()

// 火焰点击直达今日每日一题（注意路径是复数 problems）；数据缺失时退回题单页
const STREAK_HREF = daily ? `https://leetcode.cn/problems/${daily.slug}/` : 'https://leetcode.cn/problemset/'

// 火焰 path 抄自 leetcode.cn 官方 streakCounter 组件（_next chunk 内联 SVG，
// viewBox 0 0 18 18）：空心态 = 官方原样 evenodd 镂空填充；实心态 = 只取外轮廓
// 子路径（第一个 z 之前）纯填充，两种状态形状完全一致
const FLAME_OUTLINE =
  'M7.19 1.564a.75.75 0 01.729.069c2.137 1.475 3.373 3.558 3.981 5.002l.641-.663a.75.75 0 011.17.115c1.633 2.536 1.659 5.537.391 7.725-1.322 2.282-3.915 2.688-5.119 2.688-1.177 0-3.679-.203-5.12-2.688-.623-1.076-.951-2.29-.842-3.528.109-1.245.656-2.463 1.697-3.54.646-.67 1.129-1.592 1.468-2.492.337-.895.51-1.709.564-2.105a.75.75 0 01.44-.583zm.784 2.023c-.1.368-.226.773-.385 1.193-.375.997-.947 2.13-1.792 3.005-.821.851-1.205 1.754-1.282 2.63-.078.884.153 1.792.647 2.645C6.176 14.81 7.925 15 8.983 15c1.03 0 2.909-.366 3.822-1.94.839-1.449.97-3.446.11-5.315l-.785.812a.75.75 0 01-1.268-.345c-.192-.794-1.04-2.948-2.888-4.625z'
const FLAME_SOLID = FLAME_OUTLINE.slice(0, FLAME_OUTLINE.indexOf('z') + 1)

// ---------- 环形进度（几何照抄官方 ProgressChart：r=42、周长按 264 计） ----------
// 三段底弧大小 = 各难度题量占全题库的配额，只铺约 3/4 圆，环底缺口留给「尝试中」；
// 段内实色亮弧 = 该难度已解答进度，底弧为 20% 难度色
const RING_RADIUS = 42
const CIRC = 264 // 官方常量：2π×42 ≈ 264，即每 1% 弧长 2.64

// 官方 b()：进度百分比，除零安全
const pct = (part: number, whole: number) => (part && whole > 0 ? (100 * part) / whole : 0)

const dash = (p: number) => `${2.64 * p} ${CIRC - 2.64 * p}`

const parts = computed(() => {
  const gap = Math.max(DIFFICULTIES.filter((d) => total[d.key] > 0).length - 1, 0)
  // 官方 selfPercentageOfAllParts：配额按缺口数收缩后乘 0.75，露出环底缺口
  const seg = (percentage: number) => ((percentage * (100 - 3 * gap)) / 100) * 0.75
  // 官方 rotateDegree：首段 225° 起笔，后续段按累计弧长 + 段间缺口顺时针转
  const at = (index: number, accPct: number) =>
    index === 0 ? 225 : (360 * (accPct + (index === 1 ? 2.25 : 3 * gap * 0.75))) / 100 + 225

  let acc = 0
  return DIFFICULTIES.map((d, i) => {
    const self = seg(pct(total[d.key], totalAll))
    const bar = (pct(solved[d.key], total[d.key]) * self) / 100
    const part = { key: d.key, color: d.color, rotate: at(i, acc), bg: self, bar }
    acc += self
    return part
  })
})
</script>

<template>
  <!-- 倾斜卡片必须关毛玻璃，否则整卡进合成层、文字旋转后发糊 -->
  <BaseCard class="leetcode" :glass="false">
    <div class="lc-head">
      <div class="lc-head-left">
        <span class="lc-label">
          <Icon name="simple-icons:leetcode" size="16" style="color: #ffa116" />
          LeetCode
        </span>
        <span class="lc-divider" aria-hidden="true" />
        <!-- 连胜火焰：今天有提交为实心，否则空心（同官方逻辑）；点击直达今日每日一题 -->
        <a class="lc-streak" :class="{ 'lc-streak--empty': !submittedToday }" :href="STREAK_HREF"
          target="_blank" rel="noopener" title="连续打卡天数">
          <svg class="lc-flame" viewBox="0 0 18 18" aria-hidden="true">
            <defs>
              <linearGradient id="lc-flame-grad" x1="0" y1="0" x2="0.6" y2="1">
                <stop offset="0" stop-color="#ffb940" />
                <stop offset="1" stop-color="#f87702" />
              </linearGradient>
            </defs>
            <path v-if="submittedToday" fill="url(#lc-flame-grad)" :d="FLAME_SOLID" />
            <path v-else fill="currentColor" fill-rule="evenodd" :d="FLAME_OUTLINE" />
          </svg>
          {{ streak }}
        </a>
      </div>
      <a class="lc-link" :href="`https://leetcode.cn/u/${userSlug}/`" target="_blank" rel="noopener">
        @{{ userSlug }}
        <Icon name="lucide:arrow-up-right" size="13" />
      </a>
    </div>

    <div class="lc-main">
      <div class="lc-ring-wrap">
        <svg class="lc-ring" viewBox="0 0 100 100" role="img" aria-label="LeetCode 已解答题目环形进度图">
          <g v-for="p in parts" :key="p.key" :transform="`rotate(${p.rotate} 50 50)`">
            <circle v-if="p.bg > 0" class="lc-arc-bg" cx="50" cy="50" :r="RING_RADIUS" :stroke="p.color"
              :stroke-dasharray="dash(p.bg)" />
            <circle v-if="p.bar > 0" class="lc-arc-bar" cx="50" cy="50" :r="RING_RADIUS" :stroke="p.color"
              :stroke-dasharray="dash(p.bar)" />
          </g>
        </svg>
        <div class="lc-center">
          <p class="lc-num">
            {{ solvedTotal }}<span class="lc-num-total">/{{ totalAll }}</span>
          </p>
          <p class="lc-solved">已解答</p>
        </div>
        <p class="lc-attempting"><span>{{ attempting }}</span> 尝试中</p>
      </div>

      <ul class="lc-diffs">
        <li v-for="d in DIFFICULTIES" :key="d.key" class="lc-diff" :style="{ '--diff-color': d.color }">
          <span class="lc-diff-label">{{ d.label }}</span>
          <span class="lc-diff-count">{{ solved[d.key] }}/{{ total[d.key] }}</span>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>

<style scoped>
/* 与 GitHub 卡（+0.8deg）呼应：反向小角度倾斜。倾斜卡片必须关毛玻璃（见上） */
.leetcode {
  max-width: 29rem;
  padding: 1.75rem;
  transform: rotate(-1deg) translateY(0.4rem);
}

.leetcode.leetcode:hover {
  transform: rotate(0deg) translateY(0.15rem);
}

.lc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.lc-head-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* 竖分隔线：同官方导航在 logo 与连胜之间的细线 */
.lc-divider {
  width: 1.5px;
  height: 1em;
  border-radius: 1px;
  background: var(--border-strong);
}

/* 连胜火焰：裸排「火焰 + 数字」，不加底框，同官方排版；
   负 margin 抵消 hover 底色的内边距，避免日常态占位变宽 */
.lc-streak {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0.5rem;
  margin: -0.15rem -0.5rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: #ff9d0b;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

/* hover 同官方：出现一块圆角灰底，颜色不变 */
.lc-streak:hover {
  background: rgba(255, 255, 255, 0.07);
}

/* 空心态：描边火焰 + 数字一起褪灰 */
.lc-streak--empty {
  color: var(--muted);
}

.lc-flame {
  width: 19px;
  height: 19px;
}

.lc-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

.lc-link {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--muted);
  transition: color 0.2s;
}

.lc-link:hover {
  color: var(--accent-2);
}

.lc-main {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

/* ---- 环形进度 ---- */
.lc-ring-wrap {
  position: relative;
  flex: none;
  width: 11.5rem;
}

.lc-ring {
  display: block;
  width: 100%;
}

/* 同官方几何：stroke 3、dashoffset 66 = 周长 264 的 1/4，把起笔转到正上方；
   底弧 20% 难度色，进度弧实色 */
.lc-arc-bg,
.lc-arc-bar {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dashoffset: 66;
  transition: stroke-dasharray 0.6s var(--ease-bouncy);
}

.lc-arc-bg {
  stroke-opacity: 0.2;
}

.lc-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lc-num {
  font-size: 1.85rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--text);
}

.lc-num-total {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted);
}

.lc-solved {
  margin-top: 0.1rem;
  font-size: 0.78rem;
  color: var(--muted);
}

/* 「尝试中」贴在环内下缘，同官方布局 */
.lc-attempting {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.72rem;
  white-space: nowrap;
  color: var(--muted);
}

.lc-attempting span {
  font-weight: 600;
  color: var(--text);
}

/* ---- 难度分档：彩色标签 + 加粗计数 ---- */
.lc-diffs {
  flex: 1;
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.lc-diff {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.95rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  transition: border-color 0.2s;
}

.lc-diff:hover {
  border-color: color-mix(in srgb, var(--diff-color) 45%, transparent);
}

.lc-diff-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--diff-color);
}

.lc-diff-count {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
}
</style>
