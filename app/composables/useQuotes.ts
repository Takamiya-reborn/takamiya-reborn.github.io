// quote 抽取：手动维护的 app/config/quotes.json 打包时静态读入，
// 用「洗牌袋」抽取——每条 quote 被抽到一次后本轮不再重复，保证翻看体验
import quotesRaw from '../config/quotes.json?raw'
import type { Quote } from '~/config/types'

export function useQuotes() {
  // JSON 解析失败时按空列表处理，卡片展示占位文案而不是白屏；
  // dummy 标尺句只在开发环境保留，生产构建（含 SSG 预渲染）直接过滤
  let quotes: Quote[] = []
  try {
    quotes = (JSON.parse(quotesRaw) as Quote[])
      .filter((q) => (q.translation || q.text) && (import.meta.dev || !q.dummy))
  } catch {
    // quotes.json 语法错误：回退到空列表
  }

  // 抽取袋：打乱后逐个弹出，弹完再重新洗牌
  let bag: Quote[] = []

  function draw(): Quote | undefined {
    if (quotes.length === 0) return undefined
    if (bag.length === 0) {
      bag = [...quotes]
      // Fisher–Yates 洗牌
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j]!, bag[i]!]
      }
    }
    return bag.pop()
  }

  return { quotes, draw }
}
