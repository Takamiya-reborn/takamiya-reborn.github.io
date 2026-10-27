// Steam 数据：scripts/fetch-steam.mjs 定时生成，构建时静态注入，运行时零请求

import steamRaw from "../config/generated/steam.json?raw";
import type { SteamGameStats } from "../config/types";
import { parseJson } from "~/utils/parse";

// Actions 预生成的 steam.json 结构（见 scripts/fetch-steam.mjs）
interface SteamData {
  generatedAt: string;
  games: Record<string, SteamGameStats>;
}

// 游戏名 → 统计映射；缺数据时调用方回退 site.ts 的 note 文案
export function useSteamData() {
  const data = parseJson<SteamData>(steamRaw, { generatedAt: "", games: {} });
  return { games: data.games ?? {} };
}
