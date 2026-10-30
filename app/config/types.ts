// 站点数据结构定义，具体内容见 site.ts

// 展示标签用
export interface SocialLink {
  label: string;
  /** lucide 图标名 */
  icon: string;
  url: string;
}

export interface SkillEntry {
  name: string;
  /** 进阶子技能（如 Vue → Nuxt），思维导图中向外再展开一层 */
  children?: SkillItem[];
}

/** 技能项：纯字符串，或带进阶链的嵌套节点 */
export type SkillItem = string | SkillEntry;

export interface SkillGroup {
  title: string;
  icon: string;
  skills: SkillItem[];
}

/** 媒体能力徽章：关于我卡片底部的图标行 */
export interface MediaSkill {
  name: string;
  /** public 下的图标路径，如 /icon/ps.png */
  icon: string;
  /** 一句话说明（可选） */
  desc?: string;
}

export interface Project {
  title: string;
  /** 简介缺失时整个段落不渲染 */
  description?: string;
  tags: string[];
  /** 演示地址（可选） */
  link?: string;
  /** 仓库地址（可选） */
  repo?: string;
  icon: string;
}

export interface TimelineItem {
  period: string;
  title: string;
  org: string;
  description?: string;
}

export type GamePlatform = "steam" | "xbox" | "ns";

/** Steam 统计数据：steam.json 注入的结构 */
export interface SteamGameStats {
  /** 累计游玩分钟数；资料库不公开时为 null */
  playtimeMinutes: number | null;
  /** 成就进度；游戏无成就系统或查询失败时为 null */
  achievements: { unlocked: number; total: number } | null;
  /** 游戏 header 图（Steam CDN 热链），卡片里作条目背景展示 */
  cover?: string;
}

export interface GameEntry {
  title: string;
  platform: GamePlatform;
  /** 一句状态文案（如 HR 等级、生存天数）；steam 条目有实时数据时被自动生成的时长/成就文案替换 */
  note?: string;
  /** 进度条百分比（可选）；steam 条目有成就数据时按成就完成度动态计算，此值仅作回退 */
  progress?: number;
  /** Steam 侧游戏名；title 与 Steam 商店名中文等不一致时，抓取脚本用它匹配游戏库里的 AppID */
  steamName?: string;
}

// quote 条目：手动维护在 config/content/quotes.json，QuoteCard 随机抽取展示
export interface Quote {
  /** 译文；中文原句直接填这里作为主句，纯中文诗词条目可省略（text 即主句） */
  translation?: string;
  /** 原文（可选）；有值时作为主句，translation 退居下方补充；\n 表示手动换行（如诗句按联断行） */
  text?: string;
  /** 作者原名（可选）；有值时署名以原名为主，译名附在英文括号里 */
  author?: string;
  /** 作者译名；有 author 时署名以原名为主，可省略 */
  authorTranslation?: string;
  /** 出处（可选，如书名 / 游戏）；保持简短，统一用《中文名》·年份，英文原名靠搜索按钮查 */
  source?: string;
  /** 开发专用标尺句：量屏幕极限用；生产构建直接过滤，不会被随机抽到 */
  dummy?: boolean;
}

// 屏幕背景条目：手动维护在 config/content/screen-bgs.json，QuoteCard 的 Y 位键轮换切换
export interface ScreenBg {
  /** 图片路径；图片放 public/bg/ 下，此处填 '/bg/xxx.webp' 这样的绝对路径 */
  src: string;
  /** 名称；作为切换时的提示文案 */
  name: string;
  /** 叠加暗度 0~1，压住图片保证屏幕文字可读；省略时用默认值 */
  dim?: number;
}

export interface SectionMeta {
  /** 锚点 id，如 'about' */
  id: string;
  /** 编号前缀，如 '01' */
  num: string;
  title: string;
  subtitle?: string;
}

// 节日主题条目：注册表在 composables/useHoliday.ts，覆盖块在 assets/css/themes/<name>.css
export interface HolidayTheme {
  /** data-theme 值，须与 assets/css/themes/<name>.css 一致 */
  name: string;
  /** 命中窗口起点（本地时区，含当天），month 从 1 起 */
  start: { month: number; day: number };
  /** 命中窗口终点（含当天），可与 start 跨年（如 12/20—1/2） */
  end: { month: number; day: number };
  /** theme-color meta 色：窗口期地址栏跟页面底色走 */
  themeColor: string;
  /** 节日问候词：窗口期终端名字行缀 "Happy <greet>"，不填则不带问候 */
  greet?: string;
}
