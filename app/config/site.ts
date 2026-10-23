// 仓库注入数据的解析在 utils/repos.ts（?raw 静态导入，打包时读入，无需运行时请求）
import { mapRepos, reposData } from "../utils/repos";
import type {
  GameEntry,
  MediaSkill,
  SectionMeta,
  SkillGroup,
  SocialLink,
  TimelineItem,
} from "./types";

// 站点内容配置：页面数据的唯一来源，日常更新只改这里

// GitHub 用户名：基本信息与项目回退数据共用
const githubUser = "Takamiya-reborn";

// ---------- 内容数据 ----------

export const site = {
  // 基本信息
  profile: {
    name: "Takamiya",
    avatar: "/avatar.png",
    tagline: "Full-Stack Developer",
    location: "木炉星",
    bio: "编程也是一种艺术，只要倾注了自己的创意，哪怕不够高效、让人哭笑不得，也是乐趣所在。",
    githubUser,
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

  aboutCode: [
    "--这题一看就是要DP，看我操作...",
    "--我看暴力也不失为一个办法",
  ] as string[],

  aboutMedia: [
    "--调好每一个像素，拉好每一个曲线，做好每一帧过渡...",
    "--差不多得了，又不是造飞机火箭",
  ] as string[],

  aboutGames: ["--就乐意摇点轮椅...", "--原来强的一直是我"] as string[],

  media: [
    { name: "Photoshop", icon: "/icon/ps.png", desc: "图像处理" },
    { name: "Premiere Pro", icon: "/icon/pr.png", desc: "视频剪辑" },
    { name: "Illustrator", icon: "/icon/ai.png", desc: "矢量插画" },
    { name: "After Effects", icon: "/icon/ae.png", desc: "动效合成" },
  ] satisfies MediaSkill[],

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
        { name: "CSS", children: ["TailwindCSS"] },
        { name: "Vue", children: ["Nuxt"] },
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
        "Streamlit",
        "PyQt",
        { name: "Node.js", children: ["Electron"] },
        ".NET",
      ],
    },
    {
      title: "AI 与数据",
      icon: "lucide:brain-circuit",
      skills: [
        { name: "PyTorch", children: ["Ultralytics"] }, // YOLO 系基于 PyTorch
        { name: "Pandas", children: ["Polars"] }, // Polars 是 Pandas 的现代化替代
        "PydanticAI",
      ],
    },
    {
      title: "工具",
      icon: "lucide:wrench",
      // 路径：JS 工具链（npm → Vite）→ Python 工具链（uv）→ 容器化部署（Docker）
      skills: [{ name: "npm", children: ["Vite"] }, "uv", "Docker"],
    },
    {
      title: "游戏与 3D",
      icon: "lucide:gamepad-2",
      skills: ["Godot", "Unity", "Unreal Engine", "Blender"],
    },
  ] satisfies SkillGroup[],

  // 项目（GitHub API 失败时的回退数据）：直接由定时注入的 repos.json 映射而来，
  // 映射逻辑在 utils/repos.ts，与项目区组件共用，无需单独维护模板
  projects: mapRepos(reposData.repos ?? [], githubUser, 6),

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
  { id: "quote", num: "00", title: "Quote", subtitle: "Random · QUOTE" },
  { id: "about", num: "01", title: "关于我", subtitle: "SaveData.rpgsave" },
  { id: "skills", num: "02", title: "技能", subtitle: "板载技能" },
  { id: "projects", num: "03", title: "活跃仓库", subtitle: "自己捣鼓" },
  { id: "timeline", num: "04", title: "经历", subtitle: "commits" },
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
