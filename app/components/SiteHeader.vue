<script setup lang="ts">
import { sections } from '~/config/site'
import type { SocialLink } from '~/config/types'

const props = defineProps<{ socials: SocialLink[] }>()

// 导航栏右侧只放平台类图标，邮箱留在名片里
const headerSocials = computed(() =>
  props.socials.filter((s) => !['Email', 'RSS'].includes(s.label)),
)

// 锚点导航由 site.ts 的 sections 生成
const links = computed(() =>
  sections.map((s) => ({ href: `#${s.id}`, num: s.num, text: s.title })),
)
</script>

<template>
  <header class="header">
    <nav class="inner" aria-label="站内导航">
      <a href="#top" class="logo">
        Takamiya
        <span class="logo-dot" aria-hidden="true" />
      </a>

      <div class="nav-links">
        <a v-for="link in links" :key="link.href" :href="link.href">
          <span class="num">{{ link.num }}.</span>{{ link.text }}
        </a>
      </div>

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

.nav-links {
  display: flex;
  gap: 1.4rem;
  margin-left: 0.5rem;
}

.nav-links a {
  position: relative;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -5px;
  width: 100%;
  height: 2px;
  background: var(--gradient);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s var(--ease-bouncy);
}

.nav-links a:hover {
  color: var(--text);
}

.nav-links a:hover::after {
  transform: scaleX(1);
}

.num {
  color: var(--accent);
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

@media (max-width: 42rem) {
  .nav-links {
    display: none;
  }
}
</style>
