// v-reveal 指令：进入视口时浮现；用法 v-reveal 或 v-reveal="{ delay: 120 }"

interface RevealValue {
  // 过渡延迟（毫秒），用于卡片交错入场
  delay?: number;
}

interface RevealElement extends HTMLElement {
  _revealIO?: IntersectionObserver;
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive<HTMLElement, RevealValue | undefined>("reveal", {
    // SSR 时不产出任何属性，避免服务端警告
    getSSRProps: () => ({}),

    mounted(el: RevealElement, binding) {
      el.classList.add("reveal");
      const delay = binding.value?.delay ?? 0;
      if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);

      // 无 IO 环境（老浏览器/测试环境）直接显示
      if (typeof IntersectionObserver === "undefined") {
        el.classList.add("reveal--visible");
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.classList.add("reveal--visible");
              io.disconnect();
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
      );
      io.observe(el);
      el._revealIO = io;
    },

    unmounted(el: RevealElement) {
      el._revealIO?.disconnect();
    },
  });
});
