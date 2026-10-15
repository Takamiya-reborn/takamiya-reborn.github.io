<script setup lang="ts">
/** 卡片内的小节标题：图标 + 文本 + 可选副标题 */
defineProps<{
  icon: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="section-title">
    <span class="icon-badge">
      <Icon :name="icon" size="18" />
    </span>
    <div>
      <h2 class="title">{{ title }}</h2>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-badge {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-sm);
  color: var(--accent);
  background: var(--accent-soft);
}

.title {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
