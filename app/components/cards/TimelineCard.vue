<script setup lang="ts">
import type { TimelineItem } from '~/config/site'

defineProps<{ items: TimelineItem[] }>()
</script>

<template>
  <BaseCard>
    <SectionTitle icon="lucide:history" title="经历" />
    <ol class="timeline">
      <li v-for="item in items" :key="`${item.period}-${item.title}`" class="item">
        <span class="node" aria-hidden="true" />
        <div class="content">
          <p class="period">{{ item.period }}</p>
          <h3 class="title">{{ item.title }}</h3>
          <p class="org">{{ item.org }}</p>
          <p v-if="item.description" class="desc">{{ item.description }}</p>
        </div>
      </li>
    </ol>
  </BaseCard>
</template>

<style scoped>
.timeline {
  display: grid;
  gap: 1.1rem;
}

.item {
  position: relative;
  display: flex;
  gap: 0.9rem;
  padding-left: 0.25rem;
}

/* 竖向连线 */
.item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 1.1rem;
  bottom: -1.35rem;
  width: 1px;
  background: var(--border);
}

.node {
  flex-shrink: 0;
  width: 0.7rem;
  height: 0.7rem;
  margin-top: 0.35rem;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--accent);
}

.content {
  display: grid;
  gap: 0.1rem;
}

.period {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--muted);
}

.title {
  font-size: 0.95rem;
  font-weight: 600;
}

.org {
  font-size: 0.85rem;
  color: var(--accent);
}

.desc {
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
