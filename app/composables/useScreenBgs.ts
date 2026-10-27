// 屏幕背景轮换：config/content/screen-bgs.json 静态读入，Y 位键循环切换
import bgsRaw from "../config/content/screen-bgs.json?raw";
import type { ScreenBg } from "~/config/types";
import { parseJson } from "~/utils/parse";

export function useScreenBgs() {
  const bgs = parseJson<ScreenBg[]>(bgsRaw, []).filter((b) => b.src);

  // -1 = 默认黑屏，末尾再切回默认
  const index = ref(-1);

  // 预载全部背景图：不预载的话首次切换现场下载、一点一点显出来
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
