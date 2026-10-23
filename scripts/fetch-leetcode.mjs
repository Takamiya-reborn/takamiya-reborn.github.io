#!/usr/bin/env node
// 拉取 LeetCode 做题数据生成 app/config/leetcode.json，由 .github/workflows/update-data.yml 定时执行
// 用法：node scripts/fetch-leetcode.mjs（公开资料，无需鉴权）

import { writeFile } from 'node:fs/promises'

const USER_SLUG = 'takamiya'
const API = 'https://leetcode.cn/graphql'

// 公开 GraphQL：做题进度（已解答 / 尝试中 / 未接触，按难度分档）
const query = `
query userPublicProfile($userSlug: String!) {
  userProfileUserQuestionProgressV2(userSlug: $userSlug) {
    numAcceptedQuestions { difficulty count }
    numFailedQuestions { difficulty count }
    numUntouchedQuestions { difficulty count }
  }
  userProfilePublicProfile(userSlug: $userSlug) {
    username
    submissionProgress { totalSubmissions }
  }
}`

const res = await fetch(API, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 不带 Referer/UA 会被 CDN 拒绝
    Referer: `https://leetcode.cn/u/${USER_SLUG}/`,
    'User-Agent': 'Mozilla/5.0 (personal-site-data-fetch)',
  },
  body: JSON.stringify({ query, variables: { userSlug: USER_SLUG } }),
})
if (!res.ok) throw new Error(`GraphQL → HTTP ${res.status}`)

const { data, errors } = await res.json()
if (errors?.length) throw new Error(`GraphQL 错误: ${errors.map(e => e.message).join('; ')}`)

const progress = data.userProfileUserQuestionProgressV2
if (!progress) throw new Error(`未找到用户 ${USER_SLUG}，检查 userSlug 是否正确`)

// 按难度整理成 { easy, medium, hard } 的扁平结构
const byDifficulty = (list) =>
  Object.fromEntries(list.map(({ difficulty, count }) => [difficulty.toLowerCase(), count]))

const solved = byDifficulty(progress.numAcceptedQuestions)
const failed = byDifficulty(progress.numFailedQuestions)
const untouched = byDifficulty(progress.numUntouchedQuestions)

// total = 三种状态之和，即当前题库总量
const total = Object.fromEntries(
  Object.keys(solved).map(d => [d, solved[d] + failed[d] + untouched[d]]),
)

const out = {
  generatedAt: new Date().toISOString(),
  userSlug: USER_SLUG,
  // 扩展新字段（如提交日历、竞赛）直接往里加，前端按需取用
  solved,
  attempting: Object.values(failed).reduce((a, b) => a + b, 0),
  total,
}

await writeFile(
  new URL('../app/config/leetcode.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)
console.log(`已写入 app/config/leetcode.json：${solved.easy + solved.medium + solved.hard} / ${total.easy + total.medium + total.hard}`)
