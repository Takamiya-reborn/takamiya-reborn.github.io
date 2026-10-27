// 仓库数据共享层：Actions 定时生成的 repos.json 在此统一解析，
// 项目区组件与 site.ts 的回退数据都从这里取，映射逻辑只维护一份
import type { Project } from "~/config/types";
import reposRaw from "../config/generated/repos.json?raw";
import { parseJson } from "~/utils/parse";

// GitHub REST API 返回的仓库字段（只取用到的部分）
export interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  language: string | null;
  topics: string[];
}

// Actions 预生成的 app/config/generated/repos.json 结构（原始仓库字段，见 scripts/fetch-repos.mjs）
export interface ReposData {
  generatedAt: string;
  user: string;
  repos: GitHubRepo[];
}

// 解析后的仓库数据，全站共用这一份
export const reposData = parseJson<ReposData>(reposRaw, {
  generatedAt: "",
  user: "",
  repos: [],
});

// 主语言 → simple-icons 图标 slug
const langIcons: Record<string, string> = {
  JavaScript: "simple-icons:javascript",
  TypeScript: "simple-icons:typescript",
  Python: "simple-icons:python",
  Go: "simple-icons:go",
  C: "simple-icons:c",
  "C++": "simple-icons:cplusplus",
  "C#": "simple-icons:csharp",
  Rust: "simple-icons:rust",
  Ruby: "simple-icons:ruby",
  PHP: "simple-icons:php",
  Kotlin: "simple-icons:kotlin",
  Swift: "simple-icons:swift",
  Dart: "simple-icons:dart",
  Zig: "simple-icons:zig",
  Lua: "simple-icons:lua",
  Scala: "simple-icons:scala",
  Elixir: "simple-icons:elixir",
  Haskell: "simple-icons:haskell",
  HTML: "simple-icons:html5",
  CSS: "simple-icons:css",
  Vue: "simple-icons:vuedotjs",
  Nuxt: "simple-icons:nuxt",
  Shell: "simple-icons:gnubash",
  PowerShell: "simple-icons:powershell",
  "Jupyter Notebook": "simple-icons:jupyter",
};

// 未知语言的回退图标池（按名次轮换）
const rankIcons = ["lucide:rocket", "lucide:terminal", "lucide:cpu"];

// 过滤 fork / 归档 / 本站仓库，按最近推送取前 count 个并映射为 Project
export function mapRepos(
  repos: GitHubRepo[],
  user: string,
  count: number,
): Project[] {
  return repos
    .filter(
      (r) =>
        !r.fork &&
        !r.archived &&
        r.name.toLowerCase() !== `${user}.github.io`.toLowerCase(),
    )
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, count)
    .map((r, i) => ({
      title: r.name,
      description: r.description || undefined,
      tags: [r.language, ...r.topics.slice(0, 2)].filter((t): t is string =>
        Boolean(t),
      ),
      repo: r.html_url,
      link: r.homepage || undefined,
      // 主语言图标，未收录则按名次轮换
      icon:
        (r.language && langIcons[r.language]) ||
        rankIcons[i % rankIcons.length]!,
    }));
}
