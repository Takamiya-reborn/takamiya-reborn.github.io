<script setup lang="ts">
import type { SkillGroup } from '~/config/types'

defineProps<{ groups: SkillGroup[] }>()
</script>

<template>
  <div class="skills">
    <div class="groups">
      <div v-for="(group, gi) in groups" :key="group.title" v-reveal="{ delay: gi * 90 }" class="group">
        <h3 class="group-title">
          <Icon :name="group.icon" size="15" />
          {{ group.title }}
        </h3>
        <ul class="skills-list">
          <li v-for="(skill, si) in group.skills" :key="skill" v-reveal="{ delay: gi * 90 + si * 50 }">
            <TagPill :label="skill" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills {
  padding-top: 0.5rem;
}

.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1.6rem;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.group-title svg {
  color: var(--accent);
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

/* ---- XP 经验条 ---- */
.xp {
  max-width: 26rem;
  margin-top: 2rem;
}

.xp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.45rem;
}

.xp-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--muted);
}

.xp-label svg {
  color: #fbbf24;
}

.xp-level {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #fbbf24;
}

.xp-track {
  height: 0.45rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.xp-fill {
  position: relative;
  width: var(--p, 50%);
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #fb923c);
  border-radius: inherit;
  overflow: hidden;
}

/* 流光扫过 */
.xp-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.55) 50%, transparent 60%);
  animation: shine 2.6s ease-in-out infinite;
}

@keyframes shine {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}
</style>
