#!/usr/bin/env node
// 拉取 GitHub 公开仓库生成 app/config/repos.json，由 .github/workflows/update-data.yml 定时执行
// 用法：GITHUB_TOKEN=xxx node scripts/fetch-repos.mjs
// 数据在构建时由 useGitHubProjects 静态导入（不再运行时请求 api.github.com）；
// 这里只存原始字段，筛选、排序与展示映射仍在 useGitHubProjects 中做

import { readFile, writeFile } from 'node:fs/promises'

const API = 'https://api.github.com/users/{user}/repos?per_page=100&sort=pushed'

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

const res = await fetch(API.replace('{user}', login), {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  },
})
if (!res.ok) throw new Error(`GitHub API → HTTP ${res.status}`)
const repos = (await res.json()).map(r => ({
  name: r.name,
  description: r.description,
  html_url: r.html_url,
  homepage: r.homepage,
  fork: r.fork,
  archived: r.archived,
  pushed_at: r.pushed_at,
  language: r.language,
  topics: r.topics ?? [],
}))

const out = {
  generatedAt: new Date().toISOString(),
  user: login,
  repos,
}
await writeFile(
  new URL('../app/config/repos.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)
console.log(`已写入 app/config/repos.json：${repos.length} 个仓库`)
