<script setup lang="ts">
import { site } from '~/config/site'
import type { Project } from '~/config/types'

const props = defineProps<{ projects: Project[] }>()

// 构建时注入的仓库数据里取最活跃的前 6 个，数据缺失时回退到静态配置
const { projects } = useGitHubProjects(
  site.profile.githubUser,
  props.projects,
  6,
)
</script>

<template>
  <div class="projects">
    <article v-for="(project, i) in projects" :key="project.title" v-reveal="{ delay: i * 100 }" class="project">
      <span class="icon-badge">
        <Icon :name="project.icon" size="20" />
      </span>

      <div class="body">
        <header class="head">
          <h3 class="title">{{ project.title }}</h3>
          <div class="links">
            <a v-if="project.repo" :href="project.repo" target="_blank" rel="noopener" aria-label="仓库" class="link">
              <Icon name="lucide:github" size="17" />
            </a>
            <a v-if="project.link" :href="project.link" target="_blank" rel="noopener" aria-label="演示" class="link">
              <Icon name="lucide:external-link" size="17" />
            </a>
          </div>
        </header>

        <!-- 无简介时渲染不换行空格撑住行高，避免两列卡片高度不齐 -->
        <p class="desc">{{ project.description || ' ' }}</p>

        <ul class="tags">
          <li v-for="tag in project.tags" :key="tag">
            <TagPill :label="tag" />
          </li>
        </ul>
      </div>
    </article>
  </div>
</template>

<style scoped>
.projects {
  display: grid;
  gap: 1rem;
}

/* 宽屏两列，窄屏回落单列 */
@media (min-width: 720px) {
  .projects {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

.project {
  position: relative;
  display: flex;
  gap: 1.1rem;
  padding: 1.3rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition:
    border-color 0.25s,
    transform 0.35s var(--ease-bouncy),
    box-shadow 0.3s;
}

/* 玻璃背景独立到 ::before：backdrop-filter 与悬停倾斜同元素时文字会糊 */
.project::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--surface);
  backdrop-filter: blur(12px);
  transition: background 0.25s;
}

.project:hover {
  border-color: rgba(129, 140, 248, 0.45);
  transform: translateY(-4px) rotate(-0.5deg);
  box-shadow: var(--glow);
}

.project:hover::before {
  background: var(--surface-hover);
}

.icon-badge {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  color: var(--accent);
  background: linear-gradient(135deg, var(--accent-soft), rgba(34, 211, 238, 0.1));
  border: 1px solid rgba(129, 140, 248, 0.2);
  border-radius: var(--radius-sm);
  transition: transform 0.35s var(--ease-bouncy);
}

.project:hover .icon-badge {
  transform: scale(1.12) rotate(-10deg);
}

.body {
  flex-grow: 1;
  min-width: 0;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
}

.links {
  display: flex;
  gap: 0.35rem;
}

/* 淡底色 + 描边提示可点击 */
.link {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.45rem;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s,
    transform 0.3s var(--ease-bouncy);
}

.link:hover {
  color: var(--accent-2);
  background: var(--accent-soft);
  border-color: rgba(34, 211, 238, 0.4);
  transform: translateY(-2px);
}

.desc {
  margin-top: 0.45rem;
  font-size: 0.9rem;
  line-height: 1.75;
  color: var(--muted);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.7rem;
}
</style>
