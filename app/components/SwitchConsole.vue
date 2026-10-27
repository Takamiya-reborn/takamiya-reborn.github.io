<template>
  <!-- 游戏机外壳：黑色机身 + 左右 Joy-Con 侧板 + 装饰件，与 quote 逻辑解耦。
       屏幕内容和真实按键由插槽注入；高度随屏幕内容（16:9）自然撑出 -->
  <div class="console">
    <div class="console-body">
      <!-- 左 Joy-Con：装饰面板（− 键 + 摇杆 + 十字点 + 捕捉键 + 标志），不承载交互 -->
      <div class="quote-rail quote-rail--ghost" aria-hidden="true">
        <span class="joy-sys joy-sys--minus" />
        <div class="joy-stick"><span class="joy-stick-cap" /></div>
        <div class="joy-dpad">
          <button type="button"><span class="tri tri--up" /></button>
          <button type="button"><span class="tri tri--left" /></button>
          <button type="button"><span class="tri tri--right" /></button>
          <button type="button"><span class="tri tri--down" /></button>
        </div>
        <div class="joy-capture" />
      </div>

      <!-- 屏幕：黑色机身中央留给屏幕，内容由父组件注入 -->
      <slot name="screen" />

      <!-- 右 Joy-Con：+ 键在上，真实按键（插槽）、装饰摇杆 + home 键在下 -->
      <div class="quote-rail">
        <span class="joy-sys joy-sys--plus joy-deco" aria-hidden="true" />
        <slot name="controls" />
        <div class="joy-stick joy-deco" aria-hidden="true"><span class="joy-stick-cap" /></div>
        <div class="joy-home joy-deco" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 机壳：包住屏幕和按键的外框，顶部塑料高光 + 外投影压出体积感。
   整机固定配色（Joy-Con 霓虹蓝/红 + 黑机身黑屏幕），不随主题切换；
   色板挂在 .console 上，插槽里的屏幕内容也继承这套变量 */
.console {
  position: relative;
  /* 纵向 flex：body 靠 flex 撑满机壳，不依赖百分比高度（min-height 撑开的
     高度对子级百分比是 auto，height: 100% 会失效导致整体贴顶） */
  display: flex;
  flex-direction: column;
  /* 整机锁设计宽度：窄屏容器装不下时交给外层横向滑动（与技能板同款），
     不做重排兜底——Joy-Con 永远分列屏幕两侧，变形无从谈起 */
  min-width: 65rem;
  --jc-blue: #00c2db;
  --jc-red: #f85a51;
  --jc-body: #0c0d10;
  --jc-screen: #000;
  --jc-text: #e8ecf4;
  --jc-muted: #94a0b8;
  /* 机壳 padding 抽成变量：侧板用负 margin 反向吃掉它，直接顶到机身边缘 */
  --shell-pad: clamp(0.6rem, 1.5vw, 1rem);
  /* 外投影颜色走主题变量：机身配色固定不随主题，但投在页面上的影子
     得跟页面背景走——纯黑影在浅色模式的近白底上会变成一块灰色方板。
     尺寸同时受外层滑动容器的裁切约束：纵向伸入 ≤ 2.75rem、水平 ≤ 1rem
     （即 HScrollViewport 的 shadow-pad），超出会被 overflow 切出方形硬边 */
  --jc-drop-1: 0 1rem 2rem -0.8rem rgba(0, 0, 0, 0.45);
  --jc-drop-2: 0 1.5rem 2rem -1rem rgba(0, 0, 0, 0.4);
  padding: var(--shell-pad);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: calc(var(--radius) + 3rem);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 40%),
    var(--jc-body);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -0.8rem 1.5rem rgba(0, 0, 0, 0.35),
    var(--jc-drop-1),
    var(--jc-drop-2);
}

/* 边缘受光：1.5px 渐变描边环，左上角最亮、右下角弱回光，
   光从左上打，厚度感靠轮廓光不靠投影 */
.console::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0.04) 60%,
      rgba(255, 255, 255, 0.16));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

.console-body {
  /* 像 NS：屏幕嵌在正中，左右各一列按键；flex: 1 撑满机壳内容区 */
  flex: 1;
  display: flex;
  align-items: stretch;
  gap: clamp(1.25rem, 3vw, 2rem);
}

.quote-rail {
  /* 弹性加宽：与另一侧等分屏幕以外的宽度，内容水平居中，屏幕保持正中；
     纵向 space-evenly 照真机节奏铺开（摇杆/按键组在上，装饰件在下） */
  position: relative;
  flex: 1 1 0;
  /* 下限按十字键（6.3rem）定：再窄键就会溢出侧板底色 */
  min-width: 6.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  gap: 0;
  padding-block: 0.5rem;
}

/* Joy-Con 侧板：负 margin 顶到机身边缘，整块霓虹蓝/红实色——侧板就是外壳本身，
   外侧两个角随机身圆角，拼接侧平直延伸到接缝 */
.console-body .quote-rail:first-child {
  margin-block: calc(-1 * var(--shell-pad));
  margin-left: calc(-1 * var(--shell-pad));
  background: var(--jc-blue);
  border-radius: calc(var(--radius) + 3rem - 1px) 0 0 calc(var(--radius) + 3rem - 1px);
}

.console-body .quote-rail:last-child {
  margin-block: calc(-1 * var(--shell-pad));
  margin-right: calc(-1 * var(--shell-pad));
  background: var(--jc-red);
  border-radius: 0 calc(var(--radius) + 3rem - 1px) calc(var(--radius) + 3rem - 1px) 0;
}

/* 侧板圆柱高光 + 圆角高光点：光从左上来，外侧受光、靠屏幕一侧渐暗；
   两个外侧圆角上各叠一记高光，上角强下角弱（打光不一）。
   右侧直接写镜像，不用 transform 翻转（scaleX 会把圆角一起镜像） */
.console-body .quote-rail:first-child::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(2.4rem 2.4rem at 0 0,
      rgba(255, 255, 255, 0.4), transparent 65%),
    radial-gradient(2.4rem 2.4rem at 0 100%,
      rgba(255, 255, 255, 0.22), transparent 65%),
    linear-gradient(90deg,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0) 30%,
      rgba(0, 0, 0, 0.12) 78%,
      rgba(0, 0, 0, 0.28));
  pointer-events: none;
}

.console-body .quote-rail:last-child::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(2.4rem 2.4rem at 100% 0,
      rgba(255, 255, 255, 0.4), transparent 65%),
    radial-gradient(2.4rem 2.4rem at 100% 100%,
      rgba(255, 255, 255, 0.22), transparent 65%),
    linear-gradient(270deg,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0) 30%,
      rgba(0, 0, 0, 0.12) 78%,
      rgba(0, 0, 0, 0.28));
  pointer-events: none;
}

/* Joy-Con 接缝：侧板内缘压一条上下贯通的凹槽，染色到拼接线为止 */
.console-body .quote-rail:first-child::after,
.console-body .quote-rail:last-child::before {
  content: '';
  position: absolute;
  inset-block: 0;
  width: 2px;
  background: linear-gradient(180deg,
      transparent,
      rgba(0, 0, 0, 0.55) 10% 90%,
      transparent);
  pointer-events: none;
}

/* 凹槽朝屏幕一侧补一道 1px 高光，立体感 */
.console-body .quote-rail:first-child::after {
  right: -2px;
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.05);
}

.console-body .quote-rail:last-child::before {
  left: -2px;
  box-shadow: -1px 0 0 rgba(255, 255, 255, 0.05);
}

/* 摇杆：底座凹槽 + 凸起的帽 */
.joy-stick {
  width: 3.6rem;
  height: 3.6rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #08090b;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 0.2rem 0.4rem rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.joy-stick-cap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(180deg, #232327, #17171a);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

/* −/+ 系统键：真机在 Joy-Con 顶部靠屏幕一侧的加减号刻印。
   lucide 没有粗体变体，直接用 CSS 画粗条（0.22rem，与方向三角同路数）；
   两侧 rail 的 space-evenly 等分数不同（元素个数不同），流内排布
   两颗键必然不等高，故绝对定位钉在相同高度保证左右对称 */
.joy-sys {
  position: absolute;
  top: 1.1rem;
  width: 0.95rem;
  height: 0.95rem;
  /* 实色黑刻印，不透底色 */
  color: #17171a;
}

.joy-sys::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 0.24rem;
  transform: translateY(-50%);
  border-radius: 1px;
  background: currentColor;
}

.joy-sys--minus {
  right: 10%;
}

.joy-sys--plus {
  left: 10%;
}

.joy-sys--plus::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 0.24rem;
  transform: translateX(-50%);
  border-radius: 1px;
  background: currentColor;
}

/* 十字方向键：仿照右侧 YXAB 菱形同构排布（格子 2.5rem < 键 2.8rem，
   键居中溢出格子，对角圆心距节奏与右侧完全一致），装饰不承载交互 */
.joy-dpad {
  display: grid;
  grid-template-columns: repeat(3, 2.1rem);
  grid-template-rows: repeat(3, 2.1rem);
  gap: 0;
}

/* 方向键是真 button：可聚焦可按，但不挂任何事件，按了没反应；
   手感对齐右侧实体键（按下键帽下沉）。键帽不透明纯黑，
   不让霓虹底色透上来 */
.joy-dpad button {
  place-self: center;
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border-radius: 50%;
  background: #0a0b0d;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -0.12rem 0.25rem rgba(0, 0, 0, 0.28);
  /* 方向刻印：深灰实心三角，弱一点不抢实体键 */
  color: #6b7280;
  cursor: pointer;
  transition:
    box-shadow 0.25s,
    transform 0.15s;
}

.joy-dpad button:active {
  transform: translateY(0.1rem);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0.15rem 0.4rem rgba(0, 0, 0, 0.4);
}

/* 菱形格位：上/左/右/下，格位定死不靠自动排布 */
.joy-dpad button:nth-child(1) {
  grid-area: 1 / 2;
}

.joy-dpad button:nth-child(2) {
  grid-area: 2 / 1;
}

.joy-dpad button:nth-child(3) {
  grid-area: 2 / 3;
}

.joy-dpad button:nth-child(4) {
  grid-area: 3 / 2;
}

/* 方向三角：CSS 边框画的实心三角（lucide 的三角是描边图形，
   mask 渲染下只有空心轮廓，不像键帽刻印）。基础朝上，其余方向旋转 */
.tri {
  width: 0;
  height: 0;
  border-inline: 0.4rem solid transparent;
  border-block-end: 0.62rem solid currentColor;
}

.tri--left {
  transform: rotate(-90deg);
}

.tri--right {
  transform: rotate(90deg);
}

.tri--down {
  transform: rotate(180deg);
}

/* 捕捉键：左 Joy-Con 下部的小方键，往 rail 中部收一点 */
.joy-capture {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 0.3rem;
  background: #17171a;
  border: 1px solid rgba(255, 255, 255, 0.16);
  /* 往中部收 + 靠近屏幕（左板屏幕在右） */
  transform: translate(1.6rem, -1rem);
}

/* home 键：右 Joy-Con 下部的小方键（与捕捉键对称），往 rail 中部收一点 */
.joy-home {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 0.3rem;
  background: #17171a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  /* 往中部收 + 靠近屏幕（右板屏幕在左） */
  transform: translate(-1.6rem, -1rem);
}
</style>
