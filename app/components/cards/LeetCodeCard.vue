<script setup lang="ts">
import { useLeetCode } from '~/composables/useLeetCode'

// 难度 → 展示名与配色（取自 leetcode.cn 官方 sd 主题的 --sd-easy/medium/hard 变量）
const DIFFICULTIES = [
  { key: 'easy', label: '简单', color: '#1cbaba' },
  { key: 'medium', label: '中等', color: '#ffb700' },
  { key: 'hard', label: '困难', color: '#f63737' },
] as const

const { solved, total, attempting, solvedTotal, totalAll, userSlug } = useLeetCode()

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
      <span class="lc-label">
        <Icon name="simple-icons:leetcode" size="16" style="color: #ffa116" />
        LeetCode
      </span>
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
  max-width: 27rem;
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
  gap: 1.5rem;
}

/* ---- 环形进度 ---- */
.lc-ring-wrap {
  position: relative;
  flex: none;
  width: 10.5rem;
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
  gap: 0.6rem;
  min-width: 0;
}

.lc-diff {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.85rem;
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
