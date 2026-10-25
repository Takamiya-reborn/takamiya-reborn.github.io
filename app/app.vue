<script setup lang="ts">
// 全站加载门卫：资源就绪（加载屏 emit done）前只渲染加载屏，正文压根不进
// DOM——页面无可滚动内容，不需要任何滚动锁；就绪后 out-in 交换，
// 正文从头挂载，卡片入场动画正好当作"进入游戏"的开幕
const ready = ref(false)

// 主题：theme 指令写入 useTheme 状态，这里用 useHead 把它落到 <html data-theme>，
// 配色由 main.css 的浅色覆盖块接管；theme-color meta 同步换，浏览器地址栏跟着变色
const { theme, init } = useTheme()
useHead({
  htmlAttrs: { 'data-theme': () => (theme.value === 'light' ? 'light' : undefined) },
  meta: [{ name: 'theme-color', content: () => (theme.value === 'light' ? '#f4f6fb' : '#06070d') }],
})

onMounted(init)
</script>

<template>
  <!-- type="transition"：加载屏根元素挂着 45s 延迟的兜底淡出动画（JS 失效用），
       不显式指定类型的话 Vue 会按 animation 时长（45.6s）等离场，正文被卡 45s 不挂载 -->
  <Transition name="app-swap" mode="out-in" type="transition">
    <AppLoader v-if="!ready" key="loader" @done="ready = true" />
    <div v-else key="site">
      <NuxtPage />
      <CursorRipples />
    </div>
  </Transition>
</template>

<style scoped>
/* 加载屏淡出离场，正文随后淡入 */
.app-swap-leave-active {
  transition:
    opacity 0.5s var(--ease-out),
    transform 0.5s var(--ease-out);
}

.app-swap-leave-to {
  opacity: 0;
  transform: translateY(-1.5%);
}

.app-swap-enter-active {
  transition: opacity 0.4s var(--ease-out);
}

.app-swap-enter-from {
  opacity: 0;
}

/* 系统开了"减少动态效果"：出入场都改瞬切 */
@media (prefers-reduced-motion: reduce) {
  .app-swap-leave-active,
  .app-swap-enter-active {
    transition: none;
  }
}
</style>
