import type { Project } from '~/config/types'

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

// Actions 预生成的 public/repos.json 结构（原始仓库字段，见 scripts/fetch-repos.mjs）
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
      description: r.description || '（仓库暂无简介）',
      tags: [r.language, ...r.topics.slice(0, 2)].filter((t): t is string => Boolean(t)),
      repo: r.html_url,
      link: r.homepage || undefined,
      // 主语言图标，未收录则按名次轮换
      icon: (r.language && langIcons[r.language]) || rankIcons[i % rankIcons.length],
    }))
}

// 拉取用户公开仓库，按最近推送取前 count 个；失败时保留 fallback 数据
export function useGitHubProjects(user: string, fallback: readonly Project[], count = 3) {
  const projects = ref<Project[]>([...fallback])
  const loading = ref(true)
  const failed = ref(false)

  onMounted(async () => {
    // 优先读取 Actions 预生成的同源 repos.json，避免访客直连 api.github.com 缓慢；
    // 文件缺失（本地未跑脚本）或为空时回退实时 API
    try {
      const res = await fetch('/repos.json', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`repos.json ${res.status}`)
      const data = (await res.json()) as ReposData
      const ranked = mapRepos(data.repos ?? [], user, count)
      if (ranked.length) {
        projects.value = ranked
        return
      }
    } catch {
      // 回退实时 API
    }

    try {
      const res = await fetch(
        `https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`,
        { headers: { Accept: 'application/vnd.github+json' } },
      )
      if (!res.ok) throw new Error(`GitHub API ${res.status}`)

      const repos = (await res.json()) as GitHubRepo[]
      const ranked = mapRepos(repos, user, count)
      if (ranked.length) projects.value = ranked
      else failed.value = true
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  })

  return { projects, loading, failed }
}
