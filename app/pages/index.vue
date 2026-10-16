<script setup lang="ts">
import { easterEgg, sections, site } from '~/config/site'

useHead({
  title: site.profile.name,
})

// 按 id 取章节元信息（标题/编号/副标题）；id 拼错时立即报错指出是哪个 id
const meta = (id: string) => {
  const section = sections.find((s) => s.id === id)
  if (!section) throw new Error(`site.ts 的 sections 缺少 id "${id}"`)
  return section
}

// ---------- 科乐美秘技彩蛋 ----------
interface ConfettiPiece {
  id: number
  left: number
  delay: number
  dur: number
  size: number
  color: string
  round: boolean
}

const confetti = ref<ConfettiPiece[]>([])
const partyMode = ref(false)
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
let partyTimer: ReturnType<typeof setTimeout> | undefined

function celebrate() {
  const colors = ['#818cf8', '#22d3ee', '#c084fc', '#fbbf24', '#34d399', '#fb7185']
  confetti.value = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 2.4 + Math.random() * 1.6,
    size: 6 + Math.random() * 7,
    color: colors[i % colors.length]!,
    round: Math.random() > 0.5,
  }))
  partyMode.value = true
  toast.value = easterEgg.toast

  clearTimeout(toastTimer)
  clearTimeout(partyTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2600)
  partyTimer = setTimeout(() => {
    confetti.value = []
    partyMode.value = false
  }, 4200)
}

useKonami(celebrate, easterEgg.keys)

// ---------- 进站成就（Xbox 风格弹窗） ----------
const achievement = ref(false)
let achievementTimers: ReturnType<typeof setTimeout>[] = []

onMounted(() => {
  achievementTimers = [
    setTimeout(() => (achievement.value = true), 1600),
    setTimeout(() => (achievement.value = false), 6600),
  ]
})

onUnmounted(() => achievementTimers.forEach(clearTimeout))
</script>

<template>
  <div id="top" class="page" :class="{ 'page--party': partyMode }">
    <SiteHeader :socials="site.socials" />

    <!-- 氛围背景 -->
    <div class="backdrop" aria-hidden="true">
      <span class="blob blob--indigo" />
      <span class="blob blob--cyan" />
      <span class="blob blob--violet" />
      <span class="grid-overlay" />
      <span class="noise" />
      <span class="float-icon" style="top: 18%; left: 5%; animation-delay: -1s; color: #818cf8">
        <Icon name="lucide:gamepad-2" size="34" />
      </span>
      <span class="float-icon"
        style="top: 30%; right: 7%; animation-delay: -3.2s; animation-duration: 7.5s; color: #fbbf24">
        <Icon name="lucide:star" size="28" />
      </span>
      <span class="float-icon"
        style="bottom: 22%; left: 9%; animation-delay: -5s; animation-duration: 8s; color: #22d3ee">
        <Icon name="lucide:ghost" size="30" />
      </span>
      <span class="float-icon" style="bottom: 40%; right: 14%; animation-delay: -2.4s; color: #fb7185">
        <Icon name="lucide:heart" size="24" />
      </span>
    </div>

    <main class="container">
      <!-- 英雄区 -->
      <ProfileCard :profile="site.profile" />

      <!-- quote 抽取器 -->
      <section id="quote" class="section">
        <SectionTitle :index="meta('quote').num" :title="meta('quote').title" :subtitle="meta('quote').subtitle" />
        <div v-reveal>
          <QuoteCard />
        </div>
      </section>

      <!-- 关于 -->
      <section id="about" class="section">
        <SectionTitle :index="meta('about').num" :title="meta('about').title" :subtitle="meta('about').subtitle" />
        <div class="about-grid">
          <div v-reveal class="about-main">
            <AboutCard :paragraphs="site.about" />
            <MediaCard :items="site.media" />
            <NowPlayingCard :games="site.games" />
          </div>
          <div v-reveal="{ delay: 140 }" class="about-side">
            <GithubActivityCard :github-user="site.profile.githubUser" />
            <AboutCard :paragraphs="site.aboutSide" />
          </div>
        </div>
      </section>

      <!-- 技能 -->
      <section id="skills" class="section">
        <SectionTitle :index="meta('skills').num" :title="meta('skills').title" :subtitle="meta('skills').subtitle" />
        <SkillsCard :groups="site.skillGroups" />
      </section>

      <!-- 项目 -->
      <section id="projects" class="section">
        <SectionTitle :index="meta('projects').num" :title="meta('projects').title"
          :subtitle="meta('projects').subtitle" />
        <ProjectsCard :projects="site.projects" />
      </section>

      <!-- 经历 -->
      <section id="timeline" class="section">
        <SectionTitle :index="meta('timeline').num" :title="meta('timeline').title"
          :subtitle="meta('timeline').subtitle" />
        <div class="timeline-wrap">
          <TimelineCard :items="site.timeline" />
        </div>
      </section>

      <footer class="footer">
        <p>
          © {{ new Date().getFullYear() }} {{ site.profile.name }} · Built with
          <a href="https://nuxt.com" target="_blank" rel="noopener">Nuxt</a>
        </p>
        <p class="footer-hint">{{ easterEgg.hint }}</p>
      </footer>
    </main>

    <!-- 右侧目录：md 文档站风格，宽屏才显示 -->
    <SideToc />

    <!-- 彩蛋：五彩纸屑 + toast -->
    <div class="confetti-layer" aria-hidden="true">
      <span v-for="p in confetti" :key="p.id" class="confetti" :style="{
        left: `${p.left}%`,
        width: `${p.size}px`,
        height: `${p.round ? p.size : p.size * 0.45}px`,
        background: p.color,
        borderRadius: p.round ? '50%' : '1px',
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.dur}s`,
      }" />
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </Transition>

    <!-- Xbox 风格成就弹窗 -->
    <Transition name="achv">
      <div v-if="achievement" class="achv" role="status">
        <span class="achv-icon">
          <Icon name="lucide:trophy" size="22" />
        </span>
        <div class="achv-body">
          <p class="achv-title">{{ easterEgg.achievement.title }}</p>
          <p class="achv-desc">{{ easterEgg.achievement.desc }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
}

/* ---- 氛围背景 ---- */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: var(--bg);
}

.page--party .backdrop {
  animation: hue-spin 2.5s linear infinite;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  will-change: transform;
}

.blob--indigo {
  width: 38rem;
  height: 38rem;
  top: -14rem;
  left: -8rem;
  background: rgba(99, 102, 241, 0.2);
  animation: drift 26s ease-in-out infinite alternate;
}

.blob--cyan {
  width: 32rem;
  height: 32rem;
  top: -10rem;
  right: -6rem;
  background: rgba(34, 211, 238, 0.13);
  animation: drift 34s ease-in-out infinite alternate-reverse;
}

.blob--violet {
  width: 30rem;
  height: 30rem;
  bottom: -14rem;
  left: 32%;
  background: rgba(192, 132, 252, 0.11);
  animation: drift 40s ease-in-out infinite alternate;
}

/* 顶部渐隐网格 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 25%, transparent 75%);
  mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 25%, transparent 75%);
}

/* 细腻噪点，去掉渐变的"塑料感" */
.noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  opacity: 0.05;
}

/* 漂浮的游戏图标 */
.float-icon {
  position: absolute;
  opacity: 0.16;
  animation: bob 6s ease-in-out infinite alternate;
}

/* ---- 主容器 ---- */
.container {
  max-width: 76rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 3vw, 2.5rem);
}

.section {
  padding-block: clamp(2.5rem, 7vh, 4rem);
  scroll-margin-top: 4.5rem;
}

/* 关于区：左文右卡，右卡下沉错位 */
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: clamp(2.5rem, 6vw, 5rem);
  align-items: start;
}

/* 左列：文字 + 游戏卡片纵排；下边距补偿游戏卡片下沉的 8rem */
.about-main {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin-bottom: 9rem;
}

/* 右列：GitHub 卡片 + 补充文本纵排 */
.about-side {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

@media (max-width: 56rem) {
  .about-grid {
    grid-template-columns: 1fr;
  }

  .about-side {
    margin-bottom: 0;
  }
}

/* 经历区右移错位 */
.timeline-wrap {
  padding-left: clamp(0px, 5vw, 3.5rem);
}

.footer {
  padding-block: 2.5rem 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
}

.footer a {
  color: var(--text);
  text-decoration-color: var(--accent);
  transition: color 0.2s;
}

.footer a:hover {
  color: var(--accent-2);
}

.footer-hint {
  margin-top: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  opacity: 0.6;
}

/* ---- 彩蛋层 ---- */
.confetti-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow: hidden;
  pointer-events: none;
}

.confetti {
  position: absolute;
  top: 0;
  animation: drop linear forwards;
}

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 70;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--bg-soft);
  border: 1px solid rgba(129, 140, 248, 0.45);
  border-radius: 999px;
  box-shadow: var(--glow);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s var(--ease-bouncy);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}

/* ---- Xbox 风格成就弹窗 ---- */
.achv {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.1rem;
  background: var(--bg-soft);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.5);
}

.achv-icon {
  display: grid;
  place-items: center;
  width: 2.8rem;
  height: 2.8rem;
  color: #3fd16f;
  background: rgba(16, 124, 16, 0.18);
  border: 1px solid rgba(63, 209, 111, 0.4);
  border-radius: var(--radius-sm);
}

.achv-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.achv-desc {
  font-size: 0.76rem;
  color: var(--muted);
}

.achv-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.45s var(--ease-bouncy);
}

.achv-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.achv-enter-from,
.achv-leave-to {
  opacity: 0;
  transform: translateX(120%);
}
</style>
