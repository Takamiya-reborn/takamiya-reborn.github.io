// /weather 彩蛋共享状态：commands.ts 的 handler 写入，WeatherFx.vue 据此渲染全页天气特效
// useState 保证 SSR 下每次请求状态独立，不会跨连接泄漏（与 useNuke 同一套路）
export type WeatherMode = "clear" | "rain" | "thunder";

export function useWeather() {
  const weather = useState<WeatherMode>("weather-mode", () => "clear");
  return { weather };
}
