import type {
  GameEntry,
  Project,
  SectionMeta,
  SkillGroup,
  SocialLink,
  TimelineItem,
} from "./types";

// 站点内容配置：页面数据的唯一来源，日常更新只改这里

// ---------- 内容数据 ----------

export const site = {
  // 基本信息
  profile: {
    name: "Takamiya",
    // 头像图片地址；public/avatar.png 由定时任务从 GitHub 拉取，留空则显示首字母渐变占位头像
    avatar: "/avatar.png",
    tagline: "Full-Stack Developer",
    // 打字机轮播的身份标签（首位为静态回退文案）
    roles: [
      "Full-Stack Developer",
      "AI & ML 探索者",
      "Game / 3D Dev 爱好者",
      "Game Enthusiast 🎮",
    ],
    location: "木炉星",
    // 一句话签名
    bio: "专注于全栈与 AI，构建跑得稳、用得顺的系统。",
    // GitHub 用户名，项目区据此动态拉取仓库
    githubUser: "Takamiya-reborn",
  },

  // 社交链接
  socials: [
    {
      label: "GitHub",
      icon: "lucide:github",
      url: "https://github.com/Takamiya-reborn",
    },
    {
      label: "Bilibili",
      icon: "simple-icons:bilibili",
      url: "https://space.bilibili.com/1573097602",
    },
    {
      label: "Steam",
      icon: "simple-icons:steam",
      url: "https://steamcommunity.com/profiles/76561199163260767/",
    },
    {
      label: "Pixiv",
      icon: "simple-icons:pixiv",
      url: "https://www.pixiv.net/users/97966543",
    },
    {
      label: "Email",
      icon: "lucide:mail",
      url: "mailto:wzy15091712036@outlook.com",
    },
  ] satisfies SocialLink[],

  games: [
    {
      title: "宝可梦 朱／紫",
      platform: "ns",
      note: "多拉贡荡死",
    },
    {
      title: "Minecraft",
      platform: "xbox",
      note: "这几百个模组加上，不得牛逼炸了",
    },
    {
      title: "Terraria",
      platform: "steam",
      steamAppId: 105600,
      liveNote: "achievements",
      defaultStats: {
        playtimeMinutes: 35738,
        achievements: { unlocked: 137, total: 137 },
      },
    },
    {
      title: "饥荒联机版",
      platform: "steam",
      steamAppId: 322330,
      liveNote: "playtime",
      defaultStats: {
        playtimeMinutes: 18742,
        achievements: null,
      },
    },
  ] satisfies GameEntry[],

  // 关于我
  about: [
    "Hi，我是 Takamiya，一名兴趣驱动开发者。",
    "专注于全栈开发 🌏 与人工智能 🧿 —— 信奉在构建可扩展、高性能系统的同时，保持直观易用的交互体验。",
    "工程之外，对很多领域充满好奇：历史 🗿、医学 🩺、音乐 🎹、绘画 🎨、生物 🦖 与天文 🔭 等等。",
    "随时欢迎有意义的技术交流与合作项目。",
  ] as string[],

  // 关于区右列、GitHub 卡片下方的补充段落（与左侧关于我同级的纯文本）
  aboutSide: [
    "代码之外，游戏之内。这个站点本身就是一个存档点：记录我正在做什么、在玩什么、走到了哪里。",
    "如果某个项目或想法让你感兴趣，欢迎随时来信。",
  ] as string[],

  // 技能分组
  skillGroups: [
    {
      title: "编程语言",
      icon: "lucide:braces",
      skills: [
        "Python",
        { name: "JavaScript", children: ["TypeScript"] },
        "C++",
        "Go",
      ],
    },
    {
      title: "前端与图形",
      icon: "lucide:layout",
      skills: [
        "HTML",
        "CSS",
        { name: "Vue", children: ["Nuxt"] },
        "TailwindCSS",
        "Anime.js",
        "Konva",
      ],
    },
    {
      title: "后端与桌面",
      icon: "lucide:server",
      skills: [
        "Django",
        "Flask",
        "PyQt",
        "Streamlit",
        { name: "Node.js", children: ["Electron"] },
        ".NET",
      ],
    },
    {
      title: "AI 与数据",
      icon: "lucide:brain-circuit",
      skills: ["PyTorch", "Pandas", "Polars", "Ultralytics", "PydanticAI"],
    },
    {
      title: "工具",
      icon: "lucide:wrench",
      skills: ["Docker", "Vite", "npm", "uv"],
    },
    {
      title: "游戏与 3D",
      icon: "lucide:gamepad-2",
      skills: ["Godot", "Unity", "Unreal Engine", "Blender"],
    },
  ] satisfies SkillGroup[],

  // 项目（GitHub API 失败时的回退数据）
  projects: [
    {
      title: "Project Alpha",
      description: "一个示例项目，替换成你自己的项目介绍即可。",
      tags: ["Nuxt", "TypeScript"],
      repo: "https://github.com/Takamiya-reborn",
      icon: "lucide:rocket",
    },
    {
      title: "Project Beta",
      description: "第二个示例项目，支持配置演示链接与仓库链接。",
      tags: ["Go", "PostgreSQL"],
      link: "https://example.com",
      repo: "https://github.com/Takamiya-reborn",
      icon: "lucide:flask-conical",
    },
  ] satisfies Project[],

  // 时间线（倒序）
  timeline: [
    {
      period: "2023 — 至今",
      title: "大学本科",
      org: "西安邮电大学",
      description: "西安邮电大学 - 计算机学院 - 软件工程",
    },
  ] satisfies TimelineItem[],
} as const;

export type Site = typeof site;

// 章节元信息：驱动章节标题与导航锚点，id 对应 index.vue 的 <section id>
// 首条 Intro 指向页面顶部的 #top（英雄区），不渲染章节标题，只供目录与回顶跳转
export const sections = [
  { id: "top", num: "", title: "Intro" },
  { id: "quote", num: "00", title: "Quote", subtitle: "随机抽取 · QUOTE" },
  { id: "about", num: "01", title: "关于我", subtitle: "玩家档案 · PLAYER 1" },
  { id: "skills", num: "02", title: "技能", subtitle: "已点亮的技能树" },
  { id: "projects", num: "03", title: "项目", subtitle: "主线成就展示" },
  { id: "timeline", num: "04", title: "经历", subtitle: "存档记录" },
] satisfies SectionMeta[];

// 彩蛋与提示文案
// 秘技按键序列：页脚提示与 useKonami 的监听都从这里取，只改这一处
const konamiKeys = ["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"] as const;

export const easterEgg = {
  // 秘技按键序列，传给 useKonami
  keys: konamiKeys,
  // 页脚的彩蛋提示
  hint: `隐藏彩蛋：${konamiKeys.join(" ")}`,
  // 秘技触发后的 toast
  toast: "🎮 秘技发动！你发现了彩蛋",
  // 进站成就弹窗
  achievement: {
    title: "成就已解锁",
    desc: "初次造访 Takamiya 的主页",
  },
} as const;
