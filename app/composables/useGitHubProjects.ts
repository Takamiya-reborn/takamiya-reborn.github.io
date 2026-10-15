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

// 拉取用户公开仓库，按最近推送取前 count 个；失败时保留 fallback 数据
export function useGitHubProjects(user: string, fallback: readonly Project[], count = 3) {
  const projects = ref<Project[]>([...fallback])
  const loading = ref(true)
  const failed = ref(false)

  onMounted(async () => {
    try {
      const res = await fetch(
        `https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`,
        { headers: { Accept: 'application/vnd.github+json' } },
      )
      if (!res.ok) throw new Error(`GitHub API ${res.status}`)

      const repos = (await res.json()) as GitHubRepo[]
      const ranked = repos
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
