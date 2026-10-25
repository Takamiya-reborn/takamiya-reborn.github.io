<script setup lang="ts">
/* ---- /weather 全页天气特效：雨滴压在内容上，氛围层压暗基调，闪电盖全屏 ---- */
const { weather } = useWeather()

// 雨滴参数一次生成，之后只靠 CSS 动画循环，不产生 JS 每帧开销
const drops = Array.from({ length: 72 }, (_, id) => ({
  id,
  left: Math.random() * 100,
  delay: -Math.random() * 1.4, // 负延迟：雨一落下就已经在半空
  dur: 0.75 + Math.random() * 0.7,
  opacity: 0.2 + Math.random() * 0.35,
  len: 40 + Math.random() * 55, // 雨线长度（px）
}))

// 雷暴：随机间隔的闪电，换天 / 卸载时清理计时器
const flash = ref(false)
let boltTimers: ReturnType<typeof setTimeout>[] = []

function scheduleBolt() {
  boltTimers.push(setTimeout(() => {
    flash.value = true
    boltTimers.push(setTimeout(() => (flash.value = false), 350))
    scheduleBolt()
  }, 2200 + Math.random() * 4200))
}

watch(weather, (w) => {
  boltTimers.forEach(clearTimeout)
  boltTimers = []
  flash.value = false
  if (w === 'thunder')
    scheduleBolt()
}, { immediate: true })

onUnmounted(() => boltTimers.forEach(clearTimeout))
</script>

<template>
  <div aria-hidden="true">
    <!-- 雨幕：细线雨滴压在内容上，容器斜置模拟被风吹的斜雨 -->
    <Transition name="wfx">
      <div v-if="weather === 'rain' || weather === 'thunder'" class="rain">
        <span v-for="d in drops" :key="d.id" class="drop" :style="{
          left: `${d.left}%`,
          height: `${d.len}px`,
          opacity: d.opacity,
          animationDelay: `${d.delay}s`,
          animationDuration: `${d.dur}s`,
        }" />
      </div>
    </Transition>

    <!-- 阴天氛围：雨/雷暴把整页压暗一档，换天时页面基调平滑渐变，过渡肉眼可辨 -->
    <Transition name="wfx">
      <div v-if="weather === 'rain'" class="mood mood--rain" />
      <div v-else-if="weather === 'thunder'" class="mood mood--thunder" />
    </Transition>

    <!-- 闪电：雷暴时随机点亮全屏，双闪由关键帧内完成 -->
    <div v-if="weather === 'thunder' && flash" class="bolt" />
  </div>
</template>

<style scoped>
/* 雨在内容上、悬浮终端（z 50）之下；氛围层略低一档，闪电再盖一层 */
.rain,
.bolt {
  position: fixed;
  inset: 0;
  z-index: 45;
  pointer-events: none;
}

.mood {
  position: fixed;
  inset: 0;
  z-index: 44;
  pointer-events: none;
}

.mood--rain {
  background: var(--veil-rain);
}

.mood--thunder {
  background: var(--veil-thunder);
}

/* 换天淡入淡出：拉长到 1s，让基调变化平滑可感知 */
.wfx-enter-active {
  transition: opacity 1.1s ease;
}

.wfx-leave-active {
  transition: opacity 0.9s ease;
}

.wfx-enter-from,
.wfx-leave-to {
  opacity: 0;
}

.rain {
  overflow: hidden;
  /* 斜置 + 放大，让雨斜着落且旋转后仍盖满四角 */
  transform: rotate(7deg) scale(1.15);
}

.drop {
  position: absolute;
  top: -12vh;
  width: 1px;
  border-radius: 1px;
  background: linear-gradient(to bottom, transparent, var(--fx-drop));
  animation: fall linear infinite;
}

@keyframes fall {
  to {
    transform: translateY(128vh);
  }
}

/* 闪电：白光快速双闪（亮—暗—亮—灭），纯 CSS 关键帧演出 */
.bolt {
  background: var(--fx-bolt);
  animation: lightning 0.35s ease-out forwards;
}

@keyframes lightning {
  0% {
    opacity: 0;
  }

  12% {
    opacity: 0.85;
  }

  25% {
    opacity: 0.1;
  }

  40% {
    opacity: 0.6;
  }

  100% {
    opacity: 0;
  }
}
</style>
