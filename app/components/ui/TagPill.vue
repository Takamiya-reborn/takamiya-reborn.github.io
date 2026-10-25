<script setup lang="ts">
// 标签胶囊：悬停时点亮为主题色
defineProps<{ label: string }>()
</script>

<template>
  <span class="tag">{{ label }}</span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  font-size: 0.78rem;
  font-family: var(--font-mono);
  color: var(--muted);
  background: var(--surface-strong);
  border: 1px solid var(--border);
  border-radius: 999px;
  white-space: nowrap;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s,
    transform 0.3s var(--ease-bouncy);
}

.tag:hover {
  color: var(--text);
  background: var(--accent-soft);
  border-color: var(--accent-border);
  transform: translateY(-2px) scale(1.07);
}
</style>
