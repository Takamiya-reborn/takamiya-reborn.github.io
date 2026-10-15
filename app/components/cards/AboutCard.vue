<script setup lang="ts">
defineProps<{ paragraphs: string[] }>()
</script>

<template>
  <div class="about">
    <p v-for="(paragraph, i) in paragraphs" :key="i" class="paragraph">
      {{ paragraph }}
    </p>
  </div>
</template>

<style scoped>
.about {
  max-width: 38rem;
}

.paragraph {
  font-size: 1.02rem;
  line-height: 1.9;
  color: var(--muted);
}

.paragraph+.paragraph {
  margin-top: 0.8rem;
}
</style>
