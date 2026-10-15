<script setup lang="ts">
import type { SocialLink } from '~/config/site'

defineProps<{
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
</script>

<template>
  <BaseCard :hover="false" class="profile">
    <div class="avatar-wrap">
      <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name" class="avatar" />
      <span v-else class="avatar avatar--initial">{{ profile.name.charAt(0).toUpperCase() }}</span>
      <span class="status" :title="profile.status">
        <span class="dot" aria-hidden="true" />
        {{ profile.status }}
      </span>
    </div>

    <div class="heading">
      <h1 class="name">{{ profile.name }}</h1>
      <p class="tagline">{{ profile.tagline }}</p>
    </div>

    <p class="bio">{{ profile.bio }}</p>

    <p class="meta">
      <Icon name="lucide:map-pin" size="16" />
      {{ profile.location }}
    </p>

    <nav class="socials" aria-label="社交链接">
      <a
        v-for="social in socials"
        :key="social.label"
        :href="social.url"
        target="_blank"
        rel="noopener"
        :aria-label="social.label"
        :title="social.label"
        class="social-btn"
      >
        <Icon :name="social.icon" size="18" />
      </a>
    </nav>
  </BaseCard>
</template>

<style scoped>
.profile {
  justify-content: center;
}

.avatar-wrap {
  position: relative;
  width: fit-content;
}

.avatar {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  object-fit: cover;
}

.avatar--initial {
  display: grid;
  place-items: center;
  font-size: 2.25rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--accent), #2dd4bf);
}

.status {
  position: absolute;
  left: 0.25rem;
  bottom: -0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.15rem 0.6rem;
  font-size: 0.72rem;
  white-space: nowrap;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px #34d399;
}

.heading {
  margin-top: 0.75rem;
}

.name {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.tagline {
  color: var(--accent);
  font-size: 0.95rem;
}

.bio {
  color: var(--muted);
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  color: var(--muted);
}

.socials {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.social-btn {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: color 0.2s, border-color 0.2s, transform 0.2s;
}

.social-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  transform: translateY(-2px);
}
</style>
