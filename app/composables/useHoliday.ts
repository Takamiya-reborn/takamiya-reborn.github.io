// 节日主题注册表：新增节日 = assets/css/themes/ 加 <name>.css + nuxt.config css 挂载 + holiday/<Name>Scene.vue 场景组件 + 这里和 HolidayFx 场景表各登记一行
// 类型见 config/types.ts，theme 指令只在 dark/light 里选，切不到节日主题
import type { HolidayTheme } from "~/config/types";

const holidayThemes: HolidayTheme[] = [
  {
    name: "halloween",
    // 访客本地 10/31 全天（23 为末档小时，含到 23:59）
    start: { month: 10, day: 31, hour: 0 },
    end: { month: 10, day: 31, hour: 23 },
    themeColor: "#0a0712",
    greet: "Halloween",
  },
  {
    name: "christmas",
    // 访客本地 12/25 全天；想连平安夜晚上也带氛围就把 start 改成 { month: 12, day: 24, hour: 18 }
    start: { month: 12, day: 25, hour: 0 },
    end: { month: 12, day: 25, hour: 23 },
    themeColor: "#060b16",
    greet: "Christmas",
  },
];

// (月, 日, 时) 压成可比较的整数，按访客本地时间取值
function localCode(t: { month: number; day: number; hour: number }) {
  return (t.month * 100 + t.day) * 100 + t.hour;
}

function inWindow(now: Date, t: HolidayTheme) {
  const cur = localCode({
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
  });
  const start = localCode(t.start);
  const end = localCode(t.end);
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
  const holiday = useState<HolidayTheme | null>("holiday-theme", () =>
    resolve(new Date()),
  );
  if (import.meta.client) holiday.value = resolve(new Date());
  const { picked } = useTheme();
  const active = computed(() => (picked.value ? null : holiday.value));
  return { active };
}
