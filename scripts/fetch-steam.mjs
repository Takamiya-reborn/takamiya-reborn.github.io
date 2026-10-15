#!/usr/bin/env node
// 拉取 Steam 数据生成 app/config/steam.json，由 .github/workflows/update-data.yml 定时执行
// 用法：STEAM_API_KEY=xxx node scripts/fetch-steam.mjs
// Key 只存在于运行环境（GitHub Actions Secrets），不会进入仓库

import { readFile, writeFile } from 'node:fs/promises'

// SteamID64 是公开信息，非机密；与 site.ts 社交链接里的保持一致
const STEAM_ID64 = '76561199163260767'
const API = 'https://api.steampowered.com'

const apiKey = process.env.STEAM_API_KEY
if (!apiKey) {
  console.error('缺少环境变量 STEAM_API_KEY')
  process.exit(1)
}

// 游戏 AppID 的唯一来源是 site.ts 里的 steamAppId 字段
const siteTs = await readFile(new URL('../app/config/site.ts', import.meta.url), 'utf8')
const appIds = [...siteTs.matchAll(/steamAppId:\s*(\d+)/g)].map(m => m[1])
if (!appIds.length) {
  console.error('site.ts 中未找到任何 steamAppId')
  process.exit(1)
}

async function get(pathname, params) {
  const url = new URL(API + pathname)
  url.searchParams.set('key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${pathname} → HTTP ${res.status}`)
  return res.json()
}

// 游戏时长来自玩家游戏库；「游戏详情」需在 Steam 隐私设置中设为公开
const owned = await get('/IPlayerService/GetOwnedGames/v1/', {
  steamid: STEAM_ID64,
  include_appinfo: 1,
  include_played_free_games: 1,
})
const playtimes = new Map(
  (owned.response?.games ?? []).map(g => [g.appid, g.playtime_forever]),
)

const games = {}
for (const id of appIds) {
  const appid = Number(id)

  // 成就数量；资料库不公开时接口会返回 error，记为 null 由前端回退
  let achievements = null
  try {
    const data = await get('/ISteamUserStats/GetPlayerAchievements/v1/', {
      steamid: STEAM_ID64,
      appid,
      l: 'schinese',
    })
    const list = data.playerstats?.achievements
    if (Array.isArray(list)) {
      achievements = {
        unlocked: list.filter(a => a.achieved).length,
        total: list.length,
      }
    } else {
      console.warn(`跳过成就 ${appid}:`, data.playerstats?.error?.Desc ?? '无数据')
    }
  } catch (err) {
    console.warn(`成就查询失败 ${appid}:`, err.message)
  }

  games[id] = {
    playtimeMinutes: playtimes.get(appid) ?? null,
    achievements,
  }
  console.log(
    `✓ ${id}: 时长 ${games[id].playtimeMinutes ?? '-'} 分钟, 成就 ${achievements ? `${achievements.unlocked}/${achievements.total}` : '-'
    }`,
  )
}

const out = { generatedAt: new Date().toISOString(), games }
await writeFile(
  new URL('../app/config/steam.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)
console.log('已写入 app/config/steam.json')
