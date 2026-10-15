// 科乐美秘技彩蛋：依次按下后触发回调
export function useKonami(callback: () => void) {
  const sequence = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ]
  let progress = 0

  function onKey(event: KeyboardEvent) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    progress = key === sequence[progress] ? progress + 1 : key === sequence[0] ? 1 : 0
    if (progress === sequence.length) {
      progress = 0
      callback()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
