// GitHub 贡献数据：由 scripts/fetch-github.mjs 定时生成到 app/config/github.json，
// 构建时静态注入（?raw 按字符串导入，JSON.parse 一次转对象），运行时零请求；
// days 为空时由调用方隐藏活动区块

import githubRaw from '../config/github.json?raw'

export interface GithubDay {
  /** 日期，YYYY-MM-DD */
  date: string
  /** 当天贡献次数（口径同个人资料页贡献图） */
  count: number
}

// Actions 预生成的 app/config/github.json 结构（见 scripts/fetch-github.mjs）
interface GithubData {
  generatedAt: string
  user: string
  total: number
  days: GithubDay[]
}

// 返回逐日贡献数组与合计；数据缺失时为空数组，调用方据此隐藏
export function useGithubActivity() {
  const data = JSON.parse(githubRaw) as GithubData
  const days = data.days ?? []
  return { days, total: data.total ?? days.reduce((sum, d) => sum + d.count, 0) }
}
