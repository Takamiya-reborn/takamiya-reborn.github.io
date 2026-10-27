<script setup lang="ts">
// 氛围背景：色斑 + 渐隐网格 + 噪点 + 漂浮游戏图标
// party（科乐美彩蛋，EasterEggLayer 写入）：全屏色相旋转
const party = useState("egg-party", () => false);
</script>

<template>
  <div class="backdrop" :class="{ 'backdrop--party': party }" aria-hidden="true">
    <span class="blob blob--indigo" />
    <span class="blob blob--cyan" />
    <span class="blob blob--violet" />
    <span class="grid-overlay" />
    <span class="noise" />
    <!-- 漂浮图标：位置/节奏各写行内，bob 关键帧在 main.css 全局 -->
    <span class="float-icon" style="top: 18%; left: 5%; animation-delay: -1s; color: var(--accent)">
      <Icon name="lucide:gamepad-2" size="34" />
    </span>
    <span class="float-icon"
      style="top: 30%; right: 7%; animation-delay: -3.2s; animation-duration: 7.5s; color: var(--accent-4)">
      <Icon name="lucide:star" size="28" />
    </span>
    <span class="float-icon"
      style="bottom: 22%; left: 9%; animation-delay: -5s; animation-duration: 8s; color: var(--accent-2)">
      <Icon name="lucide:ghost" size="30" />
    </span>
    <span class="float-icon" style="bottom: 40%; right: 14%; animation-delay: -2.4s; color: var(--accent-6)">
      <Icon name="lucide:heart" size="24" />
    </span>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: var(--bg);
}

.backdrop--party {
  animation: hue-spin 2.5s linear infinite;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  will-change: transform;
}

.blob--indigo {
  width: 38rem;
  height: 38rem;
  top: -14rem;
  left: -8rem;
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  animation: drift 26s ease-in-out infinite alternate;
}

.blob--cyan {
  width: 32rem;
  height: 32rem;
  top: -10rem;
  right: -6rem;
  background: color-mix(in srgb, var(--accent-2) 13%, transparent);
  animation: drift 34s ease-in-out infinite alternate-reverse;
}

.blob--violet {
  width: 30rem;
  height: 30rem;
  bottom: -14rem;
  left: 32%;
  background: color-mix(in srgb, var(--accent-3) 11%, transparent);
  animation: drift 40s ease-in-out infinite alternate;
}

/* 顶部渐隐网格 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 25%, transparent 75%);
  mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 25%, transparent 75%);
}

/* 噪点：压渐变的塑料感 */
.noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  opacity: 0.05;
}

.float-icon {
  position: absolute;
  opacity: 0.16;
  animation: bob 6s ease-in-out infinite alternate;
}

@keyframes hue-spin {
  to {
    filter: hue-rotate(360deg);
  }
}

@keyframes drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(4rem, -2.5rem, 0) scale(1.12);
  }

  100% {
    transform: translate3d(-3rem, 2rem, 0) scale(0.95);
  }
}
</style>
