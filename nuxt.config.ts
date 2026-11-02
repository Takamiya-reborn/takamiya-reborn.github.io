// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/icon"],

  // 组件按文件名自动导入（不拼目录前缀）：cards/ProfileCard.vue → <ProfileCard>
  components: [{ path: "~/components", pathPrefix: false }],

  // 静态生成部署到 GitHub Pages（nuxt generate）
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  },

  hooks: {
    // clientBundle.scan 只认源码字面量，site.ts（社交/技能分组）和 repos.ts
    // （仓库语言映射）里以配置字符串形式传给 <Icon :name> 的图标扫不到，
    // 线上会运行时回退请求 api.iconify.design（国内被墙）导致图标加载慢/失败。
    // 这里把这些文件里的图标名显式并入打包清单，新加图标只需改这两个文件
    "icon:clientBundleIcons"(icons) {
      for (const file of ["app/config/site.ts", "app/utils/repos.ts"]) {
        const text = readFileSync(resolve(file), "utf-8");
        for (const m of text.matchAll(/(?:lucide|simple-icons):[a-z0-9-]+/g)) {
          icons.add(m[0]);
        }
      }
    },
  },

  // 本仓库为用户主站 <user>.github.io，部署在根路径，无需设置 baseURL。
  // 若以后改用项目站（/<repo>/ 子路径），打开下面这行并替换仓库名：
  // app: { baseURL: '/<repo>/' },

  icon: {
    mode: "css",
    cssLayer: "base",
    // 静态部署无服务端，构建时扫描源码内全部图标打进客户端 CSS，避免运行时请求 api.iconify.design（国内被墙）
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: "zh-CN" },
      title: "Takamiya",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Takamiya 的个人主页 —— 关于我、技能、项目与联系方式。",
        },
        { property: "og:title", content: "Takamiya" },
        {
          property: "og:description",
          content: "Takamiya 的个人主页 —— 关于我、技能、项目与联系方式。",
        },
        { property: "og:type", content: "website" },
        { name: "theme-color", content: "#06070d" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        // 字体分片按 unicode-range 按需加载，没有单一入口文件可 preload
      ],
    },
  },

  // 节日主题覆盖块一主题一文件放 assets/css/themes/，在此挂载；注册表见 composables/useHoliday.ts
  css: [
    "~/assets/fonts/hyw/result.css",
    "~/assets/css/main.css",
    "~/assets/css/themes/halloween.css",
  ],
});
