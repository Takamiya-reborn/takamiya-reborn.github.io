<script setup lang="ts">
/** 标签胶囊 */
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 999px;
  white-space: nowrap;
}
</style>
