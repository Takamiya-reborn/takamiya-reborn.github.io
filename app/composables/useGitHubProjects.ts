import type { Project } from '~/config/types'
// 构建时注入的仓库数据（?raw 按字符串导入，JSON.parse 一次转对象）
import reposRaw from '../config/repos.json?raw'

// GitHub REST API 返回的仓库字段（只取用到的部分）
interface GitHubRepo {
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  fork: boolean
  archived: boolean
  pushed_at: string
  language: string | null
  topics: string[]
}

// 主语言 → simple-icons 图标 slug
const langIcons: Record<string, string> = {
  JavaScript: 'simple-icons:javascript',
  TypeScript: 'simple-icons:typescript',
  Python: 'simple-icons:python',
  Go: 'simple-icons:go',
  C: 'simple-icons:c',
  'C++': 'simple-icons:cplusplus',
  'C#': 'simple-icons:csharp',
  Rust: 'simple-icons:rust',
  Ruby: 'simple-icons:ruby',
  PHP: 'simple-icons:php',
  Kotlin: 'simple-icons:kotlin',
  Swift: 'simple-icons:swift',
  Dart: 'simple-icons:dart',
  Zig: 'simple-icons:zig',
  Lua: 'simple-icons:lua',
  Scala: 'simple-icons:scala',
  Elixir: 'simple-icons:elixir',
  Haskell: 'simple-icons:haskell',
  HTML: 'simple-icons:html5',
  CSS: 'simple-icons:css',
  Vue: 'simple-icons:vuedotjs',
  Nuxt: 'simple-icons:nuxt',
  Shell: 'simple-icons:gnubash',
  PowerShell: 'simple-icons:powershell',
  'Jupyter Notebook': 'simple-icons:jupyter',
}

// 未知语言的回退图标池（按名次轮换）
const rankIcons = ['lucide:rocket', 'lucide:terminal', 'lucide:cpu']

// Actions 预生成的 app/config/repos.json 结构（原始仓库字段，见 scripts/fetch-repos.mjs）
interface ReposData {
  generatedAt: string
  user: string
  repos: GitHubRepo[]
}

// 过滤 fork / 归档 / 本站仓库，按最近推送取前 count 个并映射为 Project
function mapRepos(repos: GitHubRepo[], user: string, count: number): Project[] {
  return repos
    .filter(
      r =>
        !r.fork
        && !r.archived
        && r.name.toLowerCase() !== `${user}.github.io`.toLowerCase(),
    )
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, count)
    .map((r, i) => ({
      title: r.name,
      description: r.description || undefined,
      tags: [r.language, ...r.topics.slice(0, 2)].filter((t): t is string => Boolean(t)),
      repo: r.html_url,
      link: r.homepage || undefined,
      // 主语言图标，未收录则按名次轮换
      icon: (r.language && langIcons[r.language]) || rankIcons[i % rankIcons.length],
    }))
}

// 仓库数据由 Actions 每日预生成（scripts/fetch-repos.mjs → app/config/repos.json），
// 更新后工作流会触发重新部署，因此构建时静态导入即是最新数据：
// 首屏 HTML 直接渲染真实项目，访客零请求，也不再需要加载骨架屏
export function useGitHubProjects(user: string, fallback: readonly Project[], count = 3) {
  const data = JSON.parse(reposRaw) as ReposData
  const ranked = mapRepos(data.repos ?? [], user, count)
  return { projects: ranked.length ? ranked : [...fallback] }
}
