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
        <Icon name="lucide:sparkle" size="16" class="logo-icon" aria-hidden="true" />
        <span class="logo-text">Takamiya</span>
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
  background: color-mix(in srgb, var(--bg) 65%, transparent);
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
  gap: 0.4rem;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.02em;
}

/* 名字前的 sparkle 图标：SVG 吃不到 background-clip: text，
   改用同节奏的 color 关键帧跟着渐变一起变色 */
.logo-icon {
  color: var(--accent-2);
  animation: sparkle-pan 7s ease-in-out infinite;
}

@keyframes sparkle-pan {

  0%,
  100% {
    color: var(--accent-2);
  }

  50% {
    color: var(--accent);
  }
}

/* 昵称与内容区大标题同款：流动渐变文字 */
.logo-text {
  background: linear-gradient(100deg,
      var(--gradient-soft) 10%,
      var(--accent) 45%,
      var(--accent-2) 60%,
      var(--gradient-soft) 92.5%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-pan 7s ease-in-out infinite;
}

@keyframes gradient-pan {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition:
    color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.3s var(--ease-bouncy);
}

.icon-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  box-shadow: 0 4px 16px var(--accent-soft);
  transform: translateY(-3px);
}
</style>
