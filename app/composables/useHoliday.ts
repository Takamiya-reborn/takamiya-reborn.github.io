// 节日主题注册表：新增节日 = assets/css/themes/ 加 <name>.css + nuxt.config css 挂载 + holiday/<Name>Scene.vue 场景组件 + 这里和 HolidayFx 场景表各登记一行
// 类型见 config/types.ts，theme 指令只在 dark/light 里选，切不到节日主题
import type { HolidayTheme } from "~/config/types";

const holidayThemes: HolidayTheme[] = [
  {
    name: "halloween",
    start: { month: 10, day: 28 },
    end: { month: 11, day: 1 },
    themeColor: "#0a0712",
    greet: "Halloween",
  },
];

// (月, 日) 压成可比较的整数
function dateCode(month: number, day: number) {
  return month * 100 + day;
}

function inWindow(now: Date, t: HolidayTheme) {
  const cur = dateCode(now.getMonth() + 1, now.getDate());
  const start = dateCode(t.start.month, t.start.day);
  const end = dateCode(t.end.month, t.end.day);
  // start > end 即跨年窗口（如 12/20—1/2）：落在任一段即命中
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
}

function resolve(now: Date) {
  return holidayThemes.find((t) => inWindow(now, t)) ?? null;
}

// 生效中的节日条目，null = 窗口期外或手动选过主题（useTheme.picked，彩蛋只作进站默认皮肤）
// useState 与 useTheme 同套路：SSR 下每次请求独立求值；静态生成把结果冻在构建时刻，
// 客户端再按访客本地时间重算兜底
export function useHoliday() {
  const holiday = useState<HolidayTheme | null>("holiday-theme", () => resolve(new Date()));
  if (import.meta.client) holiday.value = resolve(new Date());
  const { picked } = useTheme();
  const active = computed(() => (picked.value ? null : holiday.value));
  return { active };
}
