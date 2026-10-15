<script setup lang="ts">
import type { GithubDay } from '~/composables/useGithubActivity'

defineProps<{ githubUser?: string }>()

const { days, total, loading } = useGithubActivity()

// 贡献量分档 → 色阶档位（0-4，与主题 accent 同色系）
function level(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}

// 按周分列：开头补空位使第一列对齐到周日，末列短周在下方补空
const columns = computed(() => {
  const cols: (GithubDay | null)[][] = []
  let current: (GithubDay | null)[] = []
  days.value.forEach((day, i) => {
    if (i === 0) current = Array.from({ length: new Date(`${day.date}T00:00:00Z`).getUTCDay() }, () => null)
    current.push(day)
    if (current.length === 7) {
      cols.push(current)
      current = []
    }
  })
  if (current.length) cols.push([...current, ...Array.from({ length: 7 - current.length }, () => null)])
  return cols
})

// 悬停提示文案：3月5日 · 4 次贡献
function dayLabel(day: GithubDay): string {
  const [, m, d] = day.date.split('-')
  return `${Number(m)}月${Number(d)}日 · ${day.count} 次贡献`
}
</script>

<template>
  <!-- 数据未加载或 github.json 缺失时整卡隐藏，不留空壳 -->
  <BaseCard v-if="!loading && columns.length" class="github-activity">
    <div class="gh-head">
      <span class="gh-label">
        <Icon name="lucide:github" size="15" />
        GitHub
      </span>
      <span class="gh-window">近 30 天</span>
    </div>

    <p class="gh-total">
      <span class="gh-num">{{ total }}</span>
      <span class="gh-unit">次贡献</span>
    </p>

    <div class="gh-grid" role="img" aria-label="GitHub 近 30 天贡献热力图">
      <div v-for="(col, ci) in columns" :key="ci" class="gh-col">
        <span v-for="(day, di) in col" :key="di" class="gh-cell" :class="`lv-${day ? level(day.count) : 0}`"
          :title="day ? dayLabel(day) : undefined" />
      </div>
    </div>

    <div class="gh-foot">
      <span class="gh-legend" aria-hidden="true">
        少
        <span class="gh-cell lv-0" />
        <span class="gh-cell lv-1" />
        <span class="gh-cell lv-2" />
        <span class="gh-cell lv-3" />
        <span class="gh-cell lv-4" />
        多
      </span>
      <a v-if="githubUser" class="gh-link" :href="`https://github.com/${githubUser}`" target="_blank" rel="noopener">
        @{{ githubUser }}
        <Icon name="lucide:arrow-up-right" size="12" />
      </a>
    </div>
  </BaseCard>
</template>

<style scoped>
/* 与「正在游玩」呼应但刻意不对等：反向小角度倾斜、收窄（内容少）、轻微上浮，
   游戏卡是 -1.2deg + 下沉 2.5rem */
.github-activity {
  max-width: 23rem;
  transform: rotate(0.8deg) translateY(-0.6rem);
}

.github-activity.github-activity:hover {
  transform: rotate(0deg) translateY(-0.3rem);
}

.gh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.gh-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

.gh-window {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--muted);
  opacity: 0.8;
}

.gh-total {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.gh-num {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.gh-unit {
  font-size: 0.8rem;
  color: var(--muted);
}

.gh-grid {
  display: flex;
  gap: 3px;
  margin-top: 0.9rem;
}

.gh-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.gh-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
}

.gh-grid .gh-cell {
  transition: transform 0.15s var(--ease-bouncy);
}

.gh-grid .gh-cell:hover {
  transform: scale(1.35);
}

/* 色阶：由浅到深，均取主题 accent 紫 */
.gh-cell.lv-1 {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
}

.gh-cell.lv-2 {
  background: color-mix(in srgb, var(--accent) 55%, transparent);
}

.gh-cell.lv-3 {
  background: color-mix(in srgb, var(--accent) 78%, transparent);
}

.gh-cell.lv-4 {
  background: var(--accent);
}

.gh-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.gh-legend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: var(--muted);
  opacity: 0.8;
}

.gh-legend .gh-cell {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.gh-link {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--muted);
  transition: color 0.2s;
}

.gh-link:hover {
  color: var(--accent-2);
}
</style>
