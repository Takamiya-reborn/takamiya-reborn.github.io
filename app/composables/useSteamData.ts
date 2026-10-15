// Steam 实时数据交互层：数据由 scripts/fetch-steam.mjs 定时生成到 public/steam.json，
// 这里只做同源读取；之后要加别的数据（最近游玩、在线状态等）扩展生成脚本即可

export interface SteamGameStats {
  /** 累计游玩分钟数；资料库不公开时为 null */
  playtimeMinutes: number | null
  /** 成就进度；游戏无成就系统或查询失败时为 null */
  achievements: { unlocked: number; total: number } | null
}

interface SteamData {
  generatedAt: string
  games: Record<string, SteamGameStats>
}

// 读取 steam.json，返回 appid → 统计数据的映射；文件缺失或请求失败时为空对象，由调用方回退
export function useSteamData() {
  const games = ref<Record<string, SteamGameStats>>({})
  const loading = ref(true)

  onMounted(async () => {
    try {
      const res = await fetch('/steam.json', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`steam.json ${res.status}`)
      const data = (await res.json()) as SteamData
      games.value = data.games ?? {}
    } catch {
      // 保持空对象，调用方使用 site.ts 里的静态回退文案
    } finally {
      loading.value = false
    }
  })

  return { games, loading }
}
