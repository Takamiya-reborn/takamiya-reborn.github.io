// LeetCode 做题数据：由 scripts/fetch-leetcode.mjs 定时生成到 app/config/leetcode.json，
// 构建时静态注入（?raw 按字符串导入，JSON.parse 一次转对象），运行时零请求

import leetcodeRaw from '../config/leetcode.json?raw'

export interface LeetCodeProgress {
  easy: number
  medium: number
  hard: number
}

// Actions 预生成的 app/config/leetcode.json 结构（见 scripts/fetch-leetcode.mjs）
interface LeetCodeData {
  generatedAt: string
  userSlug: string
  /** 已解答题数，按难度分档 */
  solved: LeetCodeProgress
  /** 尝试中（提交过但未通过）的题数 */
  attempting: number
  /** 当前题库总量，按难度分档 */
  total: LeetCodeProgress
}

export function useLeetCode() {
  const data = JSON.parse(leetcodeRaw) as LeetCodeData
  const solvedTotal = data.solved.easy + data.solved.medium + data.solved.hard
  const totalAll = data.total.easy + data.total.medium + data.total.hard
  return { ...data, solvedTotal, totalAll }
}
