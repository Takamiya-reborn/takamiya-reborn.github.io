// GitHub 贡献数据交互层：数据由 scripts/fetch-github.mjs 定时生成到 public/github.json，
// 这里只做同源读取；文件缺失或请求失败时保持空数据，由调用方隐藏活动区块

export interface GithubDay {
  /** 日期，YYYY-MM-DD */
  date: string
  /** 当天贡献次数（口径同个人资料页贡献图） */
  count: number
}

interface GithubData {
  generatedAt: string
  user: string
  total: number
  days: GithubDay[]
}

// 读取 github.json，返回逐日贡献数组与合计；失败时为空数组，调用方据此回退
export function useGithubActivity() {
  const days = ref<GithubDay[]>([])
  const total = ref(0)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const res = await fetch('/github.json', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`github.json ${res.status}`)
      const data = (await res.json()) as GithubData
      days.value = data.days ?? []
      total.value = data.total ?? days.value.reduce((sum, d) => sum + d.count, 0)
    } catch {
      // 保持空数据，调用方隐藏活动区块
    } finally {
      loading.value = false
    }
  })

  return { days, total, loading }
}
