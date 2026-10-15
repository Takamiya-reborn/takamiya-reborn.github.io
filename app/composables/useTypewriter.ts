// 打字机效果：输入、停留、删除、循环下一句；respect prefers-reduced-motion
export function useTypewriter(
  words: () => string[],
  options: { typeSpeed?: number; deleteSpeed?: number; holdTime?: number } = {},
) {
  const { typeSpeed = 75, deleteSpeed = 40, holdTime = 1800 } = options
  const text = ref('')

  onMounted(() => {
    const list = words()
    if (list.length === 0) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      text.value = list[0] ?? ''
      return
    }

    let word = 0
    let char = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    const step = () => {
      const current = list[word] ?? ''

      if (!deleting) {
        char += 1
        text.value = current.slice(0, char)
        if (char >= current.length) {
          deleting = true
          timer = setTimeout(step, holdTime)
        } else {
          timer = setTimeout(step, typeSpeed)
        }
      } else {
        char -= 1
        text.value = current.slice(0, char)
        if (char <= 0) {
          deleting = false
          word = (word + 1) % list.length
          timer = setTimeout(step, 400)
        } else {
          timer = setTimeout(step, deleteSpeed)
        }
      }
    }

    timer = setTimeout(step, 500)
    onUnmounted(() => clearTimeout(timer))
  })

  return { text }
}
