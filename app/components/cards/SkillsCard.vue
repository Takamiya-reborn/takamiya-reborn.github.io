<script setup lang="ts">
import type { SkillGroup, SkillItem } from '~/config/types'

const props = defineProps<{
  groups: SkillGroup[]
}>()

/* 分组配色：引用 main.css 的六色主题池变量，浅色主题切换时自动跟随 */
const PALETTE = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--accent-4)', 'var(--accent-5)', 'var(--accent-6)'] as const

/* 技能品牌图标：slug 已对照本地 @iconify-json/simple-icons 逐一核实；
   表外技能按"去符号小写"猜测（Vitest → vitest 这类），猜不中则不渲染图标 */
const ICONS: Record<string, string> = {
  Python: 'simple-icons:python',
  JavaScript: 'simple-icons:javascript',
  TypeScript: 'simple-icons:typescript',
  'C++': 'simple-icons:cplusplus',
  Go: 'simple-icons:go',
  HTML: 'simple-icons:html5',
  CSS: 'simple-icons:css',
  Vue: 'simple-icons:vuedotjs',
  Nuxt: 'simple-icons:nuxtdotjs',
  TailwindCSS: 'simple-icons:tailwindcss',
  'Anime.js': 'simple-icons:animedotjs',
  Konva: 'simple-icons:konva',
  Django: 'simple-icons:django',
  Flask: 'simple-icons:flask',
  PyQt: 'simple-icons:qt',
  Streamlit: 'simple-icons:streamlit',
  'Node.js': 'simple-icons:nodedotjs',
  Electron: 'simple-icons:electron',
  '.NET': 'simple-icons:dotnet',
  PyTorch: 'simple-icons:pytorch',
  Pandas: 'simple-icons:pandas',
  Polars: 'simple-icons:polars',
  Ultralytics: 'simple-icons:ultralytics',
  PydanticAI: 'simple-icons:pydantic',
  Docker: 'simple-icons:docker',
  Vite: 'simple-icons:vite',
  npm: 'simple-icons:npm',
  uv: 'simple-icons:uv',
  Godot: 'simple-icons:godotengine',
  Unity: 'simple-icons:unity',
  'Unreal Engine': 'simple-icons:unrealengine',
  Blender: 'simple-icons:blender',
}

function iconFor(name: string): string {
  return ICONS[name] ?? `simple-icons:${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

/* 悬停高亮：按 path 前缀点亮整条祖先/后代链，其余淡出。
   鼠标移出胶囊即熄灭；触屏没有 hover，点按胶囊切换高亮链路，
   点按板面空白处熄灭 */
const hoveredPath = ref<string | null>(null)

function isOn(path: string): boolean {
  if (hoveredPath.value === null) return false
  return hoveredPath.value.startsWith(path) || path.startsWith(hoveredPath.value)
}

function linkOn(l: LinkItem): boolean {
  return l.paths.some(p => isOn(p))
}

function linkDim(l: LinkItem): boolean {
  return hoveredPath.value !== null && !linkOn(l)
}

/* 触屏没有 hover：点按胶囊切换高亮链路；鼠标交互只认 pointerType === 'mouse'，
   避免触屏点按触发的模拟 mouse 事件把点按选中的高亮立刻冲掉 */
function hoverIn(path: string, e: PointerEvent) {
  if (e.pointerType === 'mouse') hoveredPath.value = path
}

function hoverOut(e: PointerEvent) {
  if (e.pointerType === 'mouse') hoveredPath.value = null
}

function tapSelect(path: string) {
  if (window.matchMedia('(hover: none)').matches)
    hoveredPath.value = hoveredPath.value === path ? null : path
}

/* 点按板面空白处熄灭高亮（胶囊自身的 click 会冒泡上来，用 closest 排除） */
function boardTap(e: MouseEvent) {
  if ((e.target as HTMLElement | null)?.closest?.('.skill-pill, .group-pill, .root-pill')) return
  hoveredPath.value = null
}

/* 移动端树保持设计宽度横向滑动，初始滚到根芯片居中 */
const viewport = ref<HTMLElement | null>(null)
onMounted(() => {
  const el = viewport.value
  if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
})

/* ---- 电路板走线布局 ----
   根芯片居中，主干先对齐再散开：根芯片 → 水平线 → 左右两条竖直
   主汇流排，每路分组从排上以单个 45° 倒角引出。分组芯片外侧是
   本地分配排，技能像 DIP 元件一样双列交错排布，由分配排并行扇出
   ——每组一个星型，除两处 45° 倒角外全是短直线，无交叉、无飞线。
   双列上下各错半格，外列落点才不会穿过内列胶囊；同一对技能按
   估算宽度分配内外列（宽者靠内），保证最宽胶囊不出板框。
   所有坐标确定性计算、无随机抖动，SSR 与客户端渲染一致 */

const VB_W = 1220
const VB_TOP = -400 // viewBox 上缘（y 最小值）
const VB_H = 800
const P = 40 // 技能纵向间距：双列各错半格，同列相邻胶囊间隔 2P
const CH = 13 // 45° 倒角直角边长：全局统一，保证拐角等长
const TX = 110 // 主汇流排到根芯片的水平距离
const COL_IN = 235 // 分组列到根芯片的水平距离（倒角后仍留 ~44 直线段）
const LBUS = 340 // 分组本地分配排到根芯片的水平距离
const COL_INNER = 432 // 技能内列到根芯片的水平距离
const COL_OUTER = 545 // 技能外列到根芯片的水平距离
const BLOCK_GAP = 50 // 同侧相邻分组块之间的空隙

interface TreeNode {
  name: string
  icon?: string
  path: string
  color: string
  hub: boolean
  x: number
  y: number
  delay: number
}

interface GroupNode {
  path: string
  name: string
  icon: string
  color: string
  x: number
  y: number
  delay: number
  nodes: TreeNode[]
}

/** 技能项按配置顺序摊平成升级链；children 内联跟在父节点后面。
    path 按层级编号（父 2.4、子 2.4.0），悬停链路靠前缀匹配父子相连 */
function flatten(items: SkillItem[], base: string, out: { name: string, icon?: string, path: string, hub: boolean }[]) {
  items.forEach((item, i) => {
    const path = `${base}.${i}`
    if (typeof item === 'string') {
      out.push({ name: item, icon: iconFor(item), path, hub: false })
    }
    else {
      out.push({ name: item.name, icon: iconFor(item.name), path, hub: Boolean(item.children?.length) })
      if (item.children?.length) flatten(item.children, path, out)
    }
  })
}

const chains = props.groups.map((g, gi) => {
  const items: { name: string, icon?: string, path: string, hub: boolean }[] = []
  flatten(g.skills, `${gi}`, items)
  return { g, gi, items }
})

/* 贪心分列：每组占 ceil(n/2) 行（双列并排），放进当前较矮的一列，
   左右两列总行数自然趋近（当前数据左右各 9 行） */
const columns: (typeof chains)[] = [[], []]
const colRows: [number, number] = [0, 0]
for (const c of chains) {
  const side = colRows[0] <= colRows[1] ? 0 : 1
  columns[side]!.push(c)
  colRows[side]! += Math.ceil(c.items.length / 2)
}

/* 胶囊全宽估算：mono 字宽 × 字符数 + 图标 + 内边距（0.95rem mono ≈ 9.2/字符） */
const widthOf = (name: string) => name.length * 9.2 + 42

const groupNodes: GroupNode[] = []
const skillNodes: TreeNode[] = []

/* 分组芯片默认与该组首行技能齐平；个别组按行数下移，与指定技能对齐 */
const GROUP_Y_OFFSET: Record<string, number> = {
  编程语言: 2 * P, // 与 Python（换位后第 2 行）齐平
  后端与桌面: 3 * P, // 与 PyQt（第 4 项）齐平
  'AI 与数据': 2 * P, // 与 Pandas（第 3 项）齐平
  前端与图形: 3 * P, // 与 Vue（第 4 项）齐平
}

columns.forEach((col, side) => {
  const s = side === 0 ? -1 : 1 // 左列向 x 负方向展开
  const totalH = col.reduce((acc, c) => acc + (c.items.length - 1) * P, 0) + (col.length - 1) * BLOCK_GAP
  let top = -totalH / 2 // 首个分组芯片中心 = 首行技能 y
  col.forEach((c) => {
    const color = PALETTE[c.gi % PALETTE.length]!
    const groupY = top + (GROUP_Y_OFFSET[c.g.title] ?? 0)
    const nodes: TreeNode[] = c.items.map((it, k) => {
      /* 双列交错：同对两技能上下各错半格、分列内外；较宽者放内列
         （内列更靠近分配排、外侧空间少），落单的放内列 */
      const pair = Math.floor(k / 2)
      const y = top + (2 * pair + (k % 2)) * P
      let inner: boolean
      if (k % 2 === 0) {
        const mate = c.items[k + 1]
        inner = !mate || widthOf(it.name) >= widthOf(mate.name)
      }
      else {
        const mate = c.items[k - 1]!
        inner = widthOf(it.name) > widthOf(mate.name)
      }
      return {
        ...it,
        color,
        x: s * (inner ? COL_INNER : COL_OUTER),
        y,
        delay: 0.35 + c.gi * 0.07 + k * 0.04,
      }
    })
    groupNodes.push({
      path: `${c.gi}`,
      name: c.g.title,
      icon: c.g.icon ?? 'lucide:circle',
      color,
      x: s * COL_IN,
      y: groupY,
      delay: 0.15 + c.gi * 0.07,
      nodes,
    })
    skillNodes.push(...nodes)
    top += (c.items.length - 1) * P + BLOCK_GAP
  })
})

/* 指定技能两两互换显示坐标：摊平顺序与父子链路不动（TS 逻辑上仍挂
   在 JS 下），仅布局层面对调位置 */
const NODE_POS_SWAP: [string, string][] = [
  ['Python', 'TypeScript'],
]

for (const [a, b] of NODE_POS_SWAP) {
  const na = skillNodes.find(n => n.name === a)
  const nb = skillNodes.find(n => n.name === b)
  if (na && nb) {
    ;[na.x, nb.x] = [nb.x, na.x]
      ;[na.y, nb.y] = [nb.y, na.y]
  }
}

/* 个别技能收短走线：胶囊自所在列向分配排方向挪近指定距离 */
const NODE_X_PULL: Record<string, number> = {
  TypeScript: 60, // 自外列向内收 60，走线 205 → 145
}

for (const [name, pull] of Object.entries(NODE_X_PULL)) {
  const n = skillNodes.find(p => p.name === name)
  if (n && n.x) n.x -= Math.sign(n.x) * pull
}

/* 坐标 → 覆盖层百分比定位 */
const pctX = (v: number) => ((v + VB_W / 2) / VB_W) * 100
const pctY = (v: number) => ((v - VB_TOP) / VB_H) * 100

const rootPos = { left: pctX(0), top: pctY(0) }

/* ---- 连线：短直线星型扇出，无交叉 ----
   主干与本地分配排都按"每条链路一条完整路由"画：根芯片 → 汇流排
   → 分组、分组 → 分配排 → 技能，各自独立成段并标记所属胶囊。
   路由间的重合段同色覆盖（stroke 用颜色百分比而非 opacity），
   静止观感与共用一条汇流排完全一致；悬停时只点亮目标链路本身，
   汇流排上通向其余分组的部分随之淡出，不再有断头的亮线 */
interface LinkItem {
  d: string
  paths: string[] // 该段走线连通的胶囊路径：悬停链路命中其一即整段点亮
  color: string
  delay: number
}

const links: LinkItem[] = []

for (const s of [-1, 1]) {
  const gs = groupNodes.filter(g => Math.sign(g.x) === s)
  /* 根芯片 → 汇流排的水平公共段：该侧任一分组在链路上即点亮 */
  links.push({ d: `M 0 0 H ${s * TX}`, paths: gs.map(g => g.path), color: 'var(--accent)', delay: 0.05 })
  for (const g of gs) {
    const t = Math.sign(g.y)
    /* 每组一条独立干线：从根芯片高度沿汇流排直引到该组，
       不再共用一段"无论悬停谁都全程通电"的排线。
       45° 倒角只留给汇流排尽头（行进方向上没有更远的分组），
       半途 T 接引出的分组保持直角——排还在向下游延伸，不能斜切 */
    const tEnd = !gs.some(o => o !== g && (o.y - g.y) * t > 0)
    const c = tEnd ? CH : 0
    links.push({
      d: `M ${s * TX} 0 V ${g.y - t * c}${c ? ` L ${s * (TX + CH)} ${g.y}` : ''} H ${s * COL_IN}`,
      paths: [g.path],
      color: 'var(--accent)',
      delay: g.delay,
    })
    if (!g.nodes.length) continue
    /* 分组芯片 → 本地分配排 → 技能：同样每技能一条完整路由。分配排
       两端的终点各做单个 45° 倒角——终点按 y 极值取（技能换位、芯片
       下移后，列表顺序不再等于行序）；中途分支保持 T 接 */
    const topNode = g.nodes.reduce((a, b) => (b.y < a.y ? b : a))
    const bottomNode = g.nodes.reduce((a, b) => (b.y > a.y ? b : a))
    const chamferDown = bottomNode.y - g.y >= CH ? CH : 0
    const chamferUp = g.y - topNode.y >= CH ? CH : 0
    for (const n of g.nodes) {
      /* 终点倒角方向随行进方向翻转：自下而上抵达时先停在 n.y + c 再斜切 */
      const below = n.y > g.y
      const c = n === (below ? bottomNode : topNode) ? (below ? chamferDown : chamferUp) : 0
      const vy = below ? n.y - c : n.y + c
      links.push({
        d: `M ${g.x} ${g.y} H ${s * LBUS} V ${vy}${c ? ` L ${s * (LBUS + c)} ${n.y}` : ''} H ${n.x}`,
        paths: [n.path],
        color: g.color,
        delay: n.delay,
      })
    }
  }
}
</script>

<template>
  <div class="skills">
    <!-- 全端统一：电路板走线技能树；移动端保持设计宽度，横向滑动查看 -->
    <div ref="viewport" class="tree-viewport">
      <div v-reveal class="tree" role="img" aria-label="技能树：电路板走线风格" @pointerleave="hoverOut($event)" @click="boardTap">
        <svg class="tree-svg" :viewBox="`-610 ${VB_TOP} ${VB_W} ${VB_H}`">
          <!-- 主干与支线走线 -->
          <path v-for="(l, i) in links" :key="i" class="link" :class="{ dim: linkDim(l), on: linkOn(l) }" :d="l.d"
            pathLength="1" :style="{ '--c': l.color, '--d': `${l.delay}s` }" />

          <!-- 丝印文字 -->
          <g class="silk">
            <text x="-560" y="368" class="silk-text">SKILL-BOARD REV.2026-10 · TAKAMIYA</text>
            <text x="560" y="368" class="silk-text" text-anchor="end">2-LAYER · FR-4 · RoHS</text>
          </g>
        </svg>

        <!-- 根/分组/技能胶囊（HTML 覆盖层） -->
        <div class="root-pill" :style="{ left: `${rootPos.left}%`, top: `${rootPos.top}%` }">
          <Icon name="lucide:network" size="19" />
          技能树
        </div>
        <div v-for="g in groupNodes" :key="g.path" class="group-pill"
          :class="{ dim: hoveredPath !== null && !isOn(g.path) }"
          :style="{ left: `${pctX(g.x)}%`, top: `${pctY(g.y)}%`, '--d': `${g.delay}s`, '--c': g.color }"
          @pointerenter="hoverIn(g.path, $event)" @pointerleave="hoverOut($event)" @click="tapSelect(g.path)">
          <Icon :name="g.icon" size="17" />
          {{ g.name }}
        </div>
        <div v-for="n in skillNodes" :key="n.path" class="skill-pill"
          :class="{ hub: n.hub, dim: hoveredPath !== null && !isOn(n.path), on: isOn(n.path) }"
          :style="{ left: `${pctX(n.x)}%`, top: `${pctY(n.y)}%`, '--d': `${n.delay}s`, '--c': n.color }"
          @pointerenter="hoverIn(n.path, $event)" @pointerleave="hoverOut($event)" @click="tapSelect(n.path)">
          <span v-if="n.icon" class="pill-icon">
            <Icon :name="n.icon" size="15" />
          </span>
          {{ n.name }}
        </div>
      </div>
    </div>
    <p class="scroll-hint" aria-hidden="true">← 左右滑动查看完整技能树 →</p>
  </div>
</template>

<style scoped>
.skills {
  padding-top: 0.5rem;
}

/* ---- 电路板：板框 + 覆铜点阵背景 ---- */
.tree {
  position: relative;
  max-width: 71rem;
  margin: 0 auto;
  user-select: none;
  background:
    radial-gradient(color-mix(in srgb, var(--muted) 15%, transparent) 1px, transparent 1.4px) center / 26px 26px,
    var(--bg-soft);
  border: 1px solid color-mix(in srgb, var(--muted) 22%, transparent);
  border-radius: 20px;
}

.tree-svg {
  display: block;
  width: 100%;
  height: auto;
}

.link {
  fill: none;
  /* 颜色百分比代替 opacity 调制：同组走线的重合段不会叠加发亮 */
  stroke: color-mix(in srgb, var(--c) 55%, transparent);
  stroke-width: 1.7;
  stroke-dasharray: 1;
  transition:
    stroke 0.25s ease,
    stroke-width 0.25s ease;
  pointer-events: none;
}

.link.dim {
  stroke: color-mix(in srgb, var(--c) 7%, transparent);
}

.link.on {
  stroke: color-mix(in srgb, var(--c) 95%, transparent);
  stroke-width: 2.6;
}

/* ---- 丝印文字 ---- */
.silk {
  fill: none;
  stroke: none;
  pointer-events: none;
}

.silk-text {
  fill: color-mix(in srgb, var(--muted) 45%, transparent);
  stroke: none;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
}

/* ---- 根芯片与分组/技能胶囊 ---- */
.root-pill,
.group-pill,
.skill-pill {
  position: absolute;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.root-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 1.15rem;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--on-accent);
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-radius: 10px;
  box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 40%, transparent);
}

/* 引脚 1 标记：芯片左上角的小圆点 */
.root-pill::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg) 45%, transparent);
}

.group-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.9rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
  background: color-mix(in srgb, var(--bg-soft) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  border-radius: 8px;
  transition:
    opacity 0.25s ease,
    transform 0.3s var(--ease-bouncy);
}

.group-pill svg {
  color: var(--c);
}

.group-pill:hover {
  transform: translate(-50%, -50%) scale(1.08);
}

.group-pill.dim {
  opacity: 0.3;
}

/* ---- 技能芯片：品牌图标 + 文字，进阶中间节点边框更亮 ---- */
.skill-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  padding: 0.14rem 0.65rem 0.14rem 0.52rem;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--text);
  background: color-mix(in srgb, var(--bg-soft) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 38%, transparent);
  border-radius: 5px;
  transition:
    opacity 0.25s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.3s var(--ease-bouncy);
}

.pill-icon {
  display: inline-flex;
  color: var(--c);
  /* 同色微光：让品牌标在暗底上有一点点"通电"感 */
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--c) 55%, transparent));
}

.skill-pill.hub {
  border-color: color-mix(in srgb, var(--c) 65%, transparent);
  font-weight: 600;
}

.skill-pill.on {
  border-color: var(--c);
  box-shadow: 0 0 10px color-mix(in srgb, var(--c) 30%, transparent);
}

.skill-pill.dim {
  opacity: 0.25;
}

/* ---- 入场：走线生长 + 芯片依次点亮 ---- */
.reveal--visible .link {
  animation: link-draw 0.8s ease var(--d) backwards;
}

@keyframes link-draw {
  from {
    stroke-dashoffset: 1;
  }
}

.reveal--visible .skill-pill,
.reveal--visible .group-pill,
.reveal--visible .root-pill {
  animation: fade-in 0.5s ease var(--d, 0s) backwards;
}

.reveal--visible .silk {
  animation: fade-in 0.8s ease 1.1s backwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/* ---- 横向滚动容器：桌面端不产生滚动条，移动端容纳 1220px 设计宽度 ---- */
.tree-viewport {
  overflow-x: auto;
  /* 显式锁死纵轴：单轴 auto 会把另一轴的 visible 强算成 auto，
     入场浮现的 translateY(1.6rem) 便会撑出瞬时纵向滚动条 */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--muted) transparent;
}

.scroll-hint {
  display: none;
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: center;
}

/* 响应式切换须放在 display 声明之后，否则会被同优先级规则覆盖 */
@media (max-width: 899px) {

  /* 胶囊是固定字号的 HTML 覆盖层，窄屏下按 SVG 等比缩放会互相重叠，
     因此固定为布局设计宽度，靠横向滑动查看完整树 */
  .tree {
    width: 1220px;
    max-width: none;
  }

  .scroll-hint {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {

  .reveal--visible .link,
  .reveal--visible .skill-pill,
  .reveal--visible .group-pill,
  .reveal--visible .root-pill,
  .reveal--visible .silk {
    animation: none;
  }
}
</style>
