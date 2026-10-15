<script setup lang="ts">
import type { SocialLink } from '~/config/types'

const props = defineProps<{ socials: SocialLink[] }>()

// 导航栏右侧放平台图标 + 邮箱，RSS 不放
const headerSocials = computed(() =>
  props.socials.filter((s) => !['RSS'].includes(s.label)),
)
</script>

<template>
  <header class="header">
    <nav class="inner" aria-label="站内导航">
      <a href="#top" class="logo">
        Takamiya
        <span class="logo-dot" aria-hidden="true" />
      </a>

      <div class="socials">
        <a v-for="social in headerSocials" :key="social.label" :href="social.url" target="_blank" rel="noopener"
          :aria-label="social.label" :title="social.label" class="icon-btn">
          <Icon :name="social.icon" size="17" />
        </a>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  background: rgba(6, 7, 13, 0.65);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}

.inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  max-width: 76rem;
  margin-inline: auto;
  padding: 0.8rem clamp(1rem, 3vw, 2.5rem);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.02em;
}

.logo-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #34d399;
  animation: pulse-dot 2.2s ease-out infinite;
}

.socials {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition:
    color 0.2s,
    border-color 0.2s,
    transform 0.3s var(--ease-bouncy);
}

.icon-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  transform: translateY(-3px);
}
</style>
