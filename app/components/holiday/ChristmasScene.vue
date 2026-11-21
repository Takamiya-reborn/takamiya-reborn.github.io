<template>
  <!-- 圣诞节定制场景（占位版）：冰雪夜空 + 像素星 + 冰月 + 纯 CSS 降雪，
       后续换素材时照 HalloweenScene 套路：public/holiday/christmas/ 放图 + 令牌接线 -->
  <div>
    <span class="sky" />
    <!-- 像素星星：2-3px 方块，静态常亮 -->
    <span class="star" style="top: 7%; left: 10%; width: 3px; height: 3px" />
    <span class="star" style="top: 13%; left: 22%" />
    <span class="star" style="top: 9%; left: 35%; width: 3px; height: 3px" />
    <span class="star" style="top: 19%; left: 47%" />
    <span class="star" style="top: 6%; left: 58%; width: 3px; height: 3px" />
    <span class="star" style="top: 15%; left: 67%" />
    <span class="star" style="top: 24%; left: 15%" />
    <span class="star" style="top: 30%; left: 29%; width: 3px; height: 3px" />
    <span class="star" style="top: 38%; left: 8%" />
    <span class="star" style="top: 27%; left: 74%" />
    <span class="star" style="top: 21%; left: 86%" />
    <span class="star" style="top: 43%; left: 57%" />
    <span class="star" style="top: 35%; left: 92%; width: 3px; height: 3px" />
    <span class="star" style="top: 47%; left: 38%" />
    <!-- 降雪：行内错峰错位，只动 transform -->
    <span class="flake" style="left: 6%; animation-duration: 12s; animation-delay: -3s" />
    <span class="flake" style="left: 14%; animation-duration: 15s; animation-delay: -9s; width: 4px; height: 4px" />
    <span class="flake" style="left: 23%; animation-duration: 11s; animation-delay: -1s; opacity: 0.45" />
    <span class="flake" style="left: 31%; animation-duration: 16s; animation-delay: -12s; width: 4px; height: 4px" />
    <span class="flake" style="left: 38%; animation-duration: 10s; animation-delay: -6s" />
    <span class="flake" style="left: 46%; animation-duration: 14s; animation-delay: -4s; opacity: 0.45" />
    <span class="flake" style="left: 54%; animation-duration: 12s; animation-delay: -8s; width: 5px; height: 5px" />
    <span class="flake" style="left: 61%; animation-duration: 17s; animation-delay: -14s" />
    <span class="flake" style="left: 69%; animation-duration: 11s; animation-delay: -2s; opacity: 0.45" />
    <span class="flake" style="left: 76%; animation-duration: 15s; animation-delay: -10s; width: 4px; height: 4px" />
    <span class="flake" style="left: 84%; animation-duration: 13s; animation-delay: -5s" />
    <span class="flake" style="left: 91%; animation-duration: 16s; animation-delay: -7s; width: 5px; height: 5px" />
  </div>
</template>

<style scoped>
/* 动画只碰 transform/opacity，走合成器 */
.sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--scene-sky-top) 0%, var(--scene-sky-mid) 55%, var(--scene-sky-bottom) 100%);
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--scene-star);
  opacity: 0.35;
}

.flake {
  position: absolute;
  top: -2vh;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--scene-snow);
  opacity: 0.7;
  animation: snow-fall linear infinite;
  will-change: transform;
}

@keyframes snow-fall {
  from {
    transform: translate3d(0, -4vh, 0);
  }

  to {
    transform: translate3d(2vw, 108vh, 0);
  }
}

/* 减少动态效果：停雪，星空月亮保留 */
@media (prefers-reduced-motion: reduce) {
  .flake {
    display: none;
  }
}
</style>
