<script setup lang="ts">
import { easterEgg, sections, site, steamProfileUrl } from '~/config/site'

useHead({
  title: site.profile.name,
})

// 按 id 取章节元信息（标题/编号/副标题）；id 拼错时立即报错指出是哪个 id
const meta = (id: string) => {
  const section = sections.find((s) => s.id === id)
  if (!section) throw new Error(`site.ts 的 sections 缺少 id "${id}"`)
  return section
}

// ---------- 科乐美彩蛋 ----------
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
  // 色值引用 main.css 的六色主题池变量，浅色主题切换时自动跟随
  const colors = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)', 'var(--accent-5)', 'var(--accent-6)']
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

// rm -rf 彩蛋：nuked 后整页元素真卸载，只剩 Teleport 到 body 的终端
const { nuked } = useNuke()

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
    <SiteHeader v-if="!nuked" :socials="site.socials" />

    <!-- 氛围背景 -->
    <div v-if="!nuked" class="backdrop" aria-hidden="true">
      <span class="blob blob--indigo" />
      <span class="blob blob--cyan" />
      <span class="blob blob--violet" />
      <span class="grid-overlay" />
      <span class="noise" />
      <span class="float-icon" style="top: 18%; left: 5%; animation-delay: -1s; color: var(--accent)">
        <Icon name="lucide:gamepad-2" size="34" />
      </span>
      <span class="float-icon"
        style="top: 30%; right: 7%; animation-delay: -3.2s; animation-duration: 7.5s; color: var(--accent-4)">
        <Icon name="lucide:star" size="28" />
      </span>
      <span class="float-icon"
        style="bottom: 22%; left: 9%; animation-delay: -5s; animation-duration: 8s; color: var(--accent-2)">
        <Icon name="lucide:ghost" size="30" />
      </span>
      <span class="float-icon" style="bottom: 40%; right: 14%; animation-delay: -2.4s; color: var(--accent-6)">
        <Icon name="lucide:heart" size="24" />
      </span>
    </div>

    <!-- /weather 天气特效：阳光在背景层，雨压内容层，闪电盖全屏（nuked 后世界没了，天气随之消失） -->
    <WeatherFx v-if="!nuked" />

    <main class="container">
      <!-- 英雄区（内含终端，rm -rf 时整卡保留、终端 Teleport 走） -->
      <ProfileCard :profile="site.profile" />

      <template v-if="!nuked">
        <!-- quote 抽取器 -->
        <section id="quote" class="section">
          <SectionTitle :index="meta('quote').num" :title="meta('quote').title" :subtitle="meta('quote').subtitle" />
          <div v-reveal>
            <QuoteCard />
          </div>
        </section>

        <!-- 关于：四行棋盘式卡片+文字，DOM 统一文字在前，桌面端用 grid 定位翻转卡片朝向 -->
        <section id="about" class="section">
          <SectionTitle :index="meta('about').num" :title="meta('about').title" :subtitle="meta('about').subtitle" />
          <div class="about-rows">
            <div v-reveal class="about-row">
              <div class="about-text">
                <AboutCard :paragraphs="site.about" />
              </div>
              <div class="about-card">
                <GithubActivityCard :github-user="site.profile.githubUser" />
              </div>
            </div>

            <div v-reveal class="about-row about-row--flip">
              <div class="about-text">
                <p class="about-label">⌈ 不开longlong见祖宗 ⌋</p>
                <AboutCard :paragraphs="site.aboutCode" />
              </div>
              <div class="about-card">
                <LeetCodeCard />
              </div>
            </div>

            <div v-reveal class="about-row">
              <div class="about-text">
                <p class="about-label">⌈ 这里是不是差几个像素 ⌋</p>
                <AboutCard :paragraphs="site.aboutMedia" />
              </div>
              <div class="about-card">
                <MediaCard :items="site.media" />
              </div>
            </div>

            <div v-reveal class="about-row about-row--flip">
              <div class="about-text">
                <p class="about-label">⌈ 向着星辰...再见 ⌋</p>
                <AboutCard :paragraphs="site.aboutGames" />
              </div>
              <div class="about-card">
                <NowPlayingCard :games="site.games" :steam-url="steamProfileUrl" />
              </div>
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
      </template>

      <footer v-if="!nuked" class="footer">
        <p>
          © {{ new Date().getFullYear() }} · Built with
          <a href="https://nuxt.com" target="_blank" rel="noopener">Nuxt</a>
        </p>
        <p class="footer-hint">{{ easterEgg.hint }}</p>
      </footer>
    </main>

    <!-- 右侧目录：md 文档站风格，宽屏才显示 -->
    <SideToc v-if="!nuked" />

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
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  animation: drift 26s ease-in-out infinite alternate;
}

.blob--cyan {
  width: 32rem;
  height: 32rem;
  top: -10rem;
  right: -6rem;
  background: color-mix(in srgb, var(--accent-2) 13%, transparent);
  animation: drift 34s ease-in-out infinite alternate-reverse;
}

.blob--violet {
  width: 30rem;
  height: 30rem;
  bottom: -14rem;
  left: 32%;
  background: color-mix(in srgb, var(--accent-3) 11%, transparent);
  animation: drift 40s ease-in-out infinite alternate;
}

/* 顶部渐隐网格 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
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
  /* 上大下小：板块间距 = 本节 bottom + 下节 top，对称 padding 会让空白
     全堆在内容下方、显得没居中；标题锚在节首，底部收窄让内容落回中点 */
  padding-block: clamp(2.5rem, 7vh, 4rem) clamp(1.25rem, 3vh, 2rem);
  scroll-margin-top: 4.5rem;
}

/* 关于区：四行棋盘式「文字+卡片」，拉长战线、降低密度 */
.about-rows {
  display: flex;
  flex-direction: column;
  gap: clamp(3rem, 8vh, 5rem);
}

/* 每行文字与卡片左右并排、垂直居中；行2/行4 用 --flip 把卡片翻到左边 */
.about-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}

/* DOM 统一文字在前，桌面端仅调换网格位置，不影响移动端堆叠顺序 */
.about-row--flip .about-text {
  grid-column: 2;
  grid-row: 1;
}

.about-row--flip .about-card {
  grid-column: 1;
  grid-row: 1;
}

/* 配文小标签：与各卡片头部的 mono 标签同款 */
.about-label {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--muted);
  margin-bottom: 0.9rem;
}

@media (max-width: 56rem) {
  .about-row {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .about-row--flip .about-text,
  .about-row--flip .about-card {
    grid-column: auto;
    grid-row: auto;
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
  border: 1px solid var(--accent-border);
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
  box-shadow: 0 1rem 2.5rem var(--shadow-deep);
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

/* ---- 本组件专属关键帧 ---- */
@keyframes hue-spin {
  to {
    filter: hue-rotate(360deg);
  }
}

@keyframes drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(4rem, -2.5rem, 0) scale(1.12);
  }

  100% {
    transform: translate3d(-3rem, 2rem, 0) scale(0.95);
  }
}

@keyframes bob {
  0% {
    transform: translateY(0) rotate(-4deg);
  }

  100% {
    transform: translateY(-1.1rem) rotate(5deg);
  }
}

@keyframes drop {
  from {
    transform: translateY(-6vh) rotate(0deg);
  }

  to {
    transform: translateY(112vh) rotate(720deg);
  }
}
</style>
