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
}

// 解析失败的空数据：全 0，卡片照常渲染
const EMPTY: LeetCodeData = {
  generatedAt: "",
  userSlug: "",
  solved: { easy: 0, medium: 0, hard: 0 },
  attempting: 0,
  total: { easy: 0, medium: 0, hard: 0 },
};

export function useLeetCode() {
  const data = parseJson<LeetCodeData>(leetcodeRaw, EMPTY);
  const solvedTotal = data.solved.easy + data.solved.medium + data.solved.hard;
  const totalAll = data.total.easy + data.total.medium + data.total.hard;
  return { ...data, solvedTotal, totalAll };
}
