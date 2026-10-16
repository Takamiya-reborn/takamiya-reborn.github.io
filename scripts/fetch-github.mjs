#!/usr/bin/env node
// 拉取 GitHub 数据生成 app/config/github.json，由 .github/workflows/update-data.yml 定时执行
// 用法：GITHUB_TOKEN=xxx node scripts/fetch-github.mjs
// Token 只需要能读公开数据（Actions 内置 GITHUB_TOKEN 即可），不会进入仓库；
// 数据口径与个人资料页贡献图一致，私有贡献取决于账号的隐私设置

import { readFile, writeFile } from 'node:fs/promises'

// 贡献图展示最近 30 天，起点向左对齐到周日，前端可直接按整周分列渲染
const WINDOW_DAYS = 30
// 语言条保留前 N 名语言，避免碎片语言挤成一像素
const TOP_LANGUAGES = 5
// 最新提交取最近推送的前 N 个仓库
const RECENT_COMMITS = 3
const API = 'https://api.github.com/graphql'
const REST = 'https://api.github.com'

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('缺少环境变量 GITHUB_TOKEN')
  process.exit(1)
}
const headers = { Authorization: `Bearer ${token}` }

// GitHub 用户名的唯一来源是 site.ts 里的 githubUser 字段
const siteTs = await readFile(new URL('../app/config/site.ts', import.meta.url), 'utf8')
const login = siteTs.match(/githubUser:\s*"([^"]+)"/)?.[1]
if (!login) {
  console.error('site.ts 中未找到 githubUser')
  process.exit(1)
}

// 贡献日历（整年）与非 fork 仓库的语言字节数，一次 GraphQL 查完
const res = await fetch(API, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          nodes {
            languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }
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

// 语言构成：跨仓库累加各语言字节数，按占比取前 TOP_LANGUAGES
const byteSum = new Map()
for (const repo of payload.data.user.repositories.nodes) {
  for (const { size, node } of repo.languages?.edges ?? []) {
    byteSum.set(node.name, (byteSum.get(node.name) ?? 0) + size)
  }
}
const top = [...byteSum.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_LANGUAGES)
const topSum = top.reduce((sum, [, bytes]) => sum + bytes, 0)
const languages = top.map(([name, bytes]) => ({
  name,
  // 只在入选语言内归一化，保证条形图加起来是 100%；最小 1% 保证看得见
  pct: Math.max(1, Math.round((bytes / topSum) * 100)),
}))
// 四舍五入产生的误差补给占比最大的一项
languages[0].pct += 100 - languages.reduce((sum, l) => sum + l.pct, 0)

// 最新提交：最近推送的前 N 个非 fork 仓库，取各自最新一次提交及增删行数
const commits = []
try {
  const reposRes = await fetch(`${REST}/users/${login}/repos?sort=pushed&per_page=10&type=owner`, { headers })
  if (reposRes.ok) {
    const repos = (await reposRes.json())
      .filter(r => !r.fork && !r.archived)
      .slice(0, RECENT_COMMITS)
    for (const repo of repos) {
      const listRes = await fetch(`${REST}/repos/${login}/${repo.name}/commits?per_page=1`, { headers })
      if (!listRes.ok) continue
      const [commit] = await listRes.json()
      if (!commit) continue
      // 增删行数在 commit 详情接口里，列表接口没有
      const detailRes = await fetch(`${REST}/repos/${login}/${repo.name}/commits/${commit.sha}`, { headers })
      const stats = detailRes.ok ? (await detailRes.json()).stats : null
      commits.push({
        repo: repo.name,
        repoUrl: repo.html_url,
        sha: commit.sha,
        message: commit.commit.message.split('\n')[0],
        date: commit.commit.author.date,
        additions: stats?.additions ?? null,
        deletions: stats?.deletions ?? null,
      })
    }
  }
} catch {
  // 提交动态属锦上添花，拉取失败不阻塞整体数据生成
}

const out = {
  generatedAt: new Date().toISOString(),
  user: login,
  total: days.reduce((sum, d) => sum + d.count, 0),
  days,
  languages,
  commits,
}
await writeFile(
  new URL('../app/config/github.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)
console.log(
  `已写入 app/config/github.json：${from} 起 ${days.length} 天共 ${out.total} 次贡献，` +
  `${languages.length} 种语言，${commits.length} 条最新提交`,
)

// 顺便下载最新头像到 public/avatar.png，同源直出，访客无需直连 GitHub CDN
const avatarRes = await fetch(`https://github.com/${login}.png?size=460`)
if (!avatarRes.ok) throw new Error(`avatar → HTTP ${avatarRes.status}`)
await writeFile(
  new URL('../public/avatar.png', import.meta.url),
  Buffer.from(await avatarRes.arrayBuffer()),
)
console.log(`已写入 public/avatar.png`)
