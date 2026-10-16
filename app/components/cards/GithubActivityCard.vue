<script setup lang="ts">
import type { GithubCommit, GithubDay, GithubLanguage } from '~/composables/useGithubActivity'

defineProps<{ githubUser?: string }>()

const { days, total, languages, commits, generatedAt } = useGithubActivity()

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
  days.forEach((day, i) => {
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

// ---------- 语言构成 ----------
// 语言 → 色块颜色（GitHub Linguist 色板，深色背景下微调过几处过暗的）
const langColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Vue: '#41b883',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#8b8b8b',
  'C#': '#3f9142',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#6699cc',
  Shell: '#89e051',
  PowerShell: '#5391fe',
  Lua: '#51a0cf',
  Kotlin: '#a97bff',
  Swift: '#f05138',
  Dart: '#00b4ab',
  PHP: '#8993be',
  'Jupyter Notebook': '#da5b0b',
}

// 未收录的语言回退到主题色池，按名次轮换
const fallbackColors = ['#818cf8', '#22d3ee', '#c084fc', '#34d399', '#fbbf24', '#fb7185']
const langColor = (lang: GithubLanguage, index: number) =>
  langColors[lang.name] ?? fallbackColors[index % fallbackColors.length]!

// ---------- 最新提交 ----------
// 相对时间：构建时（SSG）用 generatedAt 做锚点保证水合一致，挂载后再换真实时间
const now = ref<number | null>(null)
onMounted(() => (now.value = Date.now()))

function relTime(date: string): string {
  const diff = ((now.value ?? Date.parse(generatedAt)) - Date.parse(date)) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 2) return '昨天'
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// +/− 行数文案：详情接口失败时 additions 为 null，只显示时间
const diffLabel = (c: GithubCommit) =>
  c.additions != null ? `+${c.additions}` : ''
</script>

<template>
  <!-- 数据全空时整卡隐藏，不留空壳 -->
  <BaseCard v-if="columns.length || languages.length || commits.length" class="github-activity" :glass="false">
    <div class="gh-head">
      <span class="gh-label">
        <Icon name="lucide:github" size="16" />
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
        <Icon name="lucide:arrow-up-right" size="13" />
      </a>
    </div>

    <!-- 语言构成 -->
    <div v-if="languages.length" class="gh-section">
      <p class="gh-section-title">语言构成</p>
      <div class="gh-langbar" role="img" aria-label="仓库语言构成占比条">
        <span v-for="(lang, i) in languages" :key="lang.name" class="gh-langseg"
          :style="{ width: `${lang.pct}%`, background: langColor(lang, i) }"
          :title="`${lang.name} ${lang.pct}%`" />
      </div>
      <ul class="gh-langs">
        <li v-for="(lang, i) in languages" :key="lang.name">
          <span class="gh-dot" :style="{ background: langColor(lang, i) }" aria-hidden="true" />
          <span class="gh-lang-name">{{ lang.name }}</span>
          <span class="gh-lang-pct">{{ lang.pct }}%</span>
        </li>
      </ul>
    </div>

    <!-- 最新提交 -->
    <div v-if="commits.length" class="gh-section">
      <p class="gh-section-title">最新提交</p>
      <ul class="gh-commits">
        <li v-for="c in commits" :key="c.sha">
          <a class="gh-commit" :href="`${c.repoUrl}/commit/${c.sha}`" target="_blank" rel="noopener">
            <span class="gh-commit-row">
              <span class="gh-commit-msg">{{ c.message }}</span>
              <span v-if="diffLabel(c)" class="gh-diff">
                <span class="gh-add">+{{ c.additions }}</span>
                <span class="gh-del">−{{ c.deletions ?? 0 }}</span>
              </span>
            </span>
            <span class="gh-commit-meta">
              <span class="gh-commit-repo">{{ c.repo }}</span>
              · {{ relTime(c.date) }}
            </span>
          </a>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>

<style scoped>
/* 与「正在游玩」呼应但刻意不对等：反向小角度倾斜、收窄（内容少）、轻微上浮，
   游戏卡是 -1.2deg + 下沉 2.5rem。
   卡片和字号整体放大一档：倾斜重采样时小字号笔画最容易糊 */
.github-activity {
  max-width: 27rem;
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
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

.gh-window {
  font-family: var(--font-mono);
  font-size: 0.78rem;
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
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.1;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.gh-unit {
  font-size: 0.88rem;
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
  width: 14px;
  height: 14px;
  border-radius: 4px;
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
  font-size: 0.75rem;
  color: var(--muted);
  opacity: 0.8;
}

.gh-legend .gh-cell {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}

.gh-link {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--muted);
  transition: color 0.2s;
}

.gh-link:hover {
  color: var(--accent-2);
}

/* ---- 下方扩展区块（语言构成 / 最新提交）：细分隔线分区 ---- */
.gh-section {
  margin-top: 0.35rem;
  padding-top: 1.1rem;
  border-top: 1px solid var(--border);
}

.gh-section-title {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

/* 语言占比条：分段紧贴铺满，两端随容器圆角 */
.gh-langbar {
  display: flex;
  height: 8px;
  margin-top: 0.7rem;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.gh-langbar .gh-langseg {
  transition: filter 0.2s;
}

.gh-langbar:hover .gh-langseg {
  filter: brightness(1.15);
}

.gh-langs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 1.2rem;
  margin-top: 0.7rem;
}

.gh-langs li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
}

.gh-dot {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 3px;
}

.gh-lang-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gh-lang-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
}

/* 最新提交列表 */
.gh-commits {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.7rem;
}

.gh-commit {
  display: block;
}

/* 首行：提交信息 + 右侧增删行数 */
.gh-commit-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.gh-commit-msg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.84rem;
  color: var(--text);
  transition: color 0.2s;
}

.gh-diff {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  white-space: nowrap;
}

/* GitHub 风格的 +绿 −红 */
.gh-add {
  color: #3fb950;
}

.gh-del {
  margin-left: 0.4rem;
  color: #f85149;
}

.gh-commit:hover .gh-commit-msg {
  color: var(--accent-2);
}

.gh-commit-meta {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: var(--muted);
}

.gh-commit-repo {
  font-family: var(--font-mono);
}
</style>
