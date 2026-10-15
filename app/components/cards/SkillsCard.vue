<script setup lang="ts">
import type { SkillGroup } from '~/config/site'

defineProps<{ groups: SkillGroup[] }>()
</script>

<template>
  <BaseCard>
    <SectionTitle icon="lucide:code-2" title="技能" subtitle="日常使用的工具与技术栈" />
    <div class="groups">
      <div v-for="group in groups" :key="group.title" class="group">
        <h3 class="group-title">
          <Icon :name="group.icon" size="15" />
          {{ group.title }}
        </h3>
        <ul class="skills">
          <li v-for="skill in group.skills" :key="skill">
            <TagPill :label="skill" />
          </li>
        </ul>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.groups {
  display: grid;
  gap: 1rem;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.group-title svg {
  color: var(--accent);
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
</style>
