<script setup lang="ts">
import type { MediaSkill } from '~/config/types'

defineProps<{ items: MediaSkill[] }>()
</script>

<template>
  <!-- 倾斜卡片必须关毛玻璃，否则整卡进合成层、文字旋转后发糊 -->
  <BaseCard class="media-card" :glass="false">
    <div class="md-head">
      <span class="md-label">
        <Icon name="lucide:clapperboard" size="16" />
        Media
      </span>
    </div>

    <ul class="md-list">
      <li v-for="m in items" :key="m.name" class="md-item" :title="m.desc">
        <span class="md-tile">
          <img :src="m.icon" :alt="m.name" class="md-icon" />
        </span>
        <div class="md-info">
          <p class="md-name">{{ m.name }}</p>
          <p v-if="m.desc" class="md-desc">{{ m.desc }}</p>
        </div>
      </li>
    </ul>
  </BaseCard>
</template>

<style scoped>
/* 关于区棋盘网格：卡在右行的卡向右倾（+），左行向左倾（-）。
   本卡与 GitHub 卡同在右列行，同为正向；角度与位移取更小一档，避免抢戏 */
.media-card {
  max-width: 30rem;
  transform: rotate(0.7deg) translateY(0.5rem);
}

.media-card.media-card:hover {
  transform: rotate(0deg) translateY(0.2rem);
}

/* 与 GitHub 活动卡的标签行同款：等宽字 + 宽字距 */
.md-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.md-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--muted);
}

/* 两列网格对齐：flex-wrap 按内容宽排布，条目长短不一时行首会错位 */
.md-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.md-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

/* 图标底座：与「正在游玩」的平台图标块同规格 */
.md-tile {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  transition: border-color 0.2s ease;
}

.md-item:hover .md-tile {
  border-color: var(--accent);
}

.md-icon {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
}

.md-name {
  font-size: 1rem;
  font-weight: 600;
}

.md-desc {
  margin-top: 0.1rem;
  font-size: 0.82rem;
  color: var(--muted);
}
</style>
