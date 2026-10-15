<script setup lang="ts">
/** 所有卡片的基础容器：统一的玻璃拟态外观与悬停反馈 */
withDefaults(
  defineProps<{
    /** 悬停时是否轻微上浮（内容型卡片可关闭） */
    hover?: boolean
  }>(),
  { hover: true },
)
</script>

<template>
  <section class="card" :class="{ 'card--hover': hover }">
    <slot />
  </section>
</template>

<style scoped>
.card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  backdrop-filter: blur(12px);
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
}

.card--hover:hover {
  transform: translateY(-3px);
  background: var(--surface-hover);
  border-color: rgba(255, 255, 255, 0.16);
}
</style>
