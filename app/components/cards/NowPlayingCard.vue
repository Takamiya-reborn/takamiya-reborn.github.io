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

// 分钟数 → 展示文案：1 小时以上取整，不足 1 小时保留一位小数
function formatPlaytime(minutes: number): string {
  const hours = minutes / 60
  return hours >= 1 ? `${hours.toFixed(hours >= 10 ? 0 : 1)} 小时` : `${minutes} 分钟`
}

// 带 steamAppId + liveNote 的条目用 steam.json 定时注入的数据替换 note；
// steam.json 缺该条目时回退 site.ts 的 defaultStats（复制自最近一次抓取的保底值）
const displayGames = computed(() =>
  props.games.map((game) => {
    const stat = (game.steamAppId ? steamStats[String(game.steamAppId)] : undefined)
      ?? game.defaultStats
    if (!stat) return game

    let note = game.note
    if (game.liveNote === 'achievements' && stat.achievements)
      note = `成就 ${stat.achievements.unlocked} / ${stat.achievements.total}`
    else if (game.liveNote === 'playtime' && stat.playtimeMinutes != null)
      note = `已游玩 ${formatPlaytime(stat.playtimeMinutes)}`

    // 进度条以实时成就完成度为准，拿不到数据时回退 site.ts 的静态 progress
    const progress = stat.achievements?.total
      ? Math.round((stat.achievements.unlocked / stat.achievements.total) * 100)
      : game.progress

    return note === game.note && progress === game.progress
      ? game
      : { ...game, note, progress }
  }),
)

// 按相邻平台分组：每组的标题行放平台名与主页链接，组间由样式画分割线
const platformGroups = computed(() => {
  const groups: { platform: GamePlatform; games: GameEntry[] }[] = []
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
          <li v-for="game in group.games" :key="game.title" class="np-item">
            <span class="np-platform" :title="PLATFORMS[game.platform].label"
              :style="{ color: PLATFORMS[game.platform].color }">
              <Icon :name="PLATFORMS[game.platform].icon" size="17" />
            </span>
            <div class="np-info">
              <p class="np-title">{{ game.title }}</p>
              <p v-if="game.note" class="np-note">{{ game.note }}</p>
              <div v-if="game.progress" class="np-progress">
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

.np-title {
  font-size: 1.02rem;
  font-weight: 600;
}

.np-note {
  margin-top: 0.1rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.np-progress {
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
  /* 一道从红到紫的彩虹渐变，色值取自暗色背景下的 tailwind 400 系，避免刺眼 */
  background: linear-gradient(90deg,
      #f87171,
      #fb923c,
      #facc15,
      #a3e635,
      #34d399,
      #22d3ee,
      #818cf8,
      #e879f9);
  border-radius: inherit;
}

.np-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
