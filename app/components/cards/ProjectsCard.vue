<script setup lang="ts">
import type { Project } from '~/config/site'

defineProps<{ projects: Project[] }>()
</script>

<template>
  <BaseCard>
    <SectionTitle icon="lucide:folder-git-2" title="项目" subtitle="一些正在维护的作品" />
    <div class="grid">
      <article v-for="project in projects" :key="project.title" class="project">
        <header class="head">
          <span class="icon-badge">
            <Icon :name="project.icon" size="17" />
          </span>
          <h3 class="title">{{ project.title }}</h3>
        </header>

        <p class="desc">{{ project.description }}</p>

        <footer class="foot">
          <ul class="tags">
            <li v-for="tag in project.tags" :key="tag">
              <TagPill :label="tag" />
            </li>
          </ul>
          <div class="links">
            <a
              v-if="project.repo"
              :href="project.repo"
              target="_blank"
              rel="noopener"
              aria-label="仓库"
              class="link"
            >
              <Icon name="lucide:github" size="16" />
            </a>
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener"
              aria-label="演示"
              class="link"
            >
              <Icon name="lucide:external-link" size="16" />
            </a>
          </div>
        </footer>
      </article>
    </div>
  </BaseCard>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.85rem;
}

.project {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.2s, background 0.2s;
}

.project:hover {
  background: var(--surface-hover);
  border-color: rgba(255, 255, 255, 0.16);
}

.head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.icon-badge {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 0.55rem;
}

.title {
  font-size: 0.95rem;
  font-weight: 600;
}

.desc {
  flex-grow: 1;
  font-size: 0.85rem;
  color: var(--muted);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.links {
  display: flex;
  gap: 0.4rem;
}

.link {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--muted);
  border-radius: 0.45rem;
  transition: color 0.2s;
}

.link:hover {
  color: var(--text);
}
</style>
