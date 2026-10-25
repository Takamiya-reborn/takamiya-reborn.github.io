// 方向符号 → KeyboardEvent.key（字母直接小写匹配，Shift 按下也算命中）
const KEY_BY_SYMBOL: Record<string, string> = {
  "↑": "ArrowUp",
  "↓": "ArrowDown",
  "←": "ArrowLeft",
  "→": "ArrowRight",
};

// 科乐美彩蛋：依次按下 keys（↑↓←→ 或字母）后触发回调
export function useKonami(callback: () => void, keys: readonly string[]) {
  const sequence = keys.map((k) => KEY_BY_SYMBOL[k] ?? k.toLowerCase());
  let progress = 0;

  function onKey(event: KeyboardEvent) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    progress =
      key === sequence[progress] ? progress + 1 : key === sequence[0] ? 1 : 0;
    if (progress === sequence.length) {
      progress = 0;
      callback();
    }
  }

  onMounted(() => window.addEventListener("keydown", onKey));
  onUnmounted(() => window.removeEventListener("keydown", onKey));
}
