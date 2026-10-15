// Steam 数据交互层：由 scripts/fetch-steam.mjs 定时生成到 app/config/steam.json，
// 构建时静态注入（?raw 按字符串导入，JSON.parse 一次转对象），运行时零请求；
// 之后要加别的数据（最近游玩、在线状态等）扩展生成脚本即可

import steamRaw from '../config/steam.json?raw'
import type { SteamGameStats } from '../config/types'

// Actions 预生成的 app/config/steam.json 结构（见 scripts/fetch-steam.mjs）
interface SteamData {
  generatedAt: string
  games: Record<string, SteamGameStats>
}

// 返回 appid → 统计数据的映射；条目缺数据时为 null，由调用方回退 site.ts 的静态文案
export function useSteamData() {
  const data = JSON.parse(steamRaw) as SteamData
  return { games: data.games ?? {} }
}
