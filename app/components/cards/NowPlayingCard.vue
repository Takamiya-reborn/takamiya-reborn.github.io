<script setup lang="ts">
import type { GameEntry, GamePlatform } from '~/config/types'

const props = defineProps<{ games: GameEntry[] }>()

// 平台 → 图标与品牌色
const PLATFORMS: Record<GamePlatform, { icon: string; color: string; label: string }> = {
  steam: { icon: 'simple-icons:steam', color: '#66c0f4', label: 'Steam' },
  xbox: { icon: 'simple-icons:xbox', color: '#3fd16f', label: 'Xbox' },
  ns: { icon: 'simple-icons:nintendoswitch', color: '#ff5f58', label: 'Switch' },
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
</script>

<template>
  <!-- 倾斜卡片必须关毛玻璃，否则整卡进合成层、文字旋转后发糊 -->
  <BaseCard class="now-playing" :glass="false">
    <ul class="np-list">
      <li v-for="game in displayGames" :key="game.title" class="np-item">
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
  </BaseCard>
</template>

<style scoped>
/* 故意倾斜 + 下沉，打破对齐感。
   卡片和字号整体放大一档：倾斜重采样时小字号笔画只有一两个像素宽，最容易糊 */
.now-playing {
  max-width: 30rem;
  transform: rotate(-1.2deg) translateY(8rem);
}

.now-playing.now-playing:hover {
  transform: rotate(0deg) translateY(7.7rem);
}

.np-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.np-label {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

.np-live {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #34d399;
}

.dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #34d399;
  animation: pulse-dot 2.2s ease-out infinite;
}

.np-list {
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
  background: rgba(255, 255, 255, 0.05);
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
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.np-fill {
  height: 100%;
  /* 一道从红到紫的彩虹渐变，色值取自暗色背景下的 tailwind 400 系，避免刺眼 */
  background: linear-gradient(
    90deg,
    #f87171,
    #fb923c,
    #facc15,
    #a3e635,
    #34d399,
    #22d3ee,
    #818cf8,
    #e879f9
  );
  border-radius: inherit;
}

.np-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
}

.np-foot {
  font-size: 0.8rem;
  color: var(--muted);
  opacity: 0.8;
}
</style>
