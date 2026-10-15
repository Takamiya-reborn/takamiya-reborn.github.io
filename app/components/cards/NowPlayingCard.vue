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

// 带 steamAppId + liveNote 的条目用 steam.json 的实时数据替换 note；
// 数据未加载或查询失败时保留 site.ts 里的手写回退文案
const displayGames = computed(() =>
  props.games.map((game) => {
    const stat = game.steamAppId ? steamStats.value[String(game.steamAppId)] : undefined
    if (!stat) return game

    let note = game.note
    if (game.liveNote === 'achievements' && stat.achievements)
      note = `成就 ${stat.achievements.unlocked} / ${stat.achievements.total}`
    else if (game.liveNote === 'playtime' && stat.playtimeMinutes != null)
      note = `已游玩 ${formatPlaytime(stat.playtimeMinutes)}`

    return note === game.note ? game : { ...game, note }
  }),
)
</script>

<template>
  <BaseCard class="now-playing">
    <ul class="np-list">
      <li v-for="game in displayGames" :key="game.title" class="np-item">
        <span class="np-platform" :title="PLATFORMS[game.platform].label"
          :style="{ color: PLATFORMS[game.platform].color }">
          <Icon :name="PLATFORMS[game.platform].icon" size="15" />
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
/* 故意倾斜 + 下沉，打破对齐感 */
.now-playing {
  max-width: 26rem;
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
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

.np-live {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
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
  width: 1.8rem;
  height: 1.8rem;
  margin-top: 0.1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
}

.np-title {
  font-size: 0.92rem;
  font-weight: 600;
}

.np-note {
  margin-top: 0.1rem;
  font-size: 0.76rem;
  color: var(--muted);
}

.np-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.np-bar {
  flex-grow: 1;
  max-width: 9rem;
  height: 0.3rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.np-fill {
  height: 100%;
  background: var(--gradient);
  border-radius: inherit;
}

.np-pct {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--muted);
}

.np-foot {
  font-size: 0.74rem;
  color: var(--muted);
  opacity: 0.8;
}
</style>
