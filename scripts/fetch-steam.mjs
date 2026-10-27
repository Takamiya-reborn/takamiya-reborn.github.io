#!/usr/bin/env node
// 拉取 Steam 数据生成 app/config/generated/steam.json，由 .github/workflows/update-data.yml 定时执行
// 用法：STEAM_API_KEY=xxx node scripts/fetch-steam.mjs
// Key 只存在于运行环境（GitHub Actions Secrets），不会进入仓库

import { readFile, writeFile } from "node:fs/promises";

// SteamID64 是公开信息，非机密；与 site.ts 社交链接里的保持一致
const STEAM_ID64 = "76561199163260767";
const API = "https://api.steampowered.com";

const apiKey = process.env.STEAM_API_KEY;
if (!apiKey) {
  console.error("缺少环境变量 STEAM_API_KEY");
  process.exit(1);
}

// 游戏列表的唯一来源是 site.ts 的 games 数组：steam 条目只写 title（+ 可选 steamName 别名），
// AppID 由脚本在玩家游戏库里按名称匹配得到，不需要手工维护
const siteTs = await readFile(
  new URL("../app/config/site.ts", import.meta.url),
  "utf8",
);
const steamEntries = [...siteTs.matchAll(/\{[^{}]*\}/g)]
  .map((m) => m[0])
  .filter((block) => /platform:\s*"steam"/.test(block))
  .map((block) => ({
    title: block.match(/title:\s*"((?:[^"\\]|\\.)*)"/)?.[1],
    steamName: block.match(/steamName:\s*"((?:[^"\\]|\\.)*)"/)?.[1],
  }))
  .filter((e) => {
    if (e.title) return true;
    console.warn("跳过无法解析 title 的 steam 条目:", e);
    return false;
  });
if (!steamEntries.length) {
  console.error("site.ts 中未找到任何 steam 平台条目");
  process.exit(1);
}

async function get(pathname, params) {
  const url = new URL(API + pathname);
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${pathname} → HTTP ${res.status}`);
  return res.json();
}

// 游戏库同时提供时长、名称与 AppID；「游戏详情」需在 Steam 隐私设置中设为公开
const owned = await get("/IPlayerService/GetOwnedGames/v1/", {
  steamid: STEAM_ID64,
  include_appinfo: 1,
  include_played_free_games: 1,
});
const library = owned.response?.games ?? [];
const playtimes = new Map(library.map((g) => [g.appid, g.playtime_forever]));
// 名称 → AppID：先精确匹配，再退回大小写不敏感匹配
const appIdsByName = new Map(library.map((g) => [g.name, g.appid]));
const appIdsByLowerName = new Map(
  library.map((g) => [g.name.toLowerCase(), g.appid]),
);

const games = {};
for (const entry of steamEntries) {
  const lookupName = entry.steamName ?? entry.title;
  const appid =
    appIdsByName.get(lookupName) ??
    appIdsByLowerName.get(lookupName.toLowerCase());
  if (!appid) {
    console.warn(
      `游戏库中找不到「${lookupName}」，跳过（请核对 Steam 商店名，或加 steamName 别名）`,
    );
    continue;
  }

  // 成就数量；资料库不公开时接口会返回 error，记为 null 由前端回退
  let achievements = null;
  try {
    const data = await get("/ISteamUserStats/GetPlayerAchievements/v1/", {
      steamid: STEAM_ID64,
      appid,
      l: "schinese",
    });
    const list = data.playerstats?.achievements;
    if (Array.isArray(list)) {
      achievements = {
        unlocked: list.filter((a) => a.achieved).length,
        total: list.length,
      };
    } else {
      console.warn(
        `跳过成就 ${lookupName}:`,
        data.playerstats?.error?.Desc ?? "无数据",
      );
    }
  } catch (err) {
    console.warn(`成就查询失败 ${lookupName}:`, err.message);
  }

  games[entry.title] = {
    playtimeMinutes: playtimes.get(appid) ?? null,
    achievements,
    // Steam CDN 公开资源，无需鉴权：capsule 图 184x69，直接热链，前端作压暗背景
    cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg`,
  };
  console.log(
    `✓ ${entry.title}: 时长 ${games[entry.title].playtimeMinutes ?? "-"} 分钟, 成就 ${
      achievements ? `${achievements.unlocked}/${achievements.total}` : "-"
    }`,
  );
}

const out = { generatedAt: new Date().toISOString(), games };
await writeFile(
  new URL("../app/config/generated/steam.json", import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
);
console.log("已写入 app/config/generated/steam.json");
