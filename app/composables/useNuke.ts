// rm -rf 彩蛋共享状态：ProfileCard 负责触发，index.vue / ProfileCard 据此 v-if 卸载整页元素
// useState 保证 SSR 下每次请求状态独立，不会跨连接泄漏
export function useNuke() {
  const nuking = useState("nuke-nuking", () => false); // 淡出动画进行中
  const nuked = useState("nuke-nuked", () => false); // 真删完成，页面元素已卸载
  return { nuking, nuked };
}
