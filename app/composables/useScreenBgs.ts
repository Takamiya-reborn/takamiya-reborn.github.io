// 屏幕背景轮换：手动维护的 app/config/screen-bgs.json 打包时静态读入，
// Y 位键循环切换；列表为空时按钮禁用
import bgsRaw from "../config/screen-bgs.json?raw";
import type { ScreenBg } from "~/config/types";

export function useScreenBgs() {
  // JSON 解析失败时按空列表处理，按钮禁用而不是报错
  let bgs: ScreenBg[] = [];
  try {
    bgs = (JSON.parse(bgsRaw) as ScreenBg[]).filter((b) => b.src);
  } catch {
    // screen-bgs.json 语法错误：回退到空列表
  }

  // -1 表示默认黑屏，切换到末尾再下一发即回到默认
  const index = ref(-1);

  // 挂载后预载全部背景图：背景是点 Y 键才内联到 backgroundImage 的，
  // 不预载的话第一次切换会现场下载、一点一点显出来
  onMounted(() => {
    for (const b of bgs) {
      const img = new Image();
      img.src = b.src;
    }
  });

  function next() {
    if (bgs.length === 0) return;
    index.value = (index.value + 1) % (bgs.length + 1);
  }

  const current = computed(() =>
    index.value >= 0 && index.value < bgs.length ? bgs[index.value] : undefined,
  );

  return { bgs, current, next };
}
