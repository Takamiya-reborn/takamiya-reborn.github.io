// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/icon'],

  // 组件按文件名自动导入（不拼目录前缀）：cards/ProfileCard.vue → <ProfileCard>
  components: [{ path: '~/components', pathPrefix: false }],

  // 静态生成部署到 GitHub Pages（nuxt generate）
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },

  // 本仓库为用户主站 <user>.github.io，部署在根路径，无需设置 baseURL。
  // 若以后改用项目站（/<repo>/ 子路径），打开下面这行并替换仓库名：
  // app: { baseURL: '/<repo>/' },

  icon: {
    mode: 'css',
    cssLayer: 'base',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'Takamiya',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Takamiya 的个人主页 —— 关于我、技能、项目与联系方式。',
        },
        { name: 'theme-color', content: '#0b0e14' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  css: ['~/assets/css/main.css'],
})
