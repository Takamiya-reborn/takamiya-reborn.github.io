import type { Project } from "~/config/types";
// 仓库数据与映射逻辑在 utils/repos.ts 统一维护
import { mapRepos, reposData } from "~/utils/repos";

// 仓库数据由 Actions 每日预生成（scripts/fetch-repos.mjs → app/config/generated/repos.json），
// 更新后工作流会触发重新部署，因此构建时静态导入即是最新数据：
// 首屏 HTML 直接渲染真实项目，访客零请求，也不再需要加载骨架屏
export function useGitHubProjects(
  user: string,
  fallback: readonly Project[],
  count = 3,
) {
  const ranked = mapRepos(reposData.repos ?? [], user, count);
  return { projects: ranked.length ? ranked : [...fallback] };
}
