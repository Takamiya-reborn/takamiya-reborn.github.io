<script setup lang="ts">
// 点击/触摸时的鼠标涟漪效果：多圈彩色波纹 + 中心光斑 + 火花粒子
interface Spark {
  angle: number
  dist: number
  size: number
  delay: number
  color: string
}
interface Burst {
  id: number
  x: number
  y: number
  sparks: Spark[]
}

const ACCENTS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)']
const bursts = ref<Burst[]>([])
let seed = 0

function makeSparks(): Spark[] {
  const count = 5 + Math.floor(Math.random() * 2)
  return Array.from({ length: count }, (_, i) => ({
    // 均匀铺开角度 + 随机扰动，避免每次都长一样
    angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
    dist: 18 + Math.random() * 18,
    size: 2 + Math.random() * 2,
    delay: Math.random() * 0.08,
    color: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
  }))
}

function spawn(e: PointerEvent) {
  // 主按钮（左键 / 触摸）才触发，避免右键菜单也出现涟漪
  if (e.button !== 0) return
  const id = ++seed
  bursts.value.push({ id, x: e.clientX, y: e.clientY, sparks: makeSparks() })
  if (bursts.value.length > 5) bursts.value.shift()
}

function remove(id: number) {
  bursts.value = bursts.value.filter((b) => b.id !== id)
}

onMounted(() => {
  window.addEventListener('pointerdown', spawn)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', spawn)
})
</script>

<template>
  <div class="cursor-ripples" aria-hidden="true">
    <div
      v-for="b in bursts"
      :key="b.id"
      class="burst"
      :style="{ left: `${b.x}px`, top: `${b.y}px` }"
    >
      <!-- 延迟最长的第三圈结束时才移除整个涟漪，避免提前消失 -->
      <span
        v-for="i in 3"
        :key="i"
        class="ring"
        :class="`ring-${i}`"
        @animationend="i === 3 && remove(b.id)"
      />

      <span class="glow" />

      <span
        v-for="(s, i) in b.sparks"
        :key="i"
        class="spark"
        :style="{
          '--angle': `${s.angle}rad`,
          '--dist': `${s.dist}px`,
          '--size': `${s.size}px`,
          '--delay': `${s.delay}s`,
          '--c': s.color,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.cursor-ripples {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
}

.burst {
  position: absolute;
  width: 0;
  height: 0;
}

/* ---- 三圈波纹：三种主题色依次扩散，越靠外的圈越细越慢 ---- */
.ring {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.2);
  opacity: 0;
  animation: ring-out 0.9s cubic-bezier(0.2, 0.6, 0.3, 1) forwards;
}

.ring-1 {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--accent);
  box-shadow: 0 0 8px var(--accent-soft);
}

.ring-2 {
  width: 14px;
  height: 14px;
  border: 1px solid var(--accent-2);
  animation-delay: 0.06s;
  animation-duration: 0.6s;
}

.ring-3 {
  width: 8px;
  height: 8px;
  border: 1px solid var(--accent-3);
  animation-delay: 0.12s;
  animation-duration: 0.65s;
}

@keyframes ring-out {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.55;
  }
  45% {
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(4.5);
    opacity: 0;
  }
}

/* ---- 中心光斑：先亮一下再散掉，像水面落点的反光 ---- */
.glow {
  position: absolute;
  left: 0;
  top: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, var(--accent-soft), transparent 65%);
  animation: glow-flash 0.35s ease-out forwards;
}

@keyframes glow-flash {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0.6;
    filter: blur(0);
  }
  100% {
    transform: translate(-50%, -50%) scale(1.4);
    opacity: 0;
    filter: blur(3px);
  }
}

/* ---- 火花粒子：沿各自角度飞出去并缩小消失 ---- */
.spark {
  position: absolute;
  left: calc(var(--size) / -2);
  top: calc(var(--size) / -2);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: var(--c);
  box-shadow: 0 0 5px var(--c);
  opacity: 0;
  animation: spark-fly 0.4s cubic-bezier(0.15, 0.7, 0.4, 1) var(--delay) forwards;
}

@keyframes spark-fly {
  0% {
    transform: rotate(var(--angle)) translateX(3px) scale(1);
    opacity: 0.7;
  }
  70% {
    opacity: 0.5;
  }
  100% {
    transform: rotate(var(--angle)) translateX(var(--dist)) scale(0.1);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .glow,
  .spark {
    animation-duration: 0.01s;
  }
}
</style>
