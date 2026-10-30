// theme 终端指令共享状态：commands.ts 的 handler 写入，app.vue 的 useHead 据此
// 往 <html> 挂 data-theme，main.css 的 html[data-theme='light'] 覆盖块完成换肤
// useState 保证 SSR 下每次请求状态独立（与 useNuke/useWeather 同一套路）；
// 刻意不落 localStorage——主题是无状态偏好，只活在当前页面会话，刷新即回深色
export type ThemeMode = "dark" | "light";

// 换肤过渡窗口计时器：set 只在客户端被调用，模块级单例即可
let switchTimer: ReturnType<typeof setTimeout> | undefined;

export function useTheme() {
  const theme = useState<ThemeMode>("theme-mode", () => "dark");
  // 用户是否手动选过主题：选过则节日彩蛋让位，dark/light 精确生效
  const picked = useState("theme-picked", () => false);

  function set(mode: ThemeMode) {
    theme.value = mode;
    picked.value = true;
    // 换肤瞬间挂过渡类（见 main.css 的 theme-switching 块），窗口期过后移除，
    // 不做成常驻过渡：免得干扰悬停发光这类微交互
    const root = document.documentElement;
    root.classList.add("theme-switching");
    clearTimeout(switchTimer);
    switchTimer = setTimeout(
      () => root.classList.remove("theme-switching"),
      450,
    );
  }

  return { theme, picked, set };
}
