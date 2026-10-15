<script setup lang="ts">
import type { TimelineItem } from '~/config/types'

defineProps<{ items: TimelineItem[] }>()
</script>

<template>
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
</template>

<style scoped>
.timeline {
  display: grid;
  gap: 1.4rem;
  max-width: 34rem;
}

.item {
  position: relative;
  display: flex;
  gap: 1rem;
  padding-left: 0.25rem;
  transition: transform 0.3s var(--ease-bouncy);
}

.item:hover {
  transform: translateX(4px);
}

/* 竖向连线 */
.item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 1.2rem;
  bottom: -1.6rem;
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
  transition: transform 0.3s var(--ease-bouncy), box-shadow 0.25s;
}

.item:hover .node {
  transform: scale(1.3);
  box-shadow: 0 0 0.75rem rgba(129, 140, 248, 0.55);
}

.content {
  display: grid;
  gap: 0.1rem;
}

.period {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
}

.title {
  font-size: 1.02rem;
  font-weight: 600;
}

.org {
  font-size: 0.88rem;
  color: var(--accent-2);
}

.desc {
  margin-top: 0.15rem;
  font-size: 0.88rem;
  line-height: 1.75;
  color: var(--muted);
}
</style>
