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

/** Steam 统计数据：steam.json 注入与 site.ts 手写保底共用此结构 */
export interface SteamGameStats {
  /** 累计游玩分钟数；资料库不公开时为 null */
  playtimeMinutes: number | null;
  /** 成就进度；游戏无成就系统或查询失败时为 null */
  achievements: { unlocked: number; total: number } | null;
}

export interface GameEntry {
  title: string;
  platform: GamePlatform;
  /** 一句状态文案（如 HR 等级、生存天数）；被 liveNote 替换时作为回退显示 */
  note?: string;
  /** 进度条百分比（可选）；有成就数据时按成就完成度动态计算，此值仅作回退 */
  progress?: number;
  /** Steam AppID；配置后从 steam.json 注入定时更新的数据 */
  steamAppId?: number;
  /** 用 Steam 注入的数据替换 note：achievements=成就数，playtime=游戏时长 */
  liveNote?: "achievements" | "playtime";
  /** 保底统计：steam.json 缺该条目时按 liveNote 渲染此值（复制自最近一次抓取的真实数据） */
  defaultStats?: SteamGameStats;
}

// quote 条目：手动维护在 quotes.json，QuoteCard 随机抽取展示
export interface Quote {
  /** 译文（必填）；中文原句直接填这里，作为主句展示 */
  translation: string;
  /** 原文（可选）；有值时作为主句，translation 退居下方补充 */
  text?: string;
  /** 作者原名（可选）；有值时署名以原名为主，译名附在英文括号里 */
  author?: string;
  /** 作者译名（必填） */
  authorTranslation: string;
  /** 出处（可选，如书名 / 游戏） */
  source?: string;
}

export interface SectionMeta {
  /** 锚点 id，如 'about' */
  id: string;
  /** 编号前缀，如 '01' */
  num: string;
  title: string;
  subtitle?: string;
}
