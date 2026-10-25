// theme 终端指令共享状态：commands.ts 的 handler 写入，app.vue 的 useHead 据此
// 往 <html> 挂 data-theme，main.css 的 html[data-theme='light'] 覆盖块完成换肤
// useState 保证 SSR 下每次请求状态独立（与 useNuke/useWeather 同一套路）
export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'takamiya:theme'

// 换肤过渡窗口计时器：set 只在客户端被调用，模块级单例即可
let switchTimer: ReturnType<typeof setTimeout> | undefined

export function useTheme() {
  const theme = useState<ThemeMode>('theme-mode', () => 'dark')

  function set(mode: ThemeMode) {
    theme.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
    // 换肤瞬间挂过渡类（见 main.css 的 theme-switching 块），窗口期过后移除，
    // 不做成常驻过渡：免得干扰悬停发光这类微交互
    const root = document.documentElement
    root.classList.add('theme-switching')
    clearTimeout(switchTimer)
    switchTimer = setTimeout(() => root.classList.remove('theme-switching'), 450)
  }

  // 客户端恢复上次选择；没存过或存值非法则保持深色默认
  function init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') theme.value = saved
  }

  return { theme, set, init }
}
