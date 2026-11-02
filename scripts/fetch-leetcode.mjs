#!/usr/bin/env node
// 拉取 LeetCode 做题数据生成 app/config/generated/leetcode.json，由 .github/workflows/update-data.yml 定时执行
// 用法：node scripts/fetch-leetcode.mjs（公开资料，无需鉴权）

import { writeFile } from 'node:fs/promises'

const USER_SLUG = 'takamiya'
const API = 'https://leetcode.cn/graphql'

// 公开 GraphQL：做题进度（已解答 / 尝试中 / 未接触，按难度分档）+ 今日每日一题
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
  # 逐条提交时间戳，供下方按北京时间自然日自算连签
  recentSubmissions(userSlug: $userSlug) { submitTime }
  # 今日每日一题，公开可查；火焰点击直达该题
  todayRecord {
    date
    question { titleSlug translatedTitle }
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

const streakData = calcStreak(data.recentSubmissions.map(s => s.submitTime))
const dailyQuestion = data.todayRecord?.[0]?.question ?? null

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

// 连续提交天数（火焰）：按北京时间自然日自算，与官方活跃图口径一致。
// 提交习惯是凌晨提交，会落进前一个 UTC 桶，老日历接口按 UTC 天计数会整体错位
// 且漏计；recentSubmissions 给的是逐条时间戳，最准。一次返回约 20 条，
// 连签超过 20 天时会数不满，对展示无伤
function calcStreak(submitTimes) {
  const DAY = 86400
  // 北京时间 = UTC+8 无夏令时，整体平移后取整即为自然日序号
  const dayOf = (ts) => Math.floor((ts + 8 * 3600) / DAY)
  const days = new Set(submitTimes.map(dayOf))
  const today = dayOf(Math.floor(Date.now() / 1000))
  // 今天还没提交不算断签，从昨天起算
  let cursor = days.has(today) ? today : today - 1
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor -= 1
  }
  // 未登录态拿不到「每日一题已完成」，用「今天（北京时间）有提交」近似：实心火焰的判据
  return { streak, submittedToday: days.has(today) }
}

const out = {
  generatedAt: new Date().toISOString(),
  userSlug: USER_SLUG,
  // 扩展新字段（如提交日历、竞赛）直接往里加，前端按需取用
  solved,
  attempting: Object.values(failed).reduce((a, b) => a + b, 0),
  total,
  streak: streakData.streak,
  submittedToday: streakData.submittedToday,
  // 今日每日一题（slug 供火焰直达链接）；跨天时由下次 Actions 刷新，链接可能短暂滞后
  daily: dailyQuestion
    ? { slug: dailyQuestion.titleSlug, title: dailyQuestion.translatedTitle }
    : null,
}

await writeFile(
  new URL('../app/config/generated/leetcode.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)
console.log(`已写入 app/config/generated/leetcode.json：${solved.easy + solved.medium + solved.hard} / ${total.easy + total.medium + total.hard}`)
