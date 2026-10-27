// LeetCode 做题数据：scripts/fetch-leetcode.mjs 定时生成，构建时静态注入，运行时零请求

import leetcodeRaw from "../config/generated/leetcode.json?raw";
import { parseJson } from "~/utils/parse";

export interface LeetCodeProgress {
  easy: number;
  medium: number;
  hard: number;
}

// Actions 预生成的 app/config/generated/leetcode.json 结构（见 scripts/fetch-leetcode.mjs）
interface LeetCodeData {
  generatedAt: string;
  userSlug: string;
  /** 已解答题数，按难度分档 */
  solved: LeetCodeProgress;
  /** 尝试中（提交过但未通过）的题数 */
  attempting: number;
  /** 当前题库总量，按难度分档 */
  total: LeetCodeProgress;
  /** 连续提交天数（由提交日历自算，见 scripts/fetch-leetcode.mjs） */
  streak: number;
  /** 今天（UTC）是否有提交：火焰实心 / 空心的判据 */
  submittedToday: boolean;
  /** 今日每日一题（slug 供火焰直达链接） */
  daily: { slug: string; title: string } | null;
}

// 解析失败的空数据：全 0，卡片照常渲染
const EMPTY: LeetCodeData = {
  generatedAt: "",
  userSlug: "",
  solved: { easy: 0, medium: 0, hard: 0 },
  attempting: 0,
  total: { easy: 0, medium: 0, hard: 0 },
  streak: 0,
  submittedToday: false,
  daily: null,
};

export function useLeetCode() {
  const data = parseJson<LeetCodeData>(leetcodeRaw, EMPTY);
  const solvedTotal = data.solved.easy + data.solved.medium + data.solved.hard;
  const totalAll = data.total.easy + data.total.medium + data.total.hard;
  return { ...data, solvedTotal, totalAll };
}
