<script setup lang="ts">
import { easterEgg, sections, site, steamProfileUrl } from '~/config/site'

useHead({
  title: site.profile.name,
})

// 按 id 取章节元信息；id 拼错立即报错
const meta = (id: string) => {
  const section = sections.find((s) => s.id === id)
  if (!section) throw new Error(`site.ts 的 sections 缺少 id "${id}"`)
  return section
}

// rm -rf 彩蛋：nuked 后整页元素真卸载，只剩 Teleport 到 body 的终端
const { nuked } = useNuke()
</script>

<template>
  <div id="top" class="page">
    <SiteHeader v-if="!nuked" :socials="site.socials" />

    <!-- 氛围背景 -->
    <BackdropFx v-if="!nuked" />

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

    <!-- 彩蛋层：confetti + toast + 进站成就 -->
    <EasterEggLayer />
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
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
  /* 锚点跳转落点让开固定头部（头部高 ≈ 3.85rem），标题不被盖住 */
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

  /* 窄屏单列堆叠：倾斜卡是 max-width 27~30rem 的固定窄块，居中放置
     才落在整页中轴上，不再整体偏左；配文列是流式宽度不受影响 */
  .about-card {
    display: flex;
    justify-content: center;
  }

  /* 经历区右移错位是桌面端的排版花样，窄屏单列下回归与其他板块同轴 */
  .timeline-wrap {
    padding-left: 0;
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
</style>
