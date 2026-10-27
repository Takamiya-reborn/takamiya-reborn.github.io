// GitHub 贡献数据：scripts/fetch-github.mjs 定时生成，构建时静态注入，运行时零请求

import githubRaw from "../config/generated/github.json?raw";
import { parseJson } from "~/utils/parse";

export interface GithubDay {
  /** 日期，YYYY-MM-DD */
  date: string;
  /** 当天贡献次数（口径同个人资料页贡献图） */
  count: number;
}

export interface GithubLanguage {
  /** 语言名（GitHub Linguist 口径） */
  name: string;
  /** 在入选语言中的占比（整数，合计 100） */
  pct: number;
}

export interface GithubPr {
  /** 所属仓库，owner/name 全称 */
  repo: string;
  /** PR 页面链接 */
  url: string;
  /** PR 序号 */
  number: number;
  /** PR 标题 */
  title: string;
  /** OPEN / MERGED / CLOSED */
  state: "OPEN" | "MERGED" | "CLOSED";
  /** 创建时间，ISO 8601 */
  date: string;
  additions: number | null;
  deletions: number | null;
}

// Actions 预生成的 github.json 结构（见 scripts/fetch-github.mjs）
interface GithubData {
  generatedAt: string;
  user: string;
  total: number;
  days: GithubDay[];
  languages?: GithubLanguage[];
  prs?: GithubPr[];
}

// 贡献逐日、合计、语言构成与最新 PR；空数据由调用方隐藏对应区块
export function useGithubActivity() {
  const data = parseJson<GithubData>(githubRaw, {
    generatedAt: "",
    user: "",
    total: 0,
    days: [],
  });
  const days = data.days ?? [];
  return {
    days,
    total: data.total ?? days.reduce((sum, d) => sum + d.count, 0),
    languages: data.languages ?? [],
    prs: data.prs ?? [],
    generatedAt: data.generatedAt,
  };
}
