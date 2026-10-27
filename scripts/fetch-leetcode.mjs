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

const streakData = await fetchStreak()
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

// 连续提交天数（火焰）：从公开提交日历自算。日历只在此处用于求这两个值，
// 不落盘——页面不做热力图，只展示一个数字
async function fetchStreak() {
  const res = await fetch(`https://leetcode.cn/api/user_submission_calendar/${USER_SLUG}/`, {
    headers: {
      // 日历按 UTC 天为 key（{秒级零点时间戳: 提交数}），站点文案也写明「提交按 UTC 时间记录」
      Referer: `https://leetcode.cn/u/${USER_SLUG}/`,
      'User-Agent': 'Mozilla/5.0 (personal-site-data-fetch)',
    },
  })
  if (!res.ok) throw new Error(`提交日历 → HTTP ${res.status}`)
  // 响应体是「JSON 字符串再编码」：'"{{ts:count},...}"'，要 parse 两次
  const calendar = JSON.parse(JSON.parse(await res.text()))

  const DAY = 86400
  const has = (ts) => (calendar[ts] ?? 0) > 0
  const today = Math.floor(Date.now() / 1000 / DAY) * DAY
  // 今天还没提交不算断签，从昨天起算
  let cursor = has(today) ? today : today - DAY
  let streak = 0
  while (has(cursor)) {
    streak += 1
    cursor -= DAY
  }
  // 未登录态拿不到「每日一题已完成」，用「今天有提交」近似：实心火焰的判据
  return { streak, submittedToday: has(today) }
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
