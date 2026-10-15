// 站点数据结构定义，具体内容见 site.ts

// 展示标签用
export interface SocialLink {
  label: string;
  /** lucide 图标名 */
  icon: string;
  url: string;
}

export interface SkillGroup {
  title: string;
  icon: string;
  skills: string[];
}

export interface Project {
  title: string;
  description: string;
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

export interface GameEntry {
  title: string;
  platform: GamePlatform;
  /** 一句状态文案（如 HR 等级、生存天数）；被 liveNote 替换时作为回退显示 */
  note?: string;
  /** 成就完成度百分比（可选） */
  progress?: number;
  /** Steam AppID；配置后从 steam.json 注入实时数据 */
  steamAppId?: number;
  /** 用 Steam 实时数据替换 note：achievements=成就数，playtime=游戏时长 */
  liveNote?: "achievements" | "playtime";
}

export interface SectionMeta {
  /** 锚点 id，如 'about' */
  id: string;
  /** 编号前缀，如 '01' */
  num: string;
  title: string;
  subtitle?: string;
}
