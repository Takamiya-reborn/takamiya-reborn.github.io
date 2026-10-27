// quote 抽取：config/content/quotes.json 打包时静态读入，洗牌袋抽取不重复
import quotesRaw from "../config/content/quotes.json?raw";
import type { Quote } from "~/config/types";
import { parseJson } from "~/utils/parse";

// dummy 标尺句只在开发环境保留，生产构建直接过滤
export function useQuotes() {
  const quotes = parseJson<Quote[]>(quotesRaw, []).filter(
    (q) => (q.translation || q.text) && (import.meta.dev || !q.dummy),
  );

  // 抽取袋：打乱后逐个弹出，弹完重洗
  let bag: Quote[] = [];

  function draw(): Quote | undefined {
    if (quotes.length === 0) return undefined;
    if (bag.length === 0) {
      bag = [...quotes];
      // Fisher–Yates
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j]!, bag[i]!];
      }
    }
    return bag.pop();
  }

  return { quotes, draw };
}
