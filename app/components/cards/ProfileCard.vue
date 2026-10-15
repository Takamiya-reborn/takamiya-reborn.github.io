<script setup lang="ts">
import { site } from '~/config/site'
import type { SocialLink } from '~/config/types'

const props = defineProps<{
  profile: {
    name: string
    avatar: string
    tagline: string
    location: string
    bio: string
    status: string
  }
  socials: SocialLink[]
}>()

// 打字机轮播身份标签，回退到静态 tagline
const roles = computed(() =>
  site.profile.roles.length > 0 ? [...site.profile.roles] : [props.profile.tagline],
)
const { text: typedRole } = useTypewriter(() => roles.value)

const emailUrl = computed(
  () => props.socials.find((s) => s.label === 'Email')?.url ?? '#',
)
</script>

<template>
  <section class="hero">
    <div v-reveal class="hero-main">
      <p class="status">
        <span class="dot" aria-hidden="true" />
        {{ profile.status }}
      </p>

      <h1 class="name">{{ profile.name }}</h1>

      <p class="tagline">
        <span class="prompt" aria-hidden="true">&gt;</span>
        {{ typedRole || profile.tagline }}
        <span class="caret" aria-hidden="true" />
      </p>

      <p class="bio">{{ profile.bio }}</p>

      <p class="meta">
        <Icon name="lucide:map-pin" size="15" />
        {{ profile.location }}
      </p>

      <div class="actions">
        <a href="#projects" class="btn">
          看看我的战利品
          <Icon name="lucide:arrow-down" size="16" />
        </a>
        <a :href="emailUrl" class="btn btn--ghost">
          <Icon name="lucide:mail" size="16" />
          发邮件
        </a>
      </div>
    </div>

    <div v-reveal="{ delay: 150 }" class="hero-art">
      <div class="avatar-zone">
        <span class="avatar-glow" aria-hidden="true" />
        <div class="avatar-ring">
          <span class="ring-spin" aria-hidden="true" />
          <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name" class="avatar" />
          <span v-else class="avatar avatar--initial">
            {{ profile.name.charAt(0).toUpperCase() }}
          </span>
        </div>
        <!-- 漂浮的游戏徽章 -->
        <span class="orbit orbit-1" aria-hidden="true">
          <Icon name="lucide:gamepad-2" size="18" />
        </span>
        <span class="orbit orbit-2" aria-hidden="true">
          <Icon name="lucide:ghost" size="18" />
        </span>
        <span class="orbit orbit-3" aria-hidden="true">
          <Icon name="lucide:swords" size="18" />
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 4rem);
  padding-block: clamp(4rem, 10vh, 6.5rem) clamp(2.5rem, 7vh, 4.5rem);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.25rem 0.8rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #34d399;
  animation: pulse-dot 2.2s ease-out infinite;
}

.name {
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 8vw, 4.6rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.01em;
  background: linear-gradient(100deg,
      var(--text) 20%,
      var(--accent) 45%,
      var(--accent-2) 60%,
      var(--text) 85%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-pan 7s ease-in-out infinite;
}

.tagline {
  display: flex;
  align-items: center;
  min-height: 1.7em;
  margin-top: 0.6rem;
  font-family: var(--font-mono);
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: var(--accent-2);
}

.prompt {
  margin-right: 0.5rem;
  color: var(--accent);
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 3px;
  background: var(--accent-2);
  animation: blink 1s step-end infinite;
}

.bio {
  max-width: 34rem;
  margin-top: 1.1rem;
  font-size: 1.05rem;
  line-height: 1.85;
  color: var(--muted);
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.8rem;
  font-size: 0.88rem;
  color: var(--muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.6rem;
}

/* ---- 右侧头像区 ---- */
.hero-art {
  display: grid;
  place-items: center;
}

.avatar-zone {
  position: relative;
  width: fit-content;
}

.avatar-glow {
  position: absolute;
  inset: -3rem;
  background: radial-gradient(closest-side, rgba(129, 140, 248, 0.28), transparent);
  filter: blur(30px);
  pointer-events: none;
}

/* 旋转渐变光环头像（可以"捏一下"） */
.avatar-ring {
  position: relative;
  width: clamp(8rem, 14vw, 11rem);
  aspect-ratio: 1;
  cursor: pointer;
  transition: transform 0.3s var(--ease-bouncy);
}

.avatar-ring:active {
  transform: scale(0.9) rotate(-5deg);
}

.ring-spin {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
      var(--accent),
      var(--accent-2),
      var(--accent-3),
      var(--accent));
  animation: spin-slow 7s linear infinite;
}

.avatar {
  position: absolute;
  inset: 0.28rem;
  width: calc(100% - 0.56rem);
  height: calc(100% - 0.56rem);
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg);
}

.avatar--initial {
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 3.2rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
}

/* 环绕头像漂浮的游戏徽章 */
.orbit {
  position: absolute;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  color: var(--accent-2);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  backdrop-filter: blur(8px);
  animation: bob 5s ease-in-out infinite alternate;
}

.orbit-1 {
  top: -0.6rem;
  right: -1.6rem;
  color: #fbbf24;
  animation-delay: -1s;
}

.orbit-2 {
  bottom: 1.4rem;
  right: -2.4rem;
  color: #c084fc;
  animation-delay: -2.6s;
  animation-duration: 6.2s;
}

.orbit-3 {
  bottom: -0.9rem;
  left: -1.2rem;
  color: #34d399;
  animation-delay: -4s;
}

@media (max-width: 56rem) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-art {
    order: -1;
    justify-items: start;
  }

  .avatar-zone {
    margin-left: 0.5rem;
  }
}
</style>
