<script setup lang="ts">
// 横向滑动容器：内容锁设计宽度，窄屏滑动；提示按实际溢出检测，不硬编码断点
withDefaults(
  defineProps<{
    /** 溢出提示文案 */
    hint?: string;
    /** 内容自带外投影时垫裁切余量 */
    shadowPad?: boolean;
  }>(),
  { hint: "← 左右滑动查看 →" },
);

const viewport = ref<HTMLElement | null>(null);
const overflow = ref(false);

function measure() {
  const el = viewport.value;
  if (el) overflow.value = el.scrollWidth > el.clientWidth + 1;
}

// 初始滚到内容居中（无滚动时 no-op）
onMounted(() => {
  const el = viewport.value;
  if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  measure();
  window.addEventListener("resize", measure);
});

onUnmounted(() => window.removeEventListener("resize", measure));
</script>

<template>
  <div>
    <div ref="viewport" class="viewport" :class="{ 'viewport--shadow-pad': shadowPad }">
      <slot />
    </div>
    <p v-if="overflow" class="scroll-hint" aria-hidden="true">{{ hint }}</p>
  </div>
</template>

<style scoped>
.viewport {
  overflow-x: auto;
  /* 单轴 auto 会把另一轴 visible 强算成 auto，锁死纵轴防瞬时滚动条 */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  /* 手势不外链页面，只在自己体内回弹 */
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--muted) transparent;
}

/* 投影余量：padding 垫出、负 margin 找回占位 */
.viewport--shadow-pad {
  padding: 0.5rem 1rem 2.75rem;
  margin: -0.5rem -1rem -2.75rem;
}

.scroll-hint {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: center;
}
</style>
