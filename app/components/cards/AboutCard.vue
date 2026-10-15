<script setup lang="ts">
defineProps<{ paragraphs: string[] }>()
</script>

<template>
  <BaseCard>
    <SectionTitle icon="lucide:user-round" title="关于我" />
    <p v-for="(paragraph, i) in paragraphs" :key="i" class="paragraph">
      {{ paragraph }}
    </p>
  </BaseCard>
</template>

<style scoped>
.paragraph {
  color: var(--muted);
}

.paragraph + .paragraph {
  margin-top: 0.6rem;
}
</style>
