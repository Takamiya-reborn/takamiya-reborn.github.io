#!/usr/bin/env node
// 拉取 GitHub 贡献数据生成 app/config/github.json，由 .github/workflows/update-data.yml 定时执行
// 用法：GITHUB_TOKEN=xxx node scripts/fetch-github.mjs
// Token 只需要能读公开数据（Actions 内置 GITHUB_TOKEN 即可），不会进入仓库；
// 数据口径与个人资料页贡献图一致，私有贡献取决于账号的隐私设置

import { readFile, writeFile } from 'node:fs/promises'

// 展示最近 30 天，起点向左对齐到周日，前端可直接按整周分列渲染
const WINDOW_DAYS = 30
const API = 'https://api.github.com/graphql'

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('缺少环境变量 GITHUB_TOKEN')
  process.exit(1)
}

// GitHub 用户名的唯一来源是 site.ts 里的 githubUser 字段
const siteTs = await readFile(new URL('../app/config/site.ts', import.meta.url), 'utf8')
const login = siteTs.match(/githubUser:\s*"([^"]+)"/)?.[1]
if (!login) {
  console.error('site.ts 中未找到 githubUser')
  process.exit(1)
}

const res = await fetch(API, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`,
    variables: { login },
  }),
})
if (!res.ok) throw new Error(`GraphQL → HTTP ${res.status}`)
const payload = await res.json()
if (payload.errors) throw new Error(payload.errors.map(e => e.message).join('; '))

const allDays = payload.data.user.contributionsCollection.contributionCalendar.weeks
  .flatMap(w => w.contributionDays)
  .map(d => ({ date: d.date, count: d.contributionCount }))
  .sort((a, b) => a.date.localeCompare(b.date))

// 截取最近 30 天，并把起点回退到周日凑成整周（最多 35 格）
const start = new Date(`${allDays.at(-1).date}T00:00:00Z`)
start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1) - start.getUTCDay())
const from = start.toISOString().slice(0, 10)
const days = allDays.filter(d => d.date >= from)

const out = {
  generatedAt: new Date().toISOString(),
  user: login,
  total: days.reduce((sum, d) => sum + d.count, 0),
  days,
}
await writeFile(
  new URL('../app/config/github.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)
console.log(`已写入 app/config/github.json：${from} 起 ${days.length} 天，共 ${out.total} 次贡献`)

// 顺便下载最新头像到 public/avatar.png，同源直出，访客无需直连 GitHub CDN
const avatarRes = await fetch(`https://github.com/${login}.png?size=460`)
if (!avatarRes.ok) throw new Error(`avatar → HTTP ${avatarRes.status}`)
await writeFile(
  new URL('../public/avatar.png', import.meta.url),
  Buffer.from(await avatarRes.arrayBuffer()),
)
console.log(`已写入 public/avatar.png`)
