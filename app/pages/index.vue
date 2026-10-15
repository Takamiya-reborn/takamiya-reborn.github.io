<script setup lang="ts">
import { site } from '~/config/site'

useHead({
  title: site.profile.name,
})
</script>

<template>
  <div class="page">
    <div class="backdrop" aria-hidden="true" />

    <main class="bento">
      <!-- 头像 / 名片：大卡，占两行 -->
      <ProfileCard
        class="area-profile"
        :profile="site.profile"
        :socials="site.socials"
      />

      <AboutCard class="area-about" :paragraphs="site.about" />

      <SkillsCard class="area-skills" :groups="site.skillGroups" />

      <ProjectsCard class="area-projects" :projects="site.projects" />

      <TimelineCard class="area-timeline" :items="site.timeline" />

      <ContactCard class="area-contact" :socials="site.socials" />

      <footer class="footer">
        <p>
          © {{ new Date().getFullYear() }} {{ site.profile.name }} · Built with
          <a href="https://nuxt.com" target="_blank" rel="noopener">Nuxt</a>
        </p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  padding: clamp(1rem, 3vw, 2.5rem);
}

/* 顶部氛围光斑 */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(40rem 24rem at 15% -10%, rgba(99, 102, 241, 0.18), transparent 60%),
    radial-gradient(36rem 22rem at 90% 0%, rgba(45, 212, 191, 0.12), transparent 60%);
}

/* ---- Bento 网格：加新卡片时在这里声明一个 area 即可 ---- */
.bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: auto;
  gap: var(--gap);
  max-width: 72rem;
  margin-inline: auto;
}

.area-profile  { grid-column: span 5; grid-row: span 2; }
.area-about    { grid-column: span 7; }
.area-skills   { grid-column: span 7; }
.area-projects { grid-column: span 7; }
.area-timeline { grid-column: span 5; }
.area-contact  { grid-column: span 12; }

.footer {
  grid-column: span 12;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  padding-block: 0.5rem;
}

.footer a {
  color: var(--text);
  text-decoration-color: var(--accent);
}

@media (max-width: 64rem) {
  .area-profile  { grid-column: span 12; grid-row: auto; }
  .area-about,
  .area-skills,
  .area-projects,
  .area-timeline { grid-column: span 6; }
  .area-contact  { grid-column: span 12; }
}

@media (max-width: 48rem) {
  .bento > :not(.footer) {
    grid-column: span 12 !important;
  }
}
</style>
