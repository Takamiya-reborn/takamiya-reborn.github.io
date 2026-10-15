/**
 * 站点内容配置 —— 页面所有数据的唯一来源。
 *
 * 想改内容只动这个文件；想加新板块则：
 *   1. 在这里定义一个新的 section 数据
 *   2. 在 components/cards/ 下新建一个卡片组件
 *   3. 在 pages/index.vue 的网格里放进去
 */

// ---------- 类型定义 ----------

export interface SocialLink {
  /** 展示标签 */
  label: string
  /** lucide 图标名（不带 lucide: 前缀也可，会自动补全） */
  icon: string
  url: string
}

export interface SkillGroup {
  title: string
  icon: string
  skills: string[]
}

export interface Project {
  title: string
  description: string
  tags: string[]
  /** 演示地址（可选） */
  link?: string
  /** 仓库地址（可选） */
  repo?: string
  icon: string
}

export interface TimelineItem {
  period: string
  title: string
  org: string
  description?: string
}

// ---------- 内容数据 ----------

export const site = {
  /** 基本信息 */
  profile: {
    name: 'Takamiya',
    /** 头像图片地址；留空则显示首字母渐变占位头像 */
    avatar: '',
    tagline: 'Full-Stack Developer',
    location: 'China',
    /** 一句话签名 */
    bio: '热爱构建有趣的东西，保持好奇，持续学习。',
    /** 当前状态（显示在头像旁的小徽章） */
    status: 'Open to collaborate',
  },

  /** 社交链接（对应 ContactCard 的图标按钮） */
  socials: [
    { label: 'GitHub', icon: 'lucide:github', url: 'https://github.com/Takamiya-reborn' },
    { label: 'Email', icon: 'lucide:mail', url: 'mailto:hi@example.com' },
    { label: 'X / Twitter', icon: 'lucide:twitter', url: 'https://x.com/' },
    { label: 'RSS', icon: 'lucide:rss', url: '/rss.xml' },
  ] satisfies SocialLink[],

  /** 关于我（AboutCard 正文，支持数组分段） */
  about: [
    '你好，我是 Takamiya。一名对 Web 技术充满热情的开发者，喜欢从零到一构建产品。',
    '日常关注前端工程化、交互体验与开源社区，闲暇时会写写博客、折腾homelab。',
  ] as string[],

  /** 技能（SkillsCard，按组展示） */
  skillGroups: [
    {
      title: '前端',
      icon: 'lucide:layout',
      skills: ['Vue', 'Nuxt', 'TypeScript', 'CSS Architecture'],
    },
    {
      title: '后端',
      icon: 'lucide:server',
      skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis'],
    },
    {
      title: '工具',
      icon: 'lucide:wrench',
      skills: ['mise', 'Docker', 'GitHub Actions', 'Linux'],
    },
  ] satisfies SkillGroup[],

  /** 项目（ProjectsCard，每个项目一张小卡） */
  projects: [
    {
      title: 'Project Alpha',
      description: '一个示例项目，替换成你自己的项目介绍即可。',
      tags: ['Nuxt', 'TypeScript'],
      repo: 'https://github.com/Takamiya-reborn',
      icon: 'lucide:rocket',
    },
    {
      title: 'Project Beta',
      description: '第二个示例项目，支持配置演示链接与仓库链接。',
      tags: ['Go', 'PostgreSQL'],
      link: 'https://example.com',
      repo: 'https://github.com/Takamiya-reborn',
      icon: 'lucide:flask-conical',
    },
  ] satisfies Project[],

  /** 时间线（TimelineCard，倒序排列） */
  timeline: [
    {
      period: '2024 — 至今',
      title: '软件工程师',
      org: '某科技公司',
      description: '负责核心业务的前端架构与性能优化。',
    },
    {
      period: '2020 — 2024',
      title: '计算机科学与技术 · 本科',
      org: '某大学',
      description: '打基础，写代码，参加比赛。',
    },
  ] satisfies TimelineItem[],
} as const

export type Site = typeof site
