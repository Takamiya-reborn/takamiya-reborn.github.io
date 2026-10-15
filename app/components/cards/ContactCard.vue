<script setup lang="ts">
import type { SocialLink } from '~/config/site'

defineProps<{ socials: SocialLink[] }>()
</script>

<template>
  <BaseCard>
    <SectionTitle
      icon="lucide:message-circle-heart"
      title="联系我"
      subtitle="欢迎通过任意渠道找到我"
    />
    <ul class="links">
      <li v-for="social in socials" :key="social.label">
        <a :href="social.url" target="_blank" rel="noopener" class="link">
          <span class="icon-badge">
            <Icon :name="social.icon" size="17" />
          </span>
          <span class="label">{{ social.label }}</span>
          <Icon name="lucide:arrow-up-right" size="15" class="arrow" />
        </a>
      </li>
    </ul>
  </BaseCard>
</template>

<style scoped>
.links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.6rem;
}

.link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}

.link:hover {
  background: var(--surface-hover);
  border-color: var(--accent);
}

.icon-badge {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 0.55rem;
}

.label {
  flex-grow: 1;
  font-size: 0.9rem;
}

.arrow {
  color: var(--muted);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.link:hover .arrow {
  opacity: 1;
  transform: translate(1px, -1px);
}
</style>
