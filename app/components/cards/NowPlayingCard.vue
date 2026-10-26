<script setup lang="ts">
import type { GameEntry, GamePlatform } from '~/config/types'

const props = defineProps<{ games: GameEntry[]; steamUrl: string }>()


// 平台 → 图标、品牌色与主页链接；label 兼作悬停 title
const PLATFORMS: Record<GamePlatform, { icon: string; color: string; label: string; url: string }> = {
  steam: { icon: 'simple-icons:steam', color: '#66c0f4', label: 'Steam', url: props.steamUrl },
  xbox: {
    icon: 'simple-icons:xbox',
    color: '#3fd16f',
    label: 'Xbox',
    url: 'https://www.xbox.com/zh-CN/play/user/Takamiya2005',
  },
  ns: {
    icon: 'simple-icons:nintendoswitch',
    color: '#ff5f58',
    label: 'Nintendo Switch',
    url: 'https://www.nintendo.com/',
  },
}

const { games: steamStats } = useSteamData()

// 分钟数 → 展示文案：1 小时以上保留一位小数，不足 1 小时显示分钟
function formatPlaytime(minutes: number): string {
  const hours = minutes / 60
  return hours >= 1 ? `${hours.toFixed(1)} 小时` : `${minutes} 分钟`
}

// 归一渲染模型：所有条目共用同一套槽位——标题行（时长附在标题后）+ 成就行；
// steam 条目的槽位完全由注入数据生成，不再回退手写 note/progress
interface GameDisplay extends GameEntry {
  /** 游玩时长文案（steam 槽位，由数据生成），渲染在标题右侧 */
  playtime?: string;
  /** 成就进度（steam 槽位）；null 表示无成就数据，展示 -/- 且不画进度条 */
  achievements?: { unlocked: number; total: number } | null;
  /** 成就完成度百分比；无成就数据时为 undefined，不渲染进度条 */
  achievementPct?: number;
  /** 游戏 capsule 图（steam 槽位），作条目背景 cover + 压暗 */
  cover?: string;
}

const displayGames = computed<GameDisplay[]>(() =>
  props.games.map((game) => {
    const stat = game.platform === 'steam' ? steamStats[game.title] : undefined
    if (!stat) return game

    return {
      ...game,
      note: undefined,
      progress: undefined,
      playtime: stat.playtimeMinutes != null ? formatPlaytime(stat.playtimeMinutes) : undefined,
      achievements: stat.achievements,
      achievementPct: stat.achievements?.total
        ? Math.round((stat.achievements.unlocked / stat.achievements.total) * 100)
        : undefined,
      cover: stat.cover,
    }
  }),
)

// 按相邻平台分组：每组的标题行放平台名与主页链接，组间由样式画分割线
const platformGroups = computed(() => {
  const groups: { platform: GamePlatform; games: GameDisplay[] }[] = []
  for (const game of displayGames.value) {
    const last = groups[groups.length - 1]
    if (last && last.platform === game.platform) last.games.push(game)
    else groups.push({ platform: game.platform, games: [game] })
  }
  return groups
})
</script>

<template>
  <!-- 倾斜卡片必须关毛玻璃，否则整卡进合成层、文字旋转后发糊 -->
  <BaseCard class="now-playing" :glass="false">
    <ul class="np-list">
      <li v-for="(group, gi) in platformGroups" :key="`${group.platform}-${gi}`" class="np-group">
        <div class="np-group-head">
          <span class="np-group-name" :style="{ color: PLATFORMS[group.platform].color }">
            {{ PLATFORMS[group.platform].label }}
          </span>
          <a class="np-group-link" :href="PLATFORMS[group.platform].url" target="_blank" rel="noopener"
            :title="`${PLATFORMS[group.platform].label} 主页`" :aria-label="`${PLATFORMS[group.platform].label} 主页`"
            :style="{ '--p-color': PLATFORMS[group.platform].color }">
            <Icon :name="PLATFORMS[group.platform].icon" size="14" />
          </a>
        </div>
        <ul class="np-games">
          <li v-for="game in group.games" :key="game.title" class="np-item" :class="{ 'has-bg': !!game.cover }"
            :style="game.cover ? { '--cover': `url('${game.cover}')` } : undefined">
            <span class="np-platform" :title="PLATFORMS[game.platform].label"
              :style="{ color: PLATFORMS[game.platform].color }">
              <Icon :name="PLATFORMS[game.platform].icon" size="17" />
            </span>
            <div class="np-info">
              <p class="np-title">
                {{ game.title }}<span v-if="game.playtime" class="np-playtime">· {{ game.playtime }}</span>
              </p>
              <p v-if="game.note" class="np-note">{{ game.note }}</p>
              <!-- steam 成就行：有数据画进度条（100% 彩虹、未满蓝），无数据显示 -/- -->
              <div v-if="game.achievements !== undefined" class="np-achieve">
                <span class="np-pct">
                  {{ game.achievements ? `${game.achievements.unlocked} / ${game.achievements.total}` : '-/-' }}
                </span>
                <div v-if="game.achievementPct != null" class="np-bar">
                  <div class="np-fill" :class="{ rainbow: game.achievementPct === 100 }"
                    :style="{ width: `${game.achievementPct}%` }" />
                </div>
              </div>
              <div v-else-if="game.progress" class="np-progress">
                <div class="np-bar">
                  <div class="np-fill" :style="{ width: `${game.progress}%` }" />
                </div>
                <span class="np-pct">{{ game.progress }}%</span>
              </div>
            </div>
          </li>
        </ul>
      </li>
    </ul>
  </BaseCard>
</template>

<style scoped>
/* 故意轻倾斜，打破对齐感。
   关于区棋盘网格：卡在左行向左倾（-），本卡与 LeetCode 卡同在左列行，同为反向。
   卡片和字号整体放大一档：倾斜重采样时小字号笔画只有一两个像素宽，最容易糊 */
.now-playing {
  max-width: 30rem;
  transform: rotate(-1.2deg) translateY(0.3rem);
}

.now-playing.now-playing:hover {
  transform: rotate(0deg) translateY(0.15rem);
}

.np-list {
  display: grid;
}

/* 平台组：组间分割线与平台图标块同用 var(--border) */
.np-group+.np-group {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--border);
}

/* 组标题行：品牌色平台名在左，主页链接小卡在右 */
.np-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.np-group-name {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.np-group-link {
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  color: var(--p-color);
  background: var(--surface-strong);
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.np-group-link:hover {
  border-color: var(--p-color);
  box-shadow: 0 0 12px color-mix(in srgb, var(--p-color) 35%, transparent);
}

.np-games {
  display: grid;
  gap: 0.9rem;
}

.np-item {
  display: flex;
  gap: 0.7rem;
}

.np-platform {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  margin-top: 0.1rem;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
}

/* 有游戏 capsule 图时整行作背景：伪元素 cover 铺满后整体调低透明度，
   隐约透出纹理即可；用透明度而非压暗，亮暗主题下都能自然融入卡片底色 */
.np-item.has-bg {
  position: relative;
  padding: 0.6rem 0.7rem;
  border-radius: 0.6rem;
}

.np-item.has-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--cover) center / cover no-repeat;
  border-radius: inherit;
  opacity: 0.15;
  pointer-events: none;
}

.np-title {
  font-size: 1.02rem;
  font-weight: 600;
}

/* 时长附在标题右侧，弱化为次要信息 */
.np-playtime {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--muted);
}

.np-note {
  margin-top: 0.1rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.np-progress,
.np-achieve {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.np-bar {
  flex-grow: 1;
  max-width: 10rem;
  height: 0.35rem;
  background: var(--surface-hover);
  border-radius: 999px;
  overflow: hidden;
}

.np-fill {
  height: 100%;
  background: #306ffe;
  border-radius: inherit;
}

/* 全成就：一道从红到紫的彩虹渐变，色值取自暗色背景下的 tailwind 400 系，避免刺眼 */
.np-fill.rainbow {
  background: linear-gradient(90deg,
      #f87171,
      #fb923c,
      #facc15,
      #a3e635,
      #34d399,
      #22d3ee,
      #818cf8,
      #e879f9);
}

.np-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
