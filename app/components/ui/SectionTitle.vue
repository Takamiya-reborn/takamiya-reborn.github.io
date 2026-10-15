<script setup lang="ts">
// 章节标题：编号 + 标题 + 延伸线 + 可选副标题
defineProps<{
  index: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="section-title">
    <div class="row">
      <span class="index">{{ index }}.</span>
      <h2 class="title">{{ title }}</h2>
      <span class="rule" aria-hidden="true" />
    </div>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped>
.section-title {
  margin-bottom: 2rem;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
}

.index {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--accent);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  font-weight: 700;
  letter-spacing: 0.01em;
}

/* 向右渐隐的延伸线 */
.rule {
  flex-grow: 1;
  height: 1px;
  margin-left: 0.5rem;
  background: linear-gradient(90deg, rgba(129, 140, 248, 0.5), transparent);
}

.subtitle {
  margin-top: 0.4rem;
  padding-left: 0.1rem;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
