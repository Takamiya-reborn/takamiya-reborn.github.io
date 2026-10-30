<script setup lang="ts">
// 万圣节定制场景：夜空 + 像素星 + 南瓜月 + 南瓜王云 + 无头骑士 + 烈焰杰克鼠标跟随 + 蝙蝠
// 素材在 public/holiday/halloween/，来自 Terraria wiki（RE-Logic 版权，非商业引用）

// 烈焰杰克跟随鼠标：弹簧物理（刚度+阻尼+限速），追上会甩过头再荡回来，不是急停
const followEl = ref<HTMLElement | null>(null);
const JACK_K = 14; // 弹簧刚度
const JACK_DAMP = 3.5; // 阻尼，低于临界值保留过冲
const JACK_VMAX = 220; // 速度上限，远距离也以这个速度封顶慢飘
let tx = 0, ty = 0, cx = 0, cy = 0, vx = 0, vy = 0, angle = 0, raf = 0, last = 0;
let reduceMotion: MediaQueryList | null = null;

function tick(now: number) {
  raf = requestAnimationFrame(tick);
  // 半隐式欧拉积分；帧间时长封顶，切后台回来不瞬移也不炸积分
  const dt = Math.min((now - last) / 1000, 0.032);
  last = now;
  vx += (JACK_K * (tx - cx) - JACK_DAMP * vx) * dt;
  vy += (JACK_K * (ty - cy) - JACK_DAMP * vy) * dt;
  const v = Math.hypot(vx, vy);
  if (v > JACK_VMAX) {
    vx = (vx / v) * JACK_VMAX;
    vy = (vy / v) * JACK_VMAX;
  }
  cx += vx * dt;
  cy += vy * dt;
  // 面部朝向鼠标：翻转定左右朝向 + ±90° 俯仰跟随指针高度，头永远朝上不倒挂
  // 镜像只翻 x 不翻 y，俯仰两侧天然同向，rotate 不用取反
  const dx0 = tx - cx, dy0 = ty - cy;
  const flip = dx0 < 0;
  const target = Math.atan2(dy0, Math.abs(dx0)) * (180 / Math.PI);
  // 俯仰角按最短路径平滑追赶
  angle += ((target - angle + 540) % 360 - 180) * Math.min(1, dt * 10);
  followEl.value?.style.setProperty("transform",
    `translate3d(${cx}px, ${cy}px, 0) scaleX(${flip ? -1 : 1}) rotate(${angle}deg)`);
  // 位置贴住且速度耗尽才算停，停稳后鼠标再动由 onMove 重新拉起
  if (Math.hypot(tx - cx, ty - cy) < 0.5 && v < 5) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

function onMove(e: MouseEvent) {
  if (!followEl.value) return;
  tx = e.clientX;
  ty = e.clientY;
  // reduced-motion 不做追赶，直接落位
  if (reduceMotion?.matches) {
    cx = tx; cy = ty;
    followEl.value.style.setProperty("transform", `translate3d(${cx}px, ${cy}px, 0)`);
    return;
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

onMounted(() => {
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.addEventListener("mousemove", onMove);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMove);
  if (raf) cancelAnimationFrame(raf);
});
</script>

<template>
  <div>
    <span class="sky" />
    <!-- 像素星星：2-3px 方块，静态常亮 -->
    <span class="star" style="top: 6%; left: 8%; width: 3px; height: 3px" />
    <span class="star" style="top: 12%; left: 20%" />
    <span class="star" style="top: 8%; left: 32%" />
    <span class="star" style="top: 18%; left: 44%; width: 3px; height: 3px" />
    <span class="star" style="top: 5%; left: 55%" />
    <span class="star" style="top: 14%; left: 63%" />
    <span class="star" style="top: 22%; left: 12%" />
    <span class="star" style="top: 28%; left: 26%; width: 3px; height: 3px" />
    <span class="star" style="top: 35%; left: 7%" />
    <span class="star" style="top: 26%; left: 70%" />
    <span class="star" style="top: 20%; left: 84%" />
    <span class="star" style="top: 40%; left: 55%" />
    <span class="star" style="top: 33%; left: 90%; width: 3px; height: 3px" />
    <span class="star" style="top: 44%; left: 35%" />
    <!-- 南瓜月月亮：素圈只做月晕，本体 Terraria 素材 ×2 pixelated -->
    <span class="moon">
      <img src="/holiday/halloween/pumpkin-moon.png" alt="" />
    </span>
    <!-- 南瓜王形状的云，一朵就够，游走漂移 -->
    <span class="cloud-wrap" style="top: 12%; left: 30%">
      <img class="cloud-pumpking" src="/holiday/halloween/pumpking-cloud.png" alt=""
        style="width: 220px; animation-duration: 110s" />
    </span>

    <!-- Terraria 像素素材：pixelated 放大，位置行内写 -->
    <img class="sprite" src="/holiday/halloween/headless-horseman.png" alt=""
      style="right: 6%; bottom: 5%; width: 153px; transform: rotate(30deg); opacity: 0.7" />
    <!-- 无头骑士剑：插在左下角丘上 -->
    <img class="sprite" src="/holiday/halloween/horseman-blade.png" alt=""
      style="left: 5%; bottom: 12%; width: 108px; transform: rotate(-15deg); opacity: 0.7" />

    <!-- 烈焰杰克鼠标跟随：场景最上、内容之下 -->
    <img ref="followEl" class="jack-follow" src="/holiday/halloween/flaming-jack.gif" alt="" />

    <!-- 蝙蝠：外层横穿 + 内层上下浮，只动 transform -->
    <span class="bat-lane" style="top: 16%; animation-duration: 28s; animation-delay: -9s">
      <span class="bat-bob" style="animation-duration: 2s">
        <svg class="bat" viewBox="0 0 24 12">
          <path fill="var(--scene-bat)" d="M1 7 Q6 0 12 5 Q18 0 23 7 Q18 6 15.5 9 L12 6.5 L8.5 9 Q6 6 1 7 Z" />
        </svg>
      </span>
    </span>
    <span class="bat-lane" style="top: 30%; animation-duration: 34s; animation-delay: -22s">
      <span class="bat-bob" style="animation-duration: 1.7s">
        <svg class="bat" viewBox="0 0 24 12" style="width: 18px">
          <path fill="var(--scene-bat)" d="M1 7 Q6 0 12 5 Q18 0 23 7 Q18 6 15.5 9 L12 6.5 L8.5 9 Q6 6 1 7 Z" />
        </svg>
      </span>
    </span>
    <span class="bat-lane" style="top: 8%; animation-duration: 24s; animation-delay: -15s">
      <span class="bat-bob" style="animation-duration: 2.3s">
        <svg class="bat" viewBox="0 0 24 12" style="width: 15px">
          <path fill="var(--scene-bat)" d="M1 7 Q6 0 12 5 Q18 0 23 7 Q18 6 15.5 9 L12 6.5 L8.5 9 Q6 6 1 7 Z" />
        </svg>
      </span>
    </span>
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

.moon {
  position: absolute;
  top: 10%;
  right: 12%;
  width: 100px;
  height: 100px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  /* 月晕是静态 shadow，一次性 paint；底色交给素材，素圈不填色 */
  box-shadow: 0 0 45px 12px var(--scene-moon-glow);
}

.moon img {
  width: 100%;
  image-rendering: pixelated;
  /* 右倾一点，鬼脸更邪；压点透明度免得太亮 */
  transform: rotate(10deg);
  opacity: 0.4;
}

.cloud-wrap {
  position: absolute;
}

.sprite {
  position: absolute;
  image-rendering: pixelated;
}

/* 南瓜王形状的云：游走 + 上下浮 + 摇摆 + 呼吸缩放，闭环循环 */
.cloud-pumpking {
  position: absolute;
  opacity: 0.16;
  animation: cloud-drift 70s ease-in-out infinite;
}

/* 烈焰杰克鼠标跟随：贴着背景层（内容之下），压暗免得扎眼；初始藏在屏幕外，transform 由 rAF 写 */
.jack-follow {
  position: fixed;
  top: -20px;
  left: -20px;
  width: 40px;
  opacity: 0.4;
  pointer-events: none;
  will-change: transform;
}

.bat-lane {
  position: absolute;
  left: 0;
  will-change: transform;
  animation: bat-fly 28s linear infinite;
}

.bat-bob {
  display: block;
  will-change: transform;
  animation: bat-bob 2s ease-in-out infinite alternate;
}

.bat {
  width: 22px;
  height: 11px;
  opacity: 0.55;
}

@keyframes cloud-drift {
  0% {
    transform: translate3d(-6rem, 0.5rem, 0) rotate(-2deg) scale(1);
  }

  33% {
    transform: translate3d(3rem, -0.8rem, 0) rotate(1.5deg) scale(1.06);
  }

  66% {
    transform: translate3d(7rem, 0.6rem, 0) rotate(-1deg) scale(0.97);
  }

  100% {
    transform: translate3d(-6rem, 0.5rem, 0) rotate(-2deg) scale(1);
  }
}

@keyframes bat-fly {
  from {
    transform: translate3d(-8vw, 0, 0);
    opacity: 0;
  }

  8% {
    opacity: 0.75;
  }

  92% {
    opacity: 0.75;
  }

  to {
    transform: translate3d(106vw, -5vh, 0);
    opacity: 0;
  }
}

@keyframes bat-bob {
  from {
    transform: translate3d(0, -0.9rem, 0);
  }

  to {
    transform: translate3d(0, 0.9rem, 0);
  }
}
</style>
