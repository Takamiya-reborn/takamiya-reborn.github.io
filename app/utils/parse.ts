// ?raw 静态注入的 JSON 统一解析：语法错误回退 fallback，降级渲染不炸整站
export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
