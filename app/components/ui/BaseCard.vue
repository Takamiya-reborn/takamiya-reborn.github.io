<script setup lang="ts">
// 卡片基础容器：玻璃拟态 + 悬停聚光灯与渐变描边
withDefaults(
  defineProps<{
    // 悬停时是否轻微上浮（内容型卡片可关闭）
    hover?: boolean
    // 是否启用鼠标跟随聚光灯
    spotlight?: boolean
    // 是否启用毛玻璃背景；倾斜的卡片必须关闭——backdrop-filter 会把整卡
    // 推进 GPU 合成层，文字被当作纹理旋转重采样而发糊
    glass?: boolean
  }>(),
  { hover: true, spotlight: true, glass: true },
)

function onPointerMove(event: PointerEvent) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  el.style.setProperty('--my', `${event.clientY - rect.top}px`)
}
</script>

<template>
  <section class="card" :class="{ 'card--hover': hover, 'card--spotlight': spotlight, 'card--no-glass': !glass }"
    @pointermove="spotlight ? onPointerMove($event) : undefined">
    <!-- 玻璃背景独立成层：backdrop-filter 不能和倾斜变换同元素，否则整个表面被重采样、文字发糊 -->
    <span class="card-bg" aria-hidden="true" />
    <slot />
  </section>
</template>

<style scoped>
.card {
  position: relative;
  z-index: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.35s var(--ease-bouncy),
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* 玻璃背景层：只承载半透明底色 + backdrop-filter，不含文字，重采样不会影响清晰度 */
.card-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--surface);
  backdrop-filter: blur(12px);
  transition: background 0.3s ease;
}

/* 倾斜卡片：去掉 backdrop-filter，让文字保持 CPU 光栅化，旋转后依然锐利 */
.card--no-glass .card-bg {
  backdrop-filter: none;
  background: var(--surface-strong, rgba(255, 255, 255, 0.05));
}

/* 鼠标跟随聚光灯 */
.card--spotlight::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(18rem circle at var(--mx, 50%) var(--my, 50%),
      color-mix(in srgb, var(--accent) 10%, transparent),
      transparent 55%);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.card--spotlight:hover::before {
  opacity: 1;
}

/* 悬停时亮起的渐变描边光（1px 内描边） */
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg,
      color-mix(in srgb, var(--accent) 55%, transparent),
      color-mix(in srgb, var(--accent-3) 35%, transparent) 40%,
      color-mix(in srgb, var(--accent-2) 40%, transparent) 75%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.card--hover:hover {
  transform: translateY(-4px);
  border-color: var(--border-strong);
}

.card--hover:hover .card-bg {
  background: var(--surface-hover);
}

.card--hover:hover::after {
  opacity: 1;
}
</style>
