// 屏幕背景轮换：手动维护的 app/config/screen-bgs.json 打包时静态读入，
// Y 位键循环切换；列表为空时按钮禁用
import bgsRaw from '../config/screen-bgs.json?raw'
import type { ScreenBg } from '~/config/types'

export function useScreenBgs() {
  // JSON 解析失败时按空列表处理，按钮禁用而不是报错
  let bgs: ScreenBg[] = []
  try {
    bgs = (JSON.parse(bgsRaw) as ScreenBg[]).filter((b) => b.src)
  } catch {
    // screen-bgs.json 语法错误：回退到空列表
  }

  // -1 表示默认黑屏，切换到末尾再下一发即回到默认
  const index = ref(-1)

  function next() {
    if (bgs.length === 0) return
    index.value = (index.value + 1) % (bgs.length + 1)
  }

  const current = computed(() =>
    index.value >= 0 && index.value < bgs.length ? bgs[index.value] : undefined,
  )

  return { bgs, current, next }
}
